import { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, Header, Footer } from 'docx';
import fs from 'fs/promises';
import path from 'path';

interface TipTapNode {
  type: string;
  content?: TipTapNode[];
  attrs?: any;
  text?: string;
  marks?: any[];
}

interface ExportOptions {
  title: string;
  sectionCode: string;
  subsectionCode: string;
  version: string;
  airacCycle: string;
  effectiveDate: string;
}

export class DocxExporter {
  private async processNode(node: TipTapNode): Promise<any[]> {
    const elements: any[] = [];

    switch (node.type) {
      case 'doc':
        if (node.content) {
          for (const child of node.content) {
            elements.push(...await this.processNode(child));
          }
        }
        break;

      case 'paragraph':
        const runs: TextRun[] = [];
        if (node.content) {
          for (const child of node.content) {
            runs.push(...await this.processTextNode(child));
          }
        }
        elements.push(new Paragraph({
          children: runs,
          spacing: { after: 200 },
        }));
        break;

      case 'heading':
        const headingLevel = node.attrs?.level || 1;
        const headingRuns: TextRun[] = [];
        if (node.content) {
          for (const child of node.content) {
            headingRuns.push(...await this.processTextNode(child));
          }
        }
        elements.push(new Paragraph({
          children: headingRuns,
          heading: this.getHeadingLevel(headingLevel),
          spacing: { before: 400, after: 200 },
        }));
        break;

      case 'bulletList':
        if (node.content) {
          for (const listItem of node.content) {
            if (listItem.type === 'listItem' && listItem.content) {
              for (const listItemContent of listItem.content) {
                const listRuns: TextRun[] = [];
                if (listItemContent.content) {
                  for (const child of listItemContent.content) {
                    listRuns.push(...await this.processTextNode(child));
                  }
                }
                elements.push(new Paragraph({
                  children: [new TextRun('• '), ...listRuns],
                  indent: { left: 720 },
                  spacing: { after: 100 },
                }));
              }
            }
          }
        }
        break;

      case 'orderedList':
        if (node.content) {
          let counter = 1;
          for (const listItem of node.content) {
            if (listItem.type === 'listItem' && listItem.content) {
              for (const listItemContent of listItem.content) {
                const listRuns: TextRun[] = [];
                if (listItemContent.content) {
                  for (const child of listItemContent.content) {
                    listRuns.push(...await this.processTextNode(child));
                  }
                }
                elements.push(new Paragraph({
                  children: [new TextRun(`${counter}. `), ...listRuns],
                  indent: { left: 720 },
                  spacing: { after: 100 },
                }));
                counter++;
              }
            }
          }
        }
        break;

      case 'table':
        if (node.content) {
          const rows: TableRow[] = [];
          for (const row of node.content) {
            if (row.type === 'tableRow' && row.content) {
              const cells: TableCell[] = [];
              for (const cell of row.content) {
                const cellElements: any[] = [];
                if (cell.content) {
                  for (const cellContent of cell.content) {
                    cellElements.push(...await this.processNode(cellContent));
                  }
                }
                cells.push(new TableCell({
                  children: cellElements.length > 0 ? cellElements : [new Paragraph({ children: [new TextRun('')] })],
                  margins: { top: 100, bottom: 100, left: 100, right: 100 },
                }));
              }
              rows.push(new TableRow({ children: cells }));
            }
          }
          elements.push(new Table({
            rows,
            width: { size: 100, type: 'pct' },
          }));
        }
        break;

      case 'image':
        const imageSrc = node.attrs?.src;
        if (imageSrc) {
          try {
            const imageBuffer = await this.loadImage(imageSrc);
            elements.push(new Paragraph({
              children: [new ImageRun({
                data: imageBuffer,
                transformation: {
                  width: 400,
                  height: 300,
                },
              })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 200, after: 200 },
            }));
          } catch (error) {
            console.error('Failed to load image:', error);
            elements.push(new Paragraph({
              children: [new TextRun(`[Image: ${imageSrc}]`)],
              spacing: { after: 200 },
            }));
          }
        }
        break;
    }

    return elements;
  }

  private async processTextNode(node: TipTapNode): Promise<TextRun[]> {
    if (node.type === 'text' && node.text) {
      const formatting: any = {};

      if (node.marks) {
        for (const mark of node.marks) {
          switch (mark.type) {
            case 'bold':
              formatting.bold = true;
              break;
            case 'italic':
              formatting.italics = true;
              break;
          }
        }
      }

      return [new TextRun({ text: node.text, ...formatting })];
    }
    return [];
  }

  private getHeadingLevel(level: number): HeadingLevel {
    switch (level) {
      case 1: return HeadingLevel.HEADING_1;
      case 2: return HeadingLevel.HEADING_2;
      case 3: return HeadingLevel.HEADING_3;
      default: return HeadingLevel.HEADING_1;
    }
  }

  private async loadImage(src: string): Promise<Buffer> {
    if (src.startsWith('/uploads/')) {
      const imagePath = path.join(process.cwd(), 'public', src);
      return await fs.readFile(imagePath);
    } else if (src.startsWith('http')) {
      const response = await fetch(src);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
    throw new Error(`Unsupported image source: ${src}`);
  }

  public async export(content: TipTapNode, options: ExportOptions): Promise<Buffer> {
    const elements = await this.processNode(content);

    const doc = new Document({
      sections: [{
        properties: {},
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${options.sectionCode} ${options.subsectionCode} - ${options.title}`,
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
                    text: `Version: ${options.version} | AIRAC: ${options.airacCycle} | Effective: ${options.effectiveDate}`,
                    size: 20,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: options.title,
                bold: true,
                size: 32,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `${options.sectionCode} ${options.subsectionCode}`,
                bold: true,
                size: 24,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          ...elements,
        ],
      }],
    });

    return await Packer.toBuffer(doc);
  }
}

