import GitVersion from '@/models/GitVersion';
import ChecklistInstance from '@/models/ChecklistInstance';
import DocumentFile from '@/models/DocumentFile';
import { createHash } from 'crypto';

export interface CommitOptions {
  documentId: string;
  documentType: 'checklist_instance' | 'file';
  authorId: string;
  authorName: string;
  authorEmail: string;
  organizationId: string;
  message: string;
  changes?: Array<{
    path: string;
    type: 'added' | 'modified' | 'deleted';
    additions?: number;
    deletions?: number;
  }>;
}

export class GitDocumentService {
  private generateCommitHash(content: string): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(7);
    return createHash('sha256')
      .update(content + timestamp + random)
      .digest('hex')
      .substring(0, 40);
  }

  async commit(options: CommitOptions): Promise<string> {
    const {
      documentId,
      documentType,
      authorId,
      authorName,
      authorEmail,
      organizationId,
      message,
      changes = [],
    } = options;

    let snapshot: any;

    if (documentType === 'checklist_instance') {
      const instance = await ChecklistInstance.findById(documentId);
      if (!instance) {
        throw new Error('Checklist instance not found');
      }
      snapshot = instance.toObject();
    } else if (documentType === 'file') {
      const file = await DocumentFile.findById(documentId);
      if (!file) {
        throw new Error('File not found');
      }
      snapshot = file.toObject();
    } else {
      throw new Error('Invalid document type');
    }

    const previousVersion = await GitVersion.findOne({
      document: documentId,
      documentType,
    })
      .sort({ timestamp: -1 })
      .limit(1);

    const commitHash = this.generateCommitHash(JSON.stringify(snapshot));

    const version = await GitVersion.create({
      document: documentId,
      documentType,
      commitHash,
      commitMessage: message,
      author: authorId,
      authorName,
      authorEmail,
      organization: organizationId,
      fileChanges: changes,
      previousVersionHash: previousVersion?.commitHash,
      snapshot,
      timestamp: new Date(),
    });

    if (documentType === 'checklist_instance') {
      await ChecklistInstance.findByIdAndUpdate(documentId, {
        gitCommitHash: commitHash,
      });
    }

    return commitHash;
  }

  async getVersionHistory(
    documentId: string,
    documentType: 'checklist_instance' | 'file'
  ): Promise<any[]> {
    const versions = await GitVersion.find({
      document: documentId,
      documentType,
    })
      .populate('author', 'name email')
      .sort({ timestamp: -1 })
      .lean();

    return versions;
  }

  async getVersion(commitHash: string): Promise<any> {
    const version = await GitVersion.findOne({ commitHash })
      .populate('author', 'name email')
      .lean();

    if (!version) {
      throw new Error('Version not found');
    }

    return version;
  }

  async compareVersions(
    hash1: string,
    hash2: string
  ): Promise<{
    version1: any;
    version2: any;
    diff: any;
  }> {
    const version1 = await this.getVersion(hash1);
    const version2 = await this.getVersion(hash2);

    const diff = this.calculateDiff(version1.snapshot, version2.snapshot);

    return {
      version1,
      version2,
      diff,
    };
  }

  private calculateDiff(obj1: any, obj2: any): any {
    const diff: any = {
      added: [],
      removed: [],
      modified: [],
    };

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    keys2.forEach((key) => {
      if (!keys1.includes(key)) {
        diff.added.push({
          key,
          value: obj2[key],
        });
      } else if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
        diff.modified.push({
          key,
          oldValue: obj1[key],
          newValue: obj2[key],
        });
      }
    });

    keys1.forEach((key) => {
      if (!keys2.includes(key)) {
        diff.removed.push({
          key,
          value: obj1[key],
        });
      }
    });

    return diff;
  }

  async restoreVersion(
    commitHash: string,
    restoredBy: {
      id: string;
      name: string;
      email: string;
    }
  ): Promise<void> {
    const version = await this.getVersion(commitHash);

    if (!version) {
      throw new Error('Version not found');
    }

    const { document, documentType, snapshot, organization } = version;

    if (documentType === 'checklist_instance') {
      const { _id, __v, createdAt, updatedAt, gitCommitHash, ...restoreData } = snapshot;

      await ChecklistInstance.findByIdAndUpdate(document, restoreData);

      await this.commit({
        documentId: document.toString(),
        documentType: 'checklist_instance',
        authorId: restoredBy.id,
        authorName: restoredBy.name,
        authorEmail: restoredBy.email,
        organizationId: organization.toString(),
        message: `Restored to version ${commitHash.substring(0, 7)}`,
        changes: [
          {
            path: 'checklist',
            type: 'modified',
          },
        ],
      });
    } else if (documentType === 'file') {
      const { _id, __v, createdAt, updatedAt, ...restoreData } = snapshot;

      await DocumentFile.findByIdAndUpdate(document, restoreData);
    }
  }

  async getDocumentAtVersion(commitHash: string): Promise<any> {
    const version = await this.getVersion(commitHash);
    return version.snapshot;
  }

  async autoCommitChecklistChange(
    checklistId: string,
    userId: string,
    userName: string,
    userEmail: string,
    organizationId: string,
    action: string,
    itemDetails?: any
  ): Promise<string> {
    let message = '';
    let changes: Array<any> = [];

    switch (action) {
      case 'checkbox_ticked':
        message = `Checked item: ${itemDetails?.itemText || 'Unknown'}`;
        changes = [
          {
            path: `items/${itemDetails?.itemId}`,
            type: 'modified',
            additions: 1,
          },
        ];
        break;
      case 'checkbox_unticked':
        message = `Unchecked item: ${itemDetails?.itemText || 'Unknown'}`;
        changes = [
          {
            path: `items/${itemDetails?.itemId}`,
            type: 'modified',
            deletions: 1,
          },
        ];
        break;
      case 'completed':
        message = 'Checklist completed';
        changes = [
          {
            path: 'status',
            type: 'modified',
          },
        ];
        break;
      default:
        message = `Update: ${action}`;
        changes = [
          {
            path: 'checklist',
            type: 'modified',
          },
        ];
    }

    return await this.commit({
      documentId: checklistId,
      documentType: 'checklist_instance',
      authorId: userId,
      authorName: userName,
      authorEmail: userEmail,
      organizationId,
      message,
      changes,
    });
  }
}

export const gitDocumentService = new GitDocumentService();
