import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git';
import path from 'path';
import fs from 'fs/promises';
import { IAIPDocument, IOrganization } from '@/types';

const GIT_STORAGE_PATH = process.env.GIT_STORAGE_PATH || path.join(process.cwd(), 'git-repos');

export interface GitCommitResult {
  success: boolean;
  commitHash?: string;
  message?: string;
  error?: string;
}

export interface GitDiffResult {
  additions: number;
  deletions: number;
  changes: GitChange[];
}

export interface GitChange {
  type: 'added' | 'modified' | 'deleted';
  path: string;
  oldContent?: string;
  newContent?: string;
  diff?: string;
  hunks?: GitHunk[];
}

export interface GitHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[];
}

export class GitService {
  private gitInstances: Map<string, SimpleGit> = new Map();

  /**
   * Initialize a Git repository for an organization
   */
  public async initializeOrgRepository(
    orgId: string,
    orgName: string,
    orgSlug: string
  ): Promise<{ success: boolean; repoPath?: string; error?: string }> {
    try {
      const repoPath = this.getRepoPath(orgId);

      // Check if repository already exists
      const repoExists = await this.checkRepoExists(repoPath);
      if (repoExists) {
        return { success: true, repoPath };
      }

      // Create directory structure
      await fs.mkdir(repoPath, { recursive: true });
      await fs.mkdir(path.join(repoPath, 'documents'), { recursive: true });
      await fs.mkdir(path.join(repoPath, 'metadata'), { recursive: true });

      // Initialize Git repository
      const git = simpleGit(repoPath);
      await git.init();

      // Configure Git
      await git.addConfig('user.name', `eAIP System - ${orgName}`);
      await git.addConfig('user.email', `eaip-${orgSlug}@system.local`);
      await git.addConfig('core.autocrlf', 'false');
      await git.addConfig('core.safecrlf', 'false');

      // Create initial README
      const readmeContent = `# ${orgName} - eAIP Document Repository

Organization ID: ${orgId}
Created: ${new Date().toISOString()}

This repository contains all AIP (Aeronautical Information Publication) documents
and their complete revision history for ${orgName}.

## Structure
- /documents - AIP document JSON files
- /metadata - Document metadata and configuration
`;

      await fs.writeFile(path.join(repoPath, 'README.md'), readmeContent);
      await git.add('README.md');
      await git.commit('Initial repository setup', { '--author': `eAIP System <system@eaip.local>` });

      this.gitInstances.set(orgId, git);

      console.log(`✓ Git repository initialized for organization ${orgId} at ${repoPath}`);
      return { success: true, repoPath };
    } catch (error: any) {
      console.error(`Error initializing Git repository for org ${orgId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Commit document changes to Git
   */
  public async commitDocument(
    orgId: string,
    document: IAIPDocument,
    userId: string,
    userName: string,
    userEmail: string,
    commitMessage?: string
  ): Promise<GitCommitResult> {
    try {
      const git = await this.getGitInstance(orgId);
      const repoPath = this.getRepoPath(orgId);

      // Prepare document data for storage
      const documentData = this.prepareDocumentForStorage(document);

      // Create file path
      const docFileName = `${document._id}.json`;
      const docFilePath = path.join(repoPath, 'documents', docFileName);

      // Write document to file
      await fs.writeFile(
        docFilePath,
        JSON.stringify(documentData, null, 2),
        'utf-8'
      );

      // Also store metadata separately for easier tracking
      const metadataPath = path.join(repoPath, 'metadata', `${document._id}.meta.json`);
      await fs.writeFile(
        metadataPath,
        JSON.stringify({
          documentId: document._id,
          title: document.title,
          country: document.country,
          airport: document.airport,
          status: document.status,
          airacCycle: document.airacCycle,
          effectiveDate: document.effectiveDate,
          lastModified: new Date().toISOString(),
          modifiedBy: userName,
        }, null, 2),
        'utf-8'
      );

      // Stage files
      await git.add([
        `documents/${docFileName}`,
        `metadata/${document._id}.meta.json`
      ]);

      // Check if there are changes to commit
      const status = await git.status();
      if (status.files.length === 0) {
        return {
          success: true,
          message: 'No changes to commit'
        };
      }

      // Create commit message
      const message = commitMessage || this.generateCommitMessage(document, status);

      // Commit with author information
      const author = `${userName} <${userEmail}>`;
      const commitResult = await git.commit(message, {
        '--author': author
      });

      console.log(`✓ Committed document ${document._id} to Git: ${commitResult.commit}`);

      return {
        success: true,
        commitHash: commitResult.commit,
        message: commitResult.summary.changes + ' file(s) changed'
      };
    } catch (error: any) {
      console.error(`Error committing document to Git:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get diff between two commits or versions
   */
  public async getDiff(
    orgId: string,
    fromCommit: string,
    toCommit: string = 'HEAD'
  ): Promise<GitDiffResult> {
    try {
      const git = await this.getGitInstance(orgId);

      // Get diff summary
      const diffSummary = await git.diffSummary([fromCommit, toCommit]);

      // Get detailed diff
      const diff = await git.diff([fromCommit, toCommit]);

      // Parse changes
      const changes: GitChange[] = [];

      for (const file of diffSummary.files) {
        const changeType: 'added' | 'modified' | 'deleted' =
          file.binary ? 'modified' :
          diffSummary.insertions > 0 && diffSummary.deletions === 0 ? 'added' :
          diffSummary.deletions > 0 && diffSummary.insertions === 0 ? 'deleted' :
          'modified';

        // Get old and new content
        let oldContent, newContent;
        try {
          if (changeType !== 'added') {
            oldContent = await git.show([`${fromCommit}:${file.file}`]);
          }
          if (changeType !== 'deleted') {
            newContent = await git.show([`${toCommit}:${file.file}`]);
          }
        } catch (e) {
          // File might not exist in one of the commits
        }

        const fileDiff = diff.includes(file.file) ? this.extractFileDiff(diff, file.file) : undefined;

        changes.push({
          type: changeType,
          path: file.file,
          oldContent,
          newContent,
          diff: fileDiff,
          hunks: fileDiff ? this.parseDiffIntoHunks(fileDiff) : undefined
        });
      }

      return {
        additions: diffSummary.insertions,
        deletions: diffSummary.deletions,
        changes
      };
    } catch (error: any) {
      console.error(`Error getting Git diff:`, error);
      throw error;
    }
  }

  /**
   * Get commit history for a document
   */
  public async getDocumentHistory(
    orgId: string,
    documentId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const git = await this.getGitInstance(orgId);

      const log = await git.log({
        file: `documents/${documentId}.json`,
        maxCount: limit
      });

      return log.all.map(commit => ({
        hash: commit.hash,
        date: commit.date,
        message: commit.message,
        author: commit.author_name,
        email: commit.author_email,
      }));
    } catch (error: any) {
      console.error(`Error getting document history:`, error);
      return [];
    }
  }

  /**
   * Restore document to a specific commit
   */
  public async restoreDocument(
    orgId: string,
    documentId: string,
    commitHash: string
  ): Promise<{ success: boolean; document?: any; error?: string }> {
    try {
      const git = await this.getGitInstance(orgId);

      // Get file content at specific commit
      const fileContent = await git.show([`${commitHash}:documents/${documentId}.json`]);
      const document = JSON.parse(fileContent);

      return {
        success: true,
        document
      };
    } catch (error: any) {
      console.error(`Error restoring document from Git:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a branch for draft/review workflows
   */
  public async createBranch(
    orgId: string,
    branchName: string,
    fromBranch: string = 'main'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const git = await this.getGitInstance(orgId);

      await git.checkoutBranch(branchName, fromBranch);

      return { success: true };
    } catch (error: any) {
      console.error(`Error creating Git branch:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Merge branch (e.g., when approving a review)
   */
  public async mergeBranch(
    orgId: string,
    sourceBranch: string,
    targetBranch: string = 'main',
    userName: string,
    userEmail: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const git = await this.getGitInstance(orgId);

      // Checkout target branch
      await git.checkout(targetBranch);

      // Merge source branch
      await git.merge([sourceBranch, '--no-ff'], {
        '--author': `${userName} <${userEmail}>`
      });

      return { success: true };
    } catch (error: any) {
      console.error(`Error merging Git branch:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Tag a version (for published AIPs)
   */
  public async tagVersion(
    orgId: string,
    tagName: string,
    message: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const git = await this.getGitInstance(orgId);

      await git.addAnnotatedTag(tagName, message);

      return { success: true };
    } catch (error: any) {
      console.error(`Error creating Git tag:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all tags
   */
  public async getTags(orgId: string): Promise<string[]> {
    try {
      const git = await this.getGitInstance(orgId);
      const tags = await git.tags();
      return tags.all;
    } catch (error: any) {
      console.error(`Error getting Git tags:`, error);
      return [];
    }
  }

  /**
   * Compare current document with previous version
   */
  public async compareWithPrevious(
    orgId: string,
    documentId: string
  ): Promise<GitDiffResult | null> {
    try {
      const history = await this.getDocumentHistory(orgId, documentId, 2);

      if (history.length < 2) {
        return null; // No previous version
      }

      return await this.getDiff(orgId, history[1].hash, history[0].hash);
    } catch (error) {
      return null;
    }
  }

  // Private helper methods

  private getRepoPath(orgId: string): string {
    return path.join(GIT_STORAGE_PATH, orgId);
  }

  private async getGitInstance(orgId: string): Promise<SimpleGit> {
    if (this.gitInstances.has(orgId)) {
      return this.gitInstances.get(orgId)!;
    }

    const repoPath = this.getRepoPath(orgId);
    const exists = await this.checkRepoExists(repoPath);

    if (!exists) {
      throw new Error(`Git repository for organization ${orgId} does not exist`);
    }

    const git = simpleGit(repoPath);
    this.gitInstances.set(orgId, git);
    return git;
  }

  private async checkRepoExists(repoPath: string): Promise<boolean> {
    try {
      await fs.access(path.join(repoPath, '.git'));
      return true;
    } catch {
      return false;
    }
  }

  private prepareDocumentForStorage(document: IAIPDocument): any {
    // Create a clean copy for storage (remove MongoDB-specific fields)
    const { __v, ...cleanDoc } = document.toObject ? document.toObject() : document;
    return cleanDoc;
  }

  private generateCommitMessage(document: IAIPDocument, status: any): string {
    const action = status.created.length > 0 ? 'Create' :
                   status.modified.length > 0 ? 'Update' :
                   status.deleted.length > 0 ? 'Delete' : 'Modify';

    return `${action} document: ${document.title}\n\nDocument ID: ${document._id}\nAIRAC Cycle: ${document.airacCycle}\nStatus: ${document.status}`;
  }

  private extractFileDiff(fullDiff: string, fileName: string): string {
    const lines = fullDiff.split('\n');
    let inFile = false;
    let fileDiff = '';

    for (const line of lines) {
      if (line.startsWith('diff --git') && line.includes(fileName)) {
        inFile = true;
      } else if (inFile && line.startsWith('diff --git')) {
        break;
      }

      if (inFile) {
        fileDiff += line + '\n';
      }
    }

    return fileDiff;
  }

  private parseDiffIntoHunks(diffText: string): GitHunk[] {
    const hunks: GitHunk[] = [];
    const lines = diffText.split('\n');
    let currentHunk: GitHunk | null = null;

    for (const line of lines) {
      // Match hunk header: @@ -oldStart,oldLines +newStart,newLines @@
      const hunkHeaderMatch = line.match(/^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);

      if (hunkHeaderMatch) {
        // Save previous hunk if exists
        if (currentHunk) {
          hunks.push(currentHunk);
        }

        // Create new hunk
        currentHunk = {
          oldStart: parseInt(hunkHeaderMatch[1]),
          oldLines: parseInt(hunkHeaderMatch[2] || '1'),
          newStart: parseInt(hunkHeaderMatch[3]),
          newLines: parseInt(hunkHeaderMatch[4] || '1'),
          lines: []
        };
      } else if (currentHunk && (line.startsWith('+') || line.startsWith('-') || line.startsWith(' '))) {
        // Add line to current hunk
        currentHunk.lines.push(line);
      }
    }

    // Save last hunk
    if (currentHunk) {
      hunks.push(currentHunk);
    }

    return hunks;
  }
}

export const gitService = new GitService();
