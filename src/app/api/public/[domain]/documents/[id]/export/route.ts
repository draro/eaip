import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIPDocument from '@/models/AIPDocument';
import Organization from '@/models/Organization';
import AIPVersion from '@/models/AIPVersion';
import { withAuth } from '@/lib/apiMiddleware';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun, TableOfContents, Bookmark, InternalHyperlink, ExternalHyperlink, PageBreak } from 'docx';
import { formatAiracCycle } from '@/lib/utils';

// Helper to strip HTML tags for plain text
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

// Helper to convert HTML to DOCX paragraphs
function htmlToDocxParagraphs(html: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Simple HTML parsing - split by common tags
  const content = stripHtml(html);
  const lines = content.split('\n\n');

  lines.forEach(line => {
    if (line.trim()) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun(line.trim())],
          spacing: { after: 200 }
        })
      );
    }
  });

  return paragraphs.length > 0 ? paragraphs : [new Paragraph('')];
}

// Public exports (DOCX, PDF) - no auth required
export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string; id: string } }
) {
  try {
    await connectDB();

    // Ensure AIPVersion model is registered
    if (!AIPVersion) {
      throw new Error('AIPVersion model not loaded');
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'pdf';
    const { domain, id: documentId } = params;

    // Find organization by domain OR publicUrl
    const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '');

    const organization = await Organization.findOne({
      $or: [
        { domain: cleanDomain },
        { 'settings.publicUrl': { $regex: new RegExp(cleanDomain, 'i') } }
      ],
      status: 'active'
    }).lean() as any;

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check public access
    if (!organization.settings?.enablePublicAccess) {
      return NextResponse.json(
        { success: false, error: 'Public access is disabled' },
        { status: 403 }
      );
    }

    // Check export enabled
    if (organization.settings.enableExport === false) {
      return NextResponse.json(
        { success: false, error: 'Export functionality is disabled' },
        { status: 403 }
      );
    }

    // Check if requested format is allowed
    const allowedFormats = organization.settings.allowedExportFormats || ['pdf', 'docx'];
    if (!allowedFormats.includes(format)) {
      return NextResponse.json(
        { success: false, error: `Export format '${format}' is not enabled for this organization` },
        { status: 403 }
      );
    }

    // Find document
    const document = await AIPDocument.findOne({
      _id: documentId,
      organization: organization._id,
      status: 'published'
    }).populate('version', 'versionNumber airacCycle effectiveDate');

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Handle different export formats
    if (format === 'docx') {
      return await exportDOCX(document, organization);
    } else if (format === 'pdf') {
      // For PDF, we'll return HTML that can be printed to PDF by the browser
      return await exportPrintableHTML(document, organization);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid format. Use: docx, pdf' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: 'Export failed' },
      { status: 500 }
    );
  }
}

// Authenticated exports (XML, HTML) - auth required
export const POST = withAuth(async (request: NextRequest, { user, params }: any) => {
  try {
    await connectDB();

    const { format } = await request.json();
    const { domain, id: documentId } = params;

    // Find organization by domain OR publicUrl
    const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '');

    const organization = await Organization.findOne({
      $or: [
        { domain: cleanDomain },
        { 'settings.publicUrl': { $regex: new RegExp(cleanDomain, 'i') } }
      ]
    }).lean() as any;

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Find document
    const document = await AIPDocument.findOne({
      _id: documentId,
      organization: organization._id
    }).populate('version', 'versionNumber airacCycle effectiveDate');

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Handle authenticated formats
    if (format === 'xml') {
      return await exportXML(document, organization);
    } else if (format === 'html') {
      return await exportHTML(document, organization);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid format. Use: xml, html' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: 'Export failed' },
      { status: 500 }
    );
  }
});

