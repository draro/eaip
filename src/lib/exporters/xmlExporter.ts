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

export class XmlExporter {
  private processNode(node: TipTapNode, level = 0): string {
    let xml = '';
    const indent = '  '.repeat(level);

    switch (node.type) {
      case 'doc':
        if (node.content) {
          xml += node.content.map(child => this.processNode(child, level)).join('\n');
        }
        break;

      case 'paragraph':
        xml += `${indent}<para>\n`;
        if (node.content) {
          xml += node.content.map(child => this.processNode(child, level + 1)).join('');
        }
        xml += `\n${indent}</para>`;
        break;

      case 'heading':
        const headingLevel = node.attrs?.level || 1;
        xml += `${indent}<heading level="${headingLevel}">\n`;
        if (node.content) {
          xml += node.content.map(child => this.processNode(child, level + 1)).join('');
        }
        xml += `\n${indent}</heading>`;
        break;

      case 'bulletList':
        xml += `${indent}<list type="unordered">\n`;
        if (node.content) {
          for (const listItem of node.content) {
            if (listItem.type === 'listItem') {
              xml += `${indent}  <listItem>\n`;
              if (listItem.content) {
                xml += listItem.content.map(child => this.processNode(child, level + 2)).join('\n');
              }
              xml += `\n${indent}  </listItem>\n`;
            }
          }
        }
        xml += `${indent}</list>`;
        break;

      case 'orderedList':
        xml += `${indent}<list type="ordered">\n`;
        if (node.content) {
          for (const listItem of node.content) {
            if (listItem.type === 'listItem') {
              xml += `${indent}  <listItem>\n`;
              if (listItem.content) {
                xml += listItem.content.map(child => this.processNode(child, level + 2)).join('\n');
              }
              xml += `\n${indent}  </listItem>\n`;
            }
          }
        }
        xml += `${indent}</list>`;
        break;

      case 'table':
        xml += `${indent}<table>\n`;
        if (node.content) {
          for (const row of node.content) {
            if (row.type === 'tableRow') {
              xml += `${indent}  <tableRow>\n`;
              if (row.content) {
                for (const cell of row.content) {
                  const cellType = cell.type === 'tableHeader' ? 'tableHeader' : 'tableCell';
                  xml += `${indent}    <${cellType}>\n`;
                  if (cell.content) {
                    xml += cell.content.map(child => this.processNode(child, level + 3)).join('\n');
                  }
                  xml += `\n${indent}    </${cellType}>\n`;
                }
              }
              xml += `${indent}  </tableRow>\n`;
            }
          }
        }
        xml += `${indent}</table>`;
        break;

      case 'image':
        const imageSrc = node.attrs?.src;
        const imageAlt = node.attrs?.alt || '';
        xml += `${indent}<image src="${this.escapeXml(imageSrc || '')}" alt="${this.escapeXml(imageAlt)}" />`;
        break;

      case 'text':
        if (node.text) {
          let text = this.escapeXml(node.text);

          if (node.marks) {
            for (const mark of node.marks) {
              switch (mark.type) {
                case 'bold':
                  text = `<strong>${text}</strong>`;
                  break;
                case 'italic':
                  text = `<emphasis>${text}</emphasis>`;
                  break;
              }
            }
          }

          xml += text;
        }
        break;
    }

    return xml;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  public export(content: TipTapNode, options: ExportOptions): string {
    const contentXml = this.processNode(content, 2);

    return `<?xml version="1.0" encoding="UTF-8"?>
<eAIP xmlns="http://www.eurocontrol.int/eaip" version="3.0">
  <metadata>
    <title>${this.escapeXml(options.title)}</title>
    <sectionCode>${this.escapeXml(options.sectionCode)}</sectionCode>
    <subsectionCode>${this.escapeXml(options.subsectionCode)}</subsectionCode>
    <version>${this.escapeXml(options.version)}</version>
    <airacCycle>${this.escapeXml(options.airacCycle)}</airacCycle>
    <effectiveDate>${this.escapeXml(options.effectiveDate)}</effectiveDate>
    <generatedDate>${new Date().toISOString()}</generatedDate>
  </metadata>
  <content>
${contentXml}
  </content>
</eAIP>`;
  }
}

export class HtmlExporter {
  private processNode(node: TipTapNode): string {
    let html = '';

    switch (node.type) {
      case 'doc':
        if (node.content) {
          html += node.content.map(child => this.processNode(child)).join('\n');
        }
        break;

      case 'paragraph':
        html += '<p>';
        if (node.content) {
          html += node.content.map(child => this.processNode(child)).join('');
        }
        html += '</p>';
        break;

      case 'heading':
        const headingLevel = node.attrs?.level || 1;
        html += `<h${headingLevel}>`;
        if (node.content) {
          html += node.content.map(child => this.processNode(child)).join('');
        }
        html += `</h${headingLevel}>`;
        break;

      case 'bulletList':
        html += '<ul>';
        if (node.content) {
          for (const listItem of node.content) {
            if (listItem.type === 'listItem') {
              html += '<li>';
              if (listItem.content) {
                html += listItem.content.map(child => this.processNode(child)).join('');
              }
              html += '</li>';
            }
          }
        }
        html += '</ul>';
        break;

      case 'orderedList':
        html += '<ol>';
        if (node.content) {
          for (const listItem of node.content) {
            if (listItem.type === 'listItem') {
              html += '<li>';
              if (listItem.content) {
                html += listItem.content.map(child => this.processNode(child)).join('');
              }
              html += '</li>';
            }
          }
        }
        html += '</ol>';
        break;

      case 'table':
        html += '<table class="eaip-table">';
        if (node.content) {
          let hasHeader = false;
          for (const row of node.content) {
            if (row.type === 'tableRow') {
              const isHeaderRow = row.content?.some(cell => cell.type === 'tableHeader');
              if (isHeaderRow && !hasHeader) {
                html += '<thead>';
                hasHeader = true;
              } else if (!isHeaderRow && hasHeader) {
                html += '</thead><tbody>';
                hasHeader = false;
              }

              html += '<tr>';
              if (row.content) {
                for (const cell of row.content) {
                  const cellTag = cell.type === 'tableHeader' ? 'th' : 'td';
                  html += `<${cellTag}>`;
                  if (cell.content) {
                    html += cell.content.map(child => this.processNode(child)).join('');
                  }
                  html += `</${cellTag}>`;
                }
              }
              html += '</tr>';
            }
          }
          if (hasHeader) {
            html += '</thead>';
          } else {
            html += '</tbody>';
          }
        }
        html += '</table>';
        break;

      case 'image':
        const imageSrc = node.attrs?.src;
        const imageAlt = node.attrs?.alt || '';
        html += `<img src="${this.escapeHtml(imageSrc || '')}" alt="${this.escapeHtml(imageAlt)}" class="eaip-image" />`;
        break;

      case 'text':
        if (node.text) {
          let text = this.escapeHtml(node.text);

          if (node.marks) {
            for (const mark of node.marks) {
              switch (mark.type) {
                case 'bold':
                  text = `<strong>${text}</strong>`;
                  break;
                case 'italic':
                  text = `<em>${text}</em>`;
                  break;
              }
            }
          }

          html += text;
        }
        break;
    }

    return html;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  public export(content: TipTapNode, options: ExportOptions): string {
    const contentHtml = this.processNode(content);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(options.title)}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #333;
      margin-bottom: 30px;
      padding-bottom: 20px;
    }
    .eaip-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .eaip-table th,
    .eaip-table td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    .eaip-table th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    .eaip-image {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 20px auto;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #ccc;
      font-size: 0.9em;
      text-align: center;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${this.escapeHtml(options.title)}</h1>
    <h2>${this.escapeHtml(options.sectionCode)} ${this.escapeHtml(options.subsectionCode)}</h2>
  </div>

  <div class="content">
${contentHtml}
  </div>

  <div class="footer">
    <p>Version: ${this.escapeHtml(options.version)} | AIRAC: ${this.escapeHtml(options.airacCycle)} | Effective: ${this.escapeHtml(options.effectiveDate)}</p>
    <p>Generated: ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>`;
  }
}