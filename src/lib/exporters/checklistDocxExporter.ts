import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, BorderStyle, WidthType, Header, Footer } from 'docx';

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  checkedBy?: {
    name: string;
    email: string;
  };
  checkedAt?: Date;
}

interface ExportOptions {
  title: string;
  description?: string;
  createdBy: {
    name: string;
    email: string;
  };
  assignedTo?: {
    name: string;
    email: string;
  };
  completedAt?: Date;
  dueDate?: Date;
  items: ChecklistItem[];
  metadata?: {
    version?: string;
    airacCycle?: string;
    effectiveDate?: string;
  };
}

export class ChecklistDocxExporter {
  public async export(options: ExportOptions): Promise<Buffer> {
    const completionPercentage = Math.round(
      (options.items.filter(item => item.checked).length / options.items.length) * 100
    );

    // Build metadata section
    const metadataChildren: Paragraph[] = [
      new Paragraph({
        children: [
          new TextRun({ text: 'Created By: ', bold: true }),
          new TextRun({ text: `${options.createdBy.name} (${options.createdBy.email})` }),
        ],
        spacing: { after: 100 },
      }),
    ];

    if (options.assignedTo) {
      metadataChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Assigned To: ', bold: true }),
            new TextRun({ text: `${options.assignedTo.name} (${options.assignedTo.email})` }),
          ],
          spacing: { after: 100 },
        })
      );
    }

    if (options.dueDate) {
      metadataChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Due Date: ', bold: true }),
            new TextRun({ text: new Date(options.dueDate).toLocaleDateString() }),
          ],
          spacing: { after: 100 },
        })
      );
    }

    if (options.completedAt) {
      metadataChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Completed: ', bold: true }),
            new TextRun({ text: new Date(options.completedAt).toLocaleString() }),
          ],
          spacing: { after: 100 },
        })
      );
    }

    metadataChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Generated: ', bold: true }),
          new TextRun({ text: new Date().toLocaleString() }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Total Items: ', bold: true }),
          new TextRun({ text: options.items.length.toString() }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Completed Items: ', bold: true }),
          new TextRun({ text: options.items.filter(item => item.checked).length.toString() }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Completion: ', bold: true }),
          new TextRun({ text: `${completionPercentage}%` }),
        ],
        spacing: { after: 100 },
      })
    );

    if (options.metadata?.version) {
      metadataChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Version: ', bold: true }),
            new TextRun({ text: options.metadata.version }),
          ],
          spacing: { after: 100 },
        })
      );
    }

    if (options.metadata?.airacCycle) {
      metadataChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'AIRAC Cycle: ', bold: true }),
            new TextRun({ text: options.metadata.airacCycle }),
          ],
          spacing: { after: 100 },
        })
      );
    }

    if (options.metadata?.effectiveDate) {
      metadataChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Effective Date: ', bold: true }),
            new TextRun({ text: options.metadata.effectiveDate }),
          ],
          spacing: { after: 100 },
        })
      );
    }

    // Build description section
    const descriptionChildren: Paragraph[] = [];
    if (options.description) {
      descriptionChildren.push(
        new Paragraph({
          children: [new TextRun({ text: 'Description', bold: true })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: options.description })],
          spacing: { after: 400 },
        })
      );
    }

    // Build completion status
    const statusText = completionPercentage === 100
      ? '✓ CHECKLIST COMPLETED'
      : '⚠ CHECKLIST IN PROGRESS';

    // Build checklist items table
    const tableRows: TableRow[] = [
      // Header row
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Status', bold: true })] })],
            shading: { fill: 'F1F5F9' },
            width: { size: 10, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Item', bold: true })] })],
            shading: { fill: 'F1F5F9' },
            width: { size: 60, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Details', bold: true })] })],
            shading: { fill: 'F1F5F9' },
            width: { size: 30, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
    ];

    // Data rows
    for (const item of options.items) {
      const statusSymbol = item.checked ? '✓' : '☐';
      const detailsText = item.checked && item.checkedBy
        ? `Checked by ${item.checkedBy.name} on ${new Date(item.checkedAt!).toLocaleString()}`
        : 'Not completed';

      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: statusSymbol,
                      size: 24,
                      color: item.checked ? '16a34a' : '94a3b8',
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              shading: { fill: item.checked ? 'F0FDF4' : 'FFFFFF' },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: item.text })] })],
              shading: { fill: item.checked ? 'F0FDF4' : 'FFFFFF' },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: detailsText,
                      size: 18,
                      italics: true,
                      color: '64748B',
                    }),
                  ],
                }),
              ],
              shading: { fill: item.checked ? 'F0FDF4' : 'FFFFFF' },
            }),
          ],
        })
      );
    }

    const checklistTable = new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
        left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
        right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
      },
    });

    // Build document
    const doc = new Document({
      sections: [{
        properties: {},
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${options.title} - Checklist Export`,
                    size: 24,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Generated: ${new Date().toLocaleDateString()}`,
                    size: 20,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: [
          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: options.title,
                bold: true,
                size: 32,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Checklist Export',
                size: 24,
                color: '64748B',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
          }),

          // Metadata section
          new Paragraph({
            children: [new TextRun({ text: 'Checklist Information', bold: true })],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          ...metadataChildren,

          // Description section
          ...descriptionChildren,

          // Status
          new Paragraph({
            children: [
              new TextRun({
                text: statusText,
                bold: true,
                size: 28,
                color: completionPercentage === 100 ? '166534' : '854D0E',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 400 },
          }),

          // Checklist items heading
          new Paragraph({
            children: [new TextRun({ text: 'Checklist Items', bold: true })],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          // Checklist table
          checklistTable,
        ],
      }],
    });

    return await Packer.toBuffer(doc);
  }
}
