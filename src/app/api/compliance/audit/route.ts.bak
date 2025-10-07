import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIPDocument from '@/models/AIPDocument';
import { ComplianceAuditor } from '@/lib/complianceAuditor';
import { getOrCreateDefaultUser } from '@/lib/defaultUser';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { documentId, frameworks } = body;

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const document = await AIPDocument.findById(documentId)
      .populate('version', 'versionNumber airacCycle effectiveDate')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Perform comprehensive compliance audit
    const auditReport = await ComplianceAuditor.performComprehensiveAudit(
      document,
      frameworks || ['ICAO_ANNEX_15', 'EUROCONTROL_SPEC_3']
    );

    return NextResponse.json({
      success: true,
      data: auditReport,
    });
  } catch (error) {
    console.error('Error performing compliance audit:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform compliance audit' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Return available compliance frameworks
    const frameworks = {
      'ICAO_ANNEX_15': 'ICAO Annex 15 - Aeronautical Information Services',
      'EUROCONTROL_SPEC_3': 'EUROCONTROL Specification for Electronic AIP v3.0',
      'DATA_QUALITY': 'Aeronautical Data Quality Standards',
      'AIRAC_COMPLIANCE': 'AIRAC Cycle Compliance'
    };

    return NextResponse.json({
      success: true,
      data: {
        availableFrameworks: frameworks,
        supportedChecks: [
          'Mandatory sections validation',
          'Data quality requirements',
          'AIRAC cycle compliance',
          'Coordinate accuracy',
          'Metadata completeness',
          'Content freshness',
          'Digital signature validation'
        ]
      },
    });
  } catch (error) {
    console.error('Error fetching compliance frameworks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch compliance information' },
      { status: 500 }
    );
  }
}