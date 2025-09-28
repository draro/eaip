import { diffJson, diffWords, diffLines } from 'diff';
import { v4 as uuidv4 } from 'uuid';
import { IAIPDocument, IVersionDiff, IChange, ISection, ISubsection } from '@/types';
import VersionDiff from '@/models/VersionDiff';

export class VersionDiffService {
  public async generateDiff(
    fromDocument: IAIPDocument,
    toDocument: IAIPDocument,
    userId: string
  ): Promise<IVersionDiff> {
    const changes: IChange[] = [];

    // Compare metadata
    const metadataChanges = this.compareMetadata(fromDocument, toDocument);
    changes.push(...metadataChanges);

    // Compare sections
    const sectionChanges = this.compareSections(fromDocument.sections, toDocument.sections);
    changes.push(...sectionChanges);

    // Generate summary
    const summary = this.generateSummary(changes);

    // Create diff record
    const diff = new VersionDiff({
      fromVersion: fromDocument.version,
      toVersion: toDocument.version,
      documentId: toDocument._id,
      changes,
      summary,
      createdBy: userId,
    });

    await diff.save();
    return diff;
  }

  private compareMetadata(fromDoc: IAIPDocument, toDoc: IAIPDocument): IChange[] {
    const changes: IChange[] = [];

    // Compare basic fields
    const fields = ['title', 'country', 'airport', 'status'];
    for (const field of fields) {
      const oldValue = (fromDoc as any)[field];
      const newValue = (toDoc as any)[field];

      if (oldValue !== newValue) {
        changes.push({
          id: uuidv4(),
          type: 'metadata',
          action: 'modified',
          path: field,
          oldValue,
          newValue,
          description: `${field.charAt(0).toUpperCase() + field.slice(1)} changed from "${oldValue}" to "${newValue}"`,
          timestamp: new Date(),
        });
      }
    }

    // Compare metadata object
    const metadataChanges = this.compareObjects(
      fromDoc.metadata,
      toDoc.metadata,
      'metadata'
    );
    changes.push(...metadataChanges);

    return changes;
  }

  private compareSections(fromSections: ISection[], toSections: ISection[]): IChange[] {
    const changes: IChange[] = [];

    // Create maps for easier comparison
    const fromSectionMap = new Map(fromSections.map(s => [s.id, s]));
    const toSectionMap = new Map(toSections.map(s => [s.id, s]));

    // Find removed sections
    for (const [id, section] of fromSectionMap) {
      if (!toSectionMap.has(id)) {
        changes.push({
          id: uuidv4(),
          type: 'section',
          action: 'removed',
          path: `sections.${section.type}`,
          sectionType: section.type,
          oldValue: section,
          description: `Section ${section.type} "${section.title}" was removed`,
          timestamp: new Date(),
        });
      }
    }

    // Find added and modified sections
    for (const [id, section] of toSectionMap) {
      const fromSection = fromSectionMap.get(id);

      if (!fromSection) {
        // Added section
        changes.push({
          id: uuidv4(),
          type: 'section',
          action: 'added',
          path: `sections.${section.type}`,
          sectionType: section.type,
          newValue: section,
          description: `Section ${section.type} "${section.title}" was added`,
          timestamp: new Date(),
        });
      } else {
        // Compare section properties
        if (fromSection.title !== section.title) {
          changes.push({
            id: uuidv4(),
            type: 'section',
            action: 'modified',
            path: `sections.${section.type}.title`,
            sectionType: section.type,
            oldValue: fromSection.title,
            newValue: section.title,
            description: `Section ${section.type} title changed from "${fromSection.title}" to "${section.title}"`,
            timestamp: new Date(),
          });
        }

        // Compare subsections
        const subsectionChanges = this.compareSubsections(
          fromSection.subsections,
          section.subsections,
          section.type
        );
        changes.push(...subsectionChanges);
      }
    }

    return changes;
  }