// DOCX Export Implementation
async function exportDOCX(document: any, organization: any) {
  // Fetch logo if available
  let logoImage: ImageRun | null = null;
  if (organization.branding.logoUrl) {
    try {
      // Handle both absolute and relative URLs
      let logoUrl = organization.branding.logoUrl;
      if (!logoUrl.startsWith('http')) {
        // If relative URL, construct absolute URL
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        logoUrl = new URL(logoUrl, baseUrl).toString();
      }

      console.log('Fetching logo from:', logoUrl);
      const logoResponse = await fetch(logoUrl);

      if (!logoResponse.ok) {
        console.error('Failed to fetch logo, status:', logoResponse.status);
      } else {
        const logoBuffer = await logoResponse.arrayBuffer();
        logoImage = new ImageRun({
          data: Buffer.from(logoBuffer),
          transformation: {
            width: 150,
            height: 150,
          },
        });
        console.log('Logo loaded successfully');
      }
    } catch (error) {
      console.error('Failed to fetch logo:', error);
    }
  } else {
    console.log('No logo URL provided');
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Cover page with logo
          ...(logoImage ? [
            new Paragraph({
              children: [logoImage],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 }
            })
          ] : []),
          new Paragraph({
            children: [
              new TextRun({
                text: organization.name,
                bold: true,
                size: 48,
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Electronic Aeronautical Information Publication',
                size: 32,
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 800 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: document.title,
                bold: true,
                size: 40,
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `AIRAC Cycle: ${formatAiracCycle(document.airacCycle)}`,
                size: 24,
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Effective Date: ${new Date(document.effectiveDate).toLocaleDateString()}`,
                size: 24,
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Version: ${document.version.versionNumber}`,
                size: 24,
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 1600 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'In accordance with ICAO Annex 15',
                size: 20,
                italics: true,
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),

          // Page break
          new Paragraph({ pageBreakBefore: true }),

          // Table of Contents with automatic Word TOC
          new Paragraph({
            children: [
              new TextRun({
                text: 'Table of Contents',
                bold: true,
                size: 36,
              })
            ],
            spacing: { after: 400 }
          }),
          new TableOfContents("Table of Contents", {
            hyperlink: true,
            headingStyleRange: "1-2",
          }),

          // Page break
          new Paragraph({ pageBreakBefore: true }),

          // Content sections with bookmarks
          ...document.sections.flatMap((section: any, sectionIndex: number) => [
            new Paragraph({
              text: `${section.type} - ${section.title}`,
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 }
            }),
            ...section.subsections.flatMap((subsection: any, subIndex: number) => [
              new Paragraph({
                text: `${section.type} ${subsection.code} - ${subsection.title}`,
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 200 }
              }),
              ...htmlToDocxParagraphs(subsection.content)
            ])
          ])
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${document.title.replace(/[^a-z0-9]/gi, '_')}_${document.airacCycle}.docx"`
    }
  });
}

