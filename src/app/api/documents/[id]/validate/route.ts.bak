import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIPDocument from '@/models/AIPDocument';
import { generateComplianceReport } from '@/lib/aipTemplates';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const document = await AIPDocument.findById(params.id);

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Generate compliance report
    const complianceReport = generateComplianceReport(
      document.documentType,
      document.sections || []
    );

    return NextResponse.json({
      success: true,
      data: {
        documentId: params.id,
        documentType: document.documentType,
        title: document.title,
        compliance: complianceReport,
        recommendations: complianceReport.isCompliant
          ? ['Document is fully compliant with ICAO Annex 15 requirements']
          : [
              ...complianceReport.missingSections.map(s => `Add missing section: ${s}`),
              ...complianceReport.missingSubsections.map(s => `Add missing subsection: ${s}`)
            ]
      }
    });
  } catch (error) {
    console.error('Error validating document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate document' },
      { status: 500 }
    );
  }
}
