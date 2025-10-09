import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIPDocument from '@/models/AIPDocument';
import { withAuth, createErrorResponse } from '@/lib/apiMiddleware';
import { DataIsolationService } from '@/lib/dataIsolation';

export const GET = withAuth(async (
  request: NextRequest,
  { params, user }
) => {
  try {
    await connectDB();

    const documentId = params.id;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // json, xml, or html

    const document = await AIPDocument.findById(documentId)
      .populate('version', 'versionNumber airacCycle effectiveDate')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('organization', 'name domain');

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Verify organization access
    if (user.role !== 'super_admin' &&
        document.organization._id.toString() !== user.organization?._id?.toString()) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this document' },
        { status: 403 }
      );
    }

    // Log export access
    DataIsolationService.logAccess(user, 'documents', 'export', true);

    // Generate export based on format
    switch (format.toLowerCase()) {
      case 'xml':
        return exportAsXML(document);
      case 'html':
        return exportAsHTML(document);
      case 'json':
      default:
        return exportAsJSON(document);
    }
  } catch (error) {
    return createErrorResponse(error, 'Failed to export document');
  }
});

function exportAsJSON(document: any) {
  const exportData = {
    metadata: {
      exportDate: new Date().toISOString(),
      exportFormat: 'ICAO Annex 15 / EUROCONTROL Spec 3.0',
      documentId: document._id,
      version: document.version.versionNumber,
      airacCycle: document.airacCycle,
      effectiveDate: document.effectiveDate,
    },
    document: {
      title: document.title,
      documentType: document.documentType,
      country: document.country,
      airport: document.airport,
      status: document.status,
      sections: document.sections.map((section: any) => ({
        id: section.id,
        type: section.type,
        title: section.title,
        description: section.description,
        content: section.content,
        order: section.order,
        subsections: section.subsections?.map((sub: any) => ({
          code: sub.code,
          title: sub.title,
          content: sub.content,
          order: sub.order,
          isMandatory: sub.isMandatory,
        })) || []
      })),
      metadata: document.metadata,
      organization: {
        name: document.organization.name,
        domain: document.organization.domain,
      },
      createdBy: document.createdBy?.name,
      updatedBy: document.updatedBy?.name,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    }
  };

  const filename = `${document.country}-${document.documentType}-${document.airacCycle}.json`;

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

function exportAsXML(document: any) {
  const sections = document.sections.map((section: any) => {
    const subsections = section.subsections?.map((sub: any) => `
    <Subsection code="${sub.code}" mandatory="${sub.isMandatory}">
      <Title>${escapeXml(sub.title)}</Title>
      <Content><![CDATA[${sub.content}]]></Content>
      <Order>${sub.order}</Order>
    </Subsection>`).join('') || '';

    return `
  <Section id="${section.id}" type="${section.type}">
    <Title>${escapeXml(section.title)}</Title>
    <Description>${escapeXml(section.description)}</Description>
    <Content><![CDATA[${section.content}]]></Content>
    <Order>${section.order}</Order>
    ${subsections}
  </Section>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<AIPDocument xmlns="http://www.icao.int/annex15" xmlns:eurocontrol="http://www.eurocontrol.int/spec3.0">
  <Metadata>
    <ExportDate>${new Date().toISOString()}</ExportDate>
    <Standard>ICAO Annex 15 / EUROCONTROL Specification 3.0</Standard>
    <DocumentID>${document._id}</DocumentID>
    <Version>${document.version.versionNumber}</Version>
    <AIRACCycle>${document.airacCycle}</AIRACCycle>
    <EffectiveDate>${document.effectiveDate}</EffectiveDate>
  </Metadata>
  <Document>
    <Title>${escapeXml(document.title)}</Title>
    <DocumentType>${document.documentType}</DocumentType>
    <Country>${document.country}</Country>
    ${document.airport ? `<Airport>${document.airport}</Airport>` : ''}
    <Status>${document.status}</Status>
    <Organization>
      <Name>${escapeXml(document.organization.name)}</Name>
      <Domain>${document.organization.domain}</Domain>
    </Organization>
    <Sections>${sections}
    </Sections>
    <Authority>
      <Contact>${document.metadata.contact}</Contact>
      <Language>${document.metadata.language}</Language>
    </Authority>
    <Timestamps>
      <Created>${document.createdAt}</Created>
      <Updated>${document.updatedAt}</Updated>
      <CreatedBy>${escapeXml(document.createdBy?.name || 'Unknown')}</CreatedBy>
      <UpdatedBy>${escapeXml(document.updatedBy?.name || 'Unknown')}</UpdatedBy>
    </Timestamps>
  </Document>
</AIPDocument>`;

  const filename = `${document.country}-${document.documentType}-${document.airacCycle}.xml`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

function exportAsHTML(document: any) {
  const sections = document.sections.map((section: any) => {
    const subsections = section.subsections?.map((sub: any) => `
      <div class="subsection">
        <h4>${sub.code} - ${escapeHtml(sub.title)} ${sub.isMandatory ? '<span class="mandatory">*</span>' : ''}</h4>
        <div class="content">${sub.content}</div>
      </div>`).join('') || '';

    return `
    <section id="${section.id}" class="document-section">
      <h3>${escapeHtml(section.title)}</h3>
      <p class="description">${escapeHtml(section.description)}</p>
      <div class="section-content">${section.content}</div>
      ${subsections}
    </section>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="${document.metadata.language || 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(document.title)} - ${document.airacCycle}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    header {
      border-bottom: 3px solid #003d7a;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 { color: #003d7a; font-size: 28px; margin-bottom: 10px; }
    h2 { color: #0056b3; font-size: 22px; margin-top: 30px; }
    h3 { color: #004085; font-size: 18px; margin-top: 20px; }
    h4 { color: #155724; font-size: 16px; margin-top: 15px; }
    .metadata {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .metadata-item {
      display: inline-block;
      margin-right: 20px;
      font-size: 14px;
    }
    .metadata-label {
      font-weight: bold;
      color: #495057;
    }
    .document-section {
      margin-bottom: 40px;
      padding: 20px;
      background: #fff;
      border-left: 4px solid #003d7a;
    }
    .subsection {
      margin-left: 20px;
      margin-top: 15px;
      padding: 15px;
      background: #f1f3f5;
      border-radius: 4px;
    }
    .description {
      font-style: italic;
      color: #6c757d;
    }
    .content {
      margin-top: 10px;
    }
    .mandatory {
      color: #dc3545;
      font-weight: bold;
    }
    footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #dee2e6;
      font-size: 12px;
      color: #6c757d;
    }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(document.title)}</h1>
    <div class="metadata">
      <div class="metadata-item">
        <span class="metadata-label">Type:</span> ${document.documentType}
      </div>
      <div class="metadata-item">
        <span class="metadata-label">Country:</span> ${document.country}
      </div>
      ${document.airport ? `<div class="metadata-item">
        <span class="metadata-label">Airport:</span> ${document.airport}
      </div>` : ''}
      <div class="metadata-item">
        <span class="metadata-label">AIRAC Cycle:</span> ${document.airacCycle}
      </div>
      <div class="metadata-item">
        <span class="metadata-label">Effective Date:</span> ${new Date(document.effectiveDate).toLocaleDateString()}
      </div>
      <div class="metadata-item">
        <span class="metadata-label">Status:</span> ${document.status}
      </div>
    </div>
  </header>

  <main>
    ${sections}
  </main>

  <footer>
    <p><strong>Authority:</strong> ${escapeHtml(document.metadata.authority || document.organization.name)}</p>
    <p><strong>Contact:</strong> ${document.metadata.contact}</p>
    <p><strong>Compliance Standard:</strong> ${document.metadata.complianceStandard || 'ICAO Annex 15 / EUROCONTROL Spec 3.0'}</p>
    <p><strong>Last Updated:</strong> ${new Date(document.updatedAt).toLocaleString()} by ${escapeHtml(document.updatedBy?.name || 'Unknown')}</p>
    <p><strong>Exported:</strong> ${new Date().toLocaleString()}</p>
    <p><em>* Indicates mandatory section as per ICAO Annex 15</em></p>
  </footer>
</body>
</html>`;

  const filename = `${document.country}-${document.documentType}-${document.airacCycle}.html`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