// Printable HTML for PDF export (browser prints to PDF)
async function exportPrintableHTML(document: any, organization: any) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${document.title} - ${organization.name}</title>
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }

    @media print {
      .page-break {
        page-break-after: always;
      }
      .no-print {
        display: none;
      }
    }

    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
    }

    .cover-page {
      text-align: center;
      padding-top: 30%;
    }

    .cover-title {
      font-size: 24pt;
      font-weight: bold;
      margin: 20px 0;
    }

    .cover-subtitle {
      font-size: 18pt;
      margin: 10px 0;
    }

    .cover-info {
      font-size: 14pt;
      margin: 10px 0;
    }

    .cover-footer {
      font-size: 11pt;
      font-style: italic;
      margin-top: 40px;
    }

    .toc-title {
      font-size: 24pt;
      font-weight: bold;
      text-align: center;
      margin-bottom: 40px;
    }

    h1 {
      font-size: 20pt;
      font-weight: bold;
      border-bottom: 2px solid ${organization.branding.primaryColor};
      padding-bottom: 10px;
      margin-top: 30px;
    }

    h2 {
      font-size: 16pt;
      font-weight: bold;
      margin-top: 20px;
      color: ${organization.branding.primaryColor};
    }

    .content {
      margin: 20px 0;
    }

    a {
      transition: opacity 0.2s;
    }

    a:hover {
      opacity: 0.7;
    }

    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      background-color: ${organization.branding.primaryColor};
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14pt;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">Print to PDF</button>

  <div class="cover-page">
    ${organization.branding.logoUrl ? `<img src="${organization.branding.logoUrl}" alt="${organization.name}" style="max-width: 200px; max-height: 200px;">` : ''}
    <div class="cover-title">${organization.name}</div>
    <div class="cover-subtitle">Electronic Aeronautical Information Publication</div>
    <div class="cover-title" style="margin-top: 40px;">${document.title}</div>
    <div class="cover-info">AIRAC Cycle: ${formatAiracCycle(document.airacCycle)}</div>
    <div class="cover-info">Effective Date: ${new Date(document.effectiveDate).toLocaleDateString()}</div>
    <div class="cover-info">Version: ${document.version.versionNumber}</div>
    <div class="cover-footer">In accordance with ICAO Annex 15</div>
  </div>

  <div class="page-break"></div>

  <!-- Table of Contents -->
  <div style="padding: 40px 0;">
    <div class="toc-title">Table of Contents</div>
    ${document.sections.map((section: any, sectionIndex: number) => `
      <div style="margin: 20px 0;">
        <div style="font-size: 16pt; font-weight: bold; margin-bottom: 10px;">
          <a href="#section-${sectionIndex}" style="color: ${organization.branding.primaryColor}; text-decoration: none;">
            ${section.type} - ${section.title}
          </a>
        </div>
        ${section.subsections.map((subsection: any, subIndex: number) => `
          <div style="margin-left: 30px; margin-bottom: 5px; font-size: 12pt;">
            <a href="#section-${sectionIndex}-sub-${subIndex}" style="color: #333; text-decoration: none;">
              ${section.type} ${subsection.code} - ${subsection.title}
            </a>
          </div>
        `).join('')}
      </div>
    `).join('')}
  </div>

  <div class="page-break"></div>

  ${document.sections.map((section: any, sectionIndex: number) => `
    <h1 id="section-${sectionIndex}">${section.type} - ${section.title}</h1>
    ${section.subsections.map((subsection: any, subIndex: number) => `
      <div id="section-${sectionIndex}-sub-${subIndex}" class="content">
        ${subsection.content}
      </div>
    `).join('')}
  `).join('')}
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    }
  });
}

// XML Export (ICAO/EUROCONTROL compliant)
async function exportXML(document: any, organization: any) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<AIP xmlns="http://www.aixm.aero/schema/5.1.1"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.aixm.aero/schema/5.1.1 http://www.aixm.aero/schema/5.1.1/AIXM_Features.xsd">
  <metadata>
    <authority>${organization.name}</authority>
    <country>${document.country}</country>
    <airacCycle>${document.airacCycle}</airacCycle>
    <effectiveDate>${document.effectiveDate}</effectiveDate>
    <version>${document.version.versionNumber}</version>
    <language>${document.metadata.language}</language>
    <contact>${document.metadata.contact}</contact>
    <standard>ICAO Annex 15</standard>
    <complianceStandard>${document.metadata.complianceStandard}</complianceStandard>
  </metadata>
  <document>
    <title>${document.title}</title>
    <documentType>${document.documentType}</documentType>
    <status>${document.status}</status>
    ${document.sections.map((section: any) => `
    <section type="${section.type}">
      <title>${section.title}</title>
      <description>${section.description}</description>
      ${section.subsections.map((subsection: any) => `
      <subsection code="${subsection.code}" mandatory="${subsection.isMandatory}">
        <title>${subsection.title}</title>
        <content><![CDATA[${subsection.content}]]></content>
        <lastModified>${subsection.lastModified}</lastModified>
      </subsection>`).join('')}
    </section>`).join('')}
  </document>
</AIP>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Content-Disposition': `attachment; filename="${document.title.replace(/[^a-z0-9]/gi, '_')}_${document.airacCycle}.xml"`
    }
  });
}

// HTML Export (standalone file)
async function exportHTML(document: any, organization: any) {
  const html = `
<!DOCTYPE html>
<html lang="${document.metadata.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${document.title} - ${organization.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }

    .header {
      background: ${organization.branding.primaryColor};
      color: white;
      padding: 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .header h1 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .header-info {
      font-size: 0.9rem;
      opacity: 0.9;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      background: white;
    }

    .metadata {
      background: #f8f9fa;
      border-left: 4px solid ${organization.branding.primaryColor};
      padding: 1rem;
      margin: 2rem 0;
    }

    .metadata-item {
      margin: 0.5rem 0;
    }

    .metadata-label {
      font-weight: bold;
      margin-right: 0.5rem;
    }

    .section {
      margin: 3rem 0;
    }

    .section-title {
      font-size: 1.8rem;
      font-weight: bold;
      color: ${organization.branding.primaryColor};
      border-bottom: 3px solid ${organization.branding.primaryColor};
      padding-bottom: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .subsection {
      margin: 2rem 0;
      padding: 1.5rem;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .subsection-title {
      font-size: 1.4rem;
      font-weight: bold;
      color: ${organization.branding.secondaryColor || organization.branding.primaryColor};
      margin-bottom: 1rem;
    }

    .subsection-code {
      display: inline-block;
      background: ${organization.branding.primaryColor}20;
      color: ${organization.branding.primaryColor};
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.9rem;
      margin-right: 0.5rem;
    }

    .content {
      margin-top: 1rem;
      line-height: 1.8;
    }

    .footer {
      margin-top: 4rem;
      padding: 2rem;
      background: #f8f9fa;
      text-align: center;
      font-size: 0.9rem;
      color: #666;
    }

    .mandatory-badge {
      display: inline-block;
      background: #28a745;
      color: white;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      margin-left: 0.5rem;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${organization.name}</h1>
    <div class="header-info">
      ${document.title} | AIRAC ${formatAiracCycle(document.airacCycle)} | Effective: ${new Date(document.effectiveDate).toLocaleDateString()}
    </div>
  </div>

  <div class="container">
    <div class="metadata">
      <div class="metadata-item">
        <span class="metadata-label">Document Type:</span>
        ${document.documentType}
      </div>
      <div class="metadata-item">
        <span class="metadata-label">AIRAC Cycle:</span>
        ${formatAiracCycle(document.airacCycle)}
      </div>
      <div class="metadata-item">
        <span class="metadata-label">Effective Date:</span>
        ${new Date(document.effectiveDate).toLocaleDateString()}
      </div>
      <div class="metadata-item">
        <span class="metadata-label">Version:</span>
        ${document.version.versionNumber}
      </div>
      <div class="metadata-item">
        <span class="metadata-label">Authority:</span>
        ${document.metadata.authority}
      </div>
      <div class="metadata-item">
        <span class="metadata-label">Standard:</span>
        ${document.metadata.complianceStandard}
      </div>
    </div>

    ${document.sections.map((section: any) => `
      <div class="section">
        <h2 class="section-title">${section.type} - ${section.title}</h2>

        ${section.subsections.map((subsection: any) => `
          <div class="subsection">
            <h3 class="subsection-title">
              <span class="subsection-code">${section.type} ${subsection.code}</span>
              ${subsection.title}
              ${subsection.isMandatory ? '<span class="mandatory-badge">Mandatory</span>' : ''}
            </h3>
            <div class="content">
              ${subsection.content}
            </div>
          </div>
        `).join('')}
      </div>
    `).join('')}

    <div class="footer">
      <p>This electronic AIP is published by ${organization.name} in accordance with ICAO Annex 15.</p>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <p>Contact: ${document.metadata.contact}</p>
    </div>
  </div>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="${document.title.replace(/[^a-z0-9]/gi, '_')}_${document.airacCycle}.html"`
    }
  });
}