  private compareSubsections(
    fromSubsections: ISubsection[],
    toSubsections: ISubsection[],
    sectionType: 'GEN' | 'ENR' | 'AD'
  ): IChange[] {
    const changes: IChange[] = [];

    const fromSubMap = new Map(fromSubsections.map(s => [s.id, s]));
    const toSubMap = new Map(toSubsections.map(s => [s.id, s]));

    // Find removed subsections
    for (const [id, subsection] of fromSubMap) {
      if (!toSubMap.has(id)) {
        changes.push({
          id: uuidv4(),
          type: 'subsection',
          action: 'removed',
          path: `sections.${sectionType}.subsections.${subsection.code}`,
          sectionType,
          sectionCode: subsection.code,
          oldValue: subsection,
          description: `Subsection ${subsection.code} "${subsection.title}" was removed`,
          timestamp: new Date(),
        });
      }
    }

    // Find added and modified subsections
    for (const [id, subsection] of toSubMap) {
      const fromSubsection = fromSubMap.get(id);

      if (!fromSubsection) {
        // Added subsection
        changes.push({
          id: uuidv4(),
          type: 'subsection',
          action: 'added',
          path: `sections.${sectionType}.subsections.${subsection.code}`,
          sectionType,
          sectionCode: subsection.code,
          newValue: subsection,
          description: `Subsection ${subsection.code} "${subsection.title}" was added`,
          timestamp: new Date(),
        });
      } else {
        // Compare subsection properties
        if (fromSubsection.title !== subsection.title) {
          changes.push({
            id: uuidv4(),
            type: 'subsection',
            action: 'modified',
            path: `sections.${sectionType}.subsections.${subsection.code}.title`,
            sectionType,
            sectionCode: subsection.code,
            oldValue: fromSubsection.title,
            newValue: subsection.title,
            description: `Subsection ${subsection.code} title changed from "${fromSubsection.title}" to "${subsection.title}"`,
            timestamp: new Date(),
          });
        }

        // Compare content
        const contentChanges = this.compareContent(
          fromSubsection.content,
          subsection.content,
          sectionType,
          subsection.code
        );
        changes.push(...contentChanges);
      }
    }

    return changes;
  }

  private compareContent(
    fromContent: any,
    toContent: any,
    sectionType: 'GEN' | 'ENR' | 'AD',
    sectionCode: string
  ): IChange[] {
    const changes: IChange[] = [];

    // Convert content to text for comparison
    const fromText = this.extractTextFromContent(fromContent);
    const toText = this.extractTextFromContent(toContent);

    if (fromText !== toText) {
      // Use diff library to get detailed changes
      const diff = diffWords(fromText, toText);
      let hasChanges = false;

      for (const part of diff) {
        if (part.added || part.removed) {
          hasChanges = true;
          break;
        }
      }

      if (hasChanges) {
        changes.push({
          id: uuidv4(),
          type: 'content',
          action: 'modified',
          path: `sections.${sectionType}.subsections.${sectionCode}.content`,
          sectionType,
          sectionCode,
          oldValue: fromContent,
          newValue: toContent,
          description: `Content in subsection ${sectionCode} was modified`,
          timestamp: new Date(),
        });
      }
    }

    return changes;
  }

  private extractTextFromContent(content: any): string {
    if (!content || !content.content) return '';

    let text = '';

    const extractFromNode = (node: any): void => {
      if (node.type === 'text') {
        text += node.text || '';
      } else if (node.content && Array.isArray(node.content)) {
        node.content.forEach(extractFromNode);
      }
    };

    if (Array.isArray(content.content)) {
      content.content.forEach(extractFromNode);
    }

    return text;
  }

  private compareObjects(obj1: any, obj2: any, path: string): IChange[] {
    const changes: IChange[] = [];

    const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

    for (const key of keys) {
      const value1 = obj1?.[key];
      const value2 = obj2?.[key];

      if (value1 !== value2) {
        changes.push({
          id: uuidv4(),
          type: 'metadata',
          action: 'modified',
          path: `${path}.${key}`,
          oldValue: value1,
          newValue: value2,
          description: `${key} changed from "${value1}" to "${value2}"`,
          timestamp: new Date(),
        });
      }
    }

    return changes;
  }

  private generateSummary(changes: IChange[]) {
    const summary = {
      sectionsAdded: 0,
      sectionsRemoved: 0,
      sectionsModified: 0,
      subsectionsAdded: 0,
      subsectionsRemoved: 0,
      subsectionsModified: 0,
    };

    for (const change of changes) {
      if (change.type === 'section') {
        if (change.action === 'added') summary.sectionsAdded++;
        else if (change.action === 'removed') summary.sectionsRemoved++;
        else if (change.action === 'modified') summary.sectionsModified++;
      } else if (change.type === 'subsection') {
        if (change.action === 'added') summary.subsectionsAdded++;
        else if (change.action === 'removed') summary.subsectionsRemoved++;
        else if (change.action === 'modified') summary.subsectionsModified++;
      }
    }

    return summary;
  }

  public async getDiff(
    fromVersionId: string,
    toVersionId: string,
    documentId: string
  ): Promise<IVersionDiff | null> {
    return await VersionDiff.findOne({
      fromVersion: fromVersionId,
      toVersion: toVersionId,
      documentId,
    })
      .populate('fromVersion', 'versionNumber airacCycle')
      .populate('toVersion', 'versionNumber airacCycle')
      .populate('documentId', 'title country')
      .populate('createdBy', 'name email');
  }

  public async getDocumentHistory(documentId: string): Promise<IVersionDiff[]> {
    return await VersionDiff.find({ documentId })
      .sort({ createdAt: -1 })
      .populate('fromVersion', 'versionNumber airacCycle')
      .populate('toVersion', 'versionNumber airacCycle')
      .populate('createdBy', 'name email');
  }
}

export const versionDiffService = new VersionDiffService();