import puppeteer from 'puppeteer';

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

export class ChecklistPdfExporter {
  public async export(options: ExportOptions): Promise<Buffer> {
    const itemsHtml = options.items.map((item, index) => {
      const checkmark = item.checked ? '✓' : '☐';
      const checkedClass = item.checked ? 'checked' : 'unchecked';
      const checkedInfo = item.checked && item.checkedBy
        ? `<div class="checked-info">Checked by ${this.escapeHtml(item.checkedBy.name)} on ${new Date(item.checkedAt!).toLocaleString()}</div>`
        : '';

      return `
        <div class="checklist-item ${checkedClass}">
          <div class="checkbox">${checkmark}</div>
          <div class="item-content">
            <div class="item-text">${this.escapeHtml(item.text)}</div>
            ${checkedInfo}
          </div>
        </div>
      `;
    }).join('');

    const completionPercentage = Math.round(
      (options.items.filter(item => item.checked).length / options.items.length) * 100
    );

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
        .header .subtitle {
            font-size: 12pt;
            color: #64748b;
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
        .metadata strong {
            font-weight: 600;
            color: #1e293b;
        }
        .progress-bar {
            background: #e2e8f0;
            border-radius: 8px;
            height: 30px;
            margin: 20px 0;
            overflow: hidden;
        }
        .progress-fill {
            background: linear-gradient(to right, #2563eb, #3b82f6);
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12pt;
            width: ${completionPercentage}%;
        }
        .description {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin-bottom: 20px;
            font-size: 10pt;
        }
        .checklist-items {
            margin: 30px 0;
        }
        .checklist-item {
            display: flex;
            align-items: flex-start;
            padding: 15px;
            margin-bottom: 10px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            page-break-inside: avoid;
        }
        .checklist-item.checked {
            background: #f0fdf4;
            border-color: #86efac;
        }
        .checklist-item.unchecked {
            background: #ffffff;
            border-color: #e2e8f0;
        }
        .checkbox {
            font-size: 20pt;
            margin-right: 15px;
            min-width: 30px;
            font-weight: bold;
        }
        .checklist-item.checked .checkbox {
            color: #16a34a;
        }
        .checklist-item.unchecked .checkbox {
            color: #94a3b8;
        }
        .item-content {
            flex: 1;
        }
        .item-text {
            font-size: 11pt;
            color: #1e293b;
            margin-bottom: 5px;
        }
        .checked-info {
            font-size: 9pt;
            color: #64748b;
            font-style: italic;
        }
        .completion-status {
            text-align: center;
            padding: 20px;
            margin: 30px 0;
            border-radius: 8px;
            font-size: 14pt;
            font-weight: bold;
        }
        .completion-status.complete {
            background: #dcfce7;
            color: #166534;
            border: 2px solid #86efac;
        }
        .completion-status.incomplete {
            background: #fef9c3;
            color: #854d0e;
            border: 2px solid #fde047;
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
    </style>
</head>
<body>
    <div class="header">
        <h1>${this.escapeHtml(options.title)}</h1>
        <div class="subtitle">Checklist Export</div>
    </div>

    <div class="metadata">
        <p><strong>Created By:</strong> ${this.escapeHtml(options.createdBy.name)} (${this.escapeHtml(options.createdBy.email)})</p>
        ${options.assignedTo ? `<p><strong>Assigned To:</strong> ${this.escapeHtml(options.assignedTo.name)} (${this.escapeHtml(options.assignedTo.email)})</p>` : ''}
        ${options.dueDate ? `<p><strong>Due Date:</strong> ${new Date(options.dueDate).toLocaleDateString()}</p>` : ''}
        ${options.completedAt ? `<p><strong>Completed:</strong> ${new Date(options.completedAt).toLocaleString()}</p>` : ''}
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Total Items:</strong> ${options.items.length}</p>
        <p><strong>Completed Items:</strong> ${options.items.filter(item => item.checked).length}</p>
        ${options.metadata?.version ? `<p><strong>Version:</strong> ${this.escapeHtml(options.metadata.version)}</p>` : ''}
        ${options.metadata?.airacCycle ? `<p><strong>AIRAC Cycle:</strong> ${this.escapeHtml(options.metadata.airacCycle)}</p>` : ''}
        ${options.metadata?.effectiveDate ? `<p><strong>Effective Date:</strong> ${this.escapeHtml(options.metadata.effectiveDate)}</p>` : ''}
    </div>

    ${options.description ? `
    <div class="description">
        <strong>Description:</strong><br/>
        ${this.escapeHtml(options.description)}
    </div>
    ` : ''}

    <div class="progress-bar">
        <div class="progress-fill">${completionPercentage}% Complete</div>
    </div>

    <div class="completion-status ${completionPercentage === 100 ? 'complete' : 'incomplete'}">
        ${completionPercentage === 100 ? '✓ CHECKLIST COMPLETED' : '⚠ CHECKLIST IN PROGRESS'}
    </div>

    <div class="checklist-items">
        <h2 style="color: #1e40af; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Checklist Items</h2>
        ${itemsHtml}
    </div>

    <div class="footer">
        <p>
            ${this.escapeHtml(options.title)} |
            Generated ${new Date().toLocaleDateString()} |
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
        displayHeaderFooter: false,
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
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
