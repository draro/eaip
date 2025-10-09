import puppeteer from 'puppeteer';

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

export class PdfExporter {
  public async export(content: TipTapNode, options: ExportOptions): Promise<Buffer> {
    const htmlContent = this.convertToHtml(content);

    const htmlDocument = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${options.title}</title>
    <style>
        @page {
            size: A4;
            margin: 2cm;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            line-height: 1.6;
            color: #333;
            font-size: 11pt;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            margin-bottom: 30px;
            padding-bottom: 20px;
        }
        .header h1 {
            font-size: 24pt;
            margin: 0 0 10px 0;
            color: #1e40af;
        }
        .header h2 {
            font-size: 16pt;
            margin: 0;
            color: #64748b;
            font-weight: normal;
        }
        .metadata {
            background: #f8fafc;
            padding: 15px;
            border-left: 4px solid #2563eb;
            margin-bottom: 30px;
            font-size: 10pt;
        }
        .metadata p {
            margin: 5px 0;
        }
        .content h1 {
            font-size: 18pt;
            color: #1e40af;
            margin-top: 30px;
            margin-bottom: 15px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
        }
        .content h2 {
            font-size: 14pt;
            color: #334155;
            margin-top: 25px;
            margin-bottom: 12px;
        }
        .content h3 {
            font-size: 12pt;
            color: #475569;
            margin-top: 20px;
            margin-bottom: 10px;
        }
        .content p {
            margin: 10px 0;
            text-align: justify;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 10pt;
        }
        th, td {
            border: 1px solid #cbd5e1;
            padding: 10px;
            text-align: left;
        }
        th {
            background-color: #f1f5f9;
            font-weight: bold;
            color: #1e40af;
        }
        tr:nth-child(even) {
            background-color: #f8fafc;
        }
        ul, ol {
            margin: 10px 0;
            padding-left: 30px;
        }
        li {
            margin: 5px 0;
        }
        img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 20px auto;
            border: 1px solid #e2e8f0;
            padding: 5px;
        }
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 15px;
            border-top: 2px solid #e2e8f0;
            font-size: 9pt;
            text-align: center;
            color: #64748b;
            background: white;
        }
        .page-number:after {
            content: counter(page);
        }
        strong {
            font-weight: 600;
            color: #1e293b;
        }
        em {
            font-style: italic;
            color: #475569;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${this.escapeHtml(options.title)}</h1>
        <h2>Section ${this.escapeHtml(options.sectionCode)} ${this.escapeHtml(options.subsectionCode)}</h2>
    </div>

    <div class="metadata">
        <p><strong>Version:</strong> ${this.escapeHtml(options.version)}</p>
        <p><strong>AIRAC Cycle:</strong> ${this.escapeHtml(options.airacCycle)}</p>
        <p><strong>Effective Date:</strong> ${this.escapeHtml(options.effectiveDate)}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    </div>

    <div class="content">
        ${htmlContent}
    </div>

    <div class="footer">
        <p>
            ${this.escapeHtml(options.title)} |
            ${this.escapeHtml(options.sectionCode)} ${this.escapeHtml(options.subsectionCode)} |
            Version ${this.escapeHtml(options.version)} |
            Page <span class="page-number"></span>
        </p>
    </div>
</body>
</html>`;

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setContent(htmlDocument, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '2cm',
          right: '2cm',
          bottom: '3cm',
          left: '2cm'
        },
        displayHeaderFooter: false, // We're using our own footer
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private convertToHtml(node: TipTapNode): string {
    let html = '';

    switch (node.type) {
      case 'doc':
        if (node.content) {
          html += node.content.map(child => this.convertToHtml(child)).join('\n');
        }
        break;

      case 'paragraph':
        html += '<p>';
        if (node.content) {
          html += node.content.map(child => this.convertToHtml(child)).join('');
        }
        html += '</p>';
        break;

      case 'heading':
        const level = node.attrs?.level || 1;
        html += `<h${level}>`;
        if (node.content) {
          html += node.content.map(child => this.convertToHtml(child)).join('');
        }
        html += `</h${level}>`;
        break;

      case 'bulletList':
        html += '<ul>';
        if (node.content) {
          for (const listItem of node.content) {
            if (listItem.type === 'listItem') {
              html += '<li>';
              if (listItem.content) {
                html += listItem.content.map(child => this.convertToHtml(child)).join('');
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
                html += listItem.content.map(child => this.convertToHtml(child)).join('');
              }
              html += '</li>';
            }
          }
        }
        html += '</ol>';
        break;

      case 'table':
        html += '<table>';
        if (node.content) {
          for (const row of node.content) {
            if (row.type === 'tableRow') {
              html += '<tr>';
              if (row.content) {
                for (const cell of row.content) {
                  const cellTag = cell.type === 'tableHeader' ? 'th' : 'td';
                  html += `<${cellTag}>`;
                  if (cell.content) {
                    html += cell.content.map(child => this.convertToHtml(child)).join('');
                  }
                  html += `</${cellTag}>`;
                }
              }
              html += '</tr>';
            }
          }
        }
        html += '</table>';
        break;

      case 'codeBlock':
        html += '<pre><code>';
        if (node.content) {
          html += node.content.map(child => this.convertToHtml(child)).join('');
        }
        html += '</code></pre>';
        break;

      case 'blockquote':
        html += '<blockquote>';
        if (node.content) {
          html += node.content.map(child => this.convertToHtml(child)).join('');
        }
        html += '</blockquote>';
        break;

      case 'hardBreak':
        html += '<br />';
        break;

      case 'horizontalRule':
        html += '<hr />';
        break;

      case 'image':
        const src = node.attrs?.src || '';
        const alt = node.attrs?.alt || '';
        const title = node.attrs?.title || '';
        html += `<img src="${this.escapeHtml(src)}" alt="${this.escapeHtml(alt)}" title="${this.escapeHtml(title)}" />`;
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
                case 'underline':
                  text = `<u>${text}</u>`;
                  break;
                case 'strike':
                  text = `<s>${text}</s>`;
                  break;
                case 'code':
                  text = `<code>${text}</code>`;
                  break;
                case 'link':
                  const href = mark.attrs?.href || '#';
                  text = `<a href="${this.escapeHtml(href)}">${text}</a>`;
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
}