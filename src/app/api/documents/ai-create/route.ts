import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIPDocument from '@/models/AIPDocument';
import AIPVersion from '@/models/AIPVersion';
import { withAuth, createErrorResponse } from '@/lib/apiMiddleware';
import { DataIsolationService } from '@/lib/dataIsolation';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    await connectDB();

    const body = await request.json();
    const {
      title,
      documentType,
      country,
      airport,
      versionId,
      previousVersionId,
      effectiveDate,
      organizationId
    } = body;

    // Validate required fields
    if (!title || !documentType || !country || !versionId || !previousVersionId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check permissions
    if (user.role === 'viewer') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to create documents' },
        { status: 403 }
      );
    }

    // Validate ICAO codes
    if (country.length !== 2) {
      return NextResponse.json(
        { success: false, error: 'Country code must be exactly 2 characters (ICAO format)' },
        { status: 400 }
      );
    }

    if (airport && airport.length !== 4) {
      return NextResponse.json(
        { success: false, error: 'Airport code must be exactly 4 characters (ICAO format) or omitted' },
        { status: 400 }
      );
    }

    // Determine target organization
    let targetOrganizationId = null;
    if (user.role === 'super_admin') {
      if (!organizationId) {
        return NextResponse.json(
          { success: false, error: 'Super admin must specify an organizationId' },
          { status: 400 }
        );
      }
      targetOrganizationId = organizationId;
    } else {
      if (!user.organization) {
        return NextResponse.json(
          { success: false, error: 'User must belong to an organization' },
          { status: 400 }
        );
      }
      targetOrganizationId = user.organization._id;
    }

    // Validate document creation limits
    const currentDocCount = await AIPDocument.countDocuments({
      organization: targetOrganizationId
    });

    await DataIsolationService.validateDocumentCreation(
      targetOrganizationId,
      currentDocCount
    );

    // Fetch versions
    const [newVersion, previousVersion] = await Promise.all([
      AIPVersion.findById(versionId),
      AIPVersion.findById(previousVersionId)
    ]);

    if (!newVersion || !previousVersion) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 }
      );
    }

    // Check for duplicate in new version
    const existingDocQuery: any = {
      country: country.toUpperCase(),
      version: versionId,
      documentType,
      organization: targetOrganizationId
    };

    if (airport) {
      existingDocQuery.airport = airport.toUpperCase();
    }

    const existingDoc = await AIPDocument.findOne(existingDocQuery);

    if (existingDoc) {
      return NextResponse.json(
        {
          success: false,
          error: `Document with these criteria already exists for this version`,
          details: {
            existingDocumentId: existingDoc._id,
            existingDocumentTitle: existingDoc.title,
            message: `A ${documentType} document for country ${country.toUpperCase()}${airport ? ` at airport ${airport.toUpperCase()}` : ''} already exists in this version.`
          }
        },
        { status: 409 }
      );
    }

    // Find documents from previous version to use as reference
    const previousDocQuery: any = {
      country: country.toUpperCase(),
      version: previousVersionId,
      documentType,
      organization: targetOrganizationId
    };

    if (airport) {
      previousDocQuery.airport = airport.toUpperCase();
    }

    let previousDocs = await AIPDocument.find(previousDocQuery).limit(5);

    // If no documents in previous version, try to find similar documents from any version
    if (previousDocs.length === 0) {
      const fallbackQuery: any = {
        country: country.toUpperCase(),
        documentType,
        organization: targetOrganizationId
      };

      if (airport) {
        fallbackQuery.airport = airport.toUpperCase();
      }

      previousDocs = await AIPDocument.find(fallbackQuery)
        .sort({ updatedAt: -1 })
        .limit(3);
    }

    // Build AI prompt
    let prompt = `You are an expert in ICAO Annex 15 and EUROCONTROL Specification 3.0 for electronic Aeronautical Information Publications (eAIP).

**New Document Details:**
- Title: ${title}
- Document Type: ${documentType}
- Country: ${country.toUpperCase()}
${airport ? `- Airport: ${airport.toUpperCase()}` : ''}
- Version: ${newVersion.versionNumber} (AIRAC ${newVersion.airacCycle})
- Effective Date: ${effectiveDate || newVersion.effectiveDate}

`;

    if (previousDocs.length > 0) {
      // Create from reference documents
      const previousDocsContent = previousDocs.map((doc, idx) =>
        `### Reference Document ${idx + 1}: ${doc.title}\n` +
        `**Type:** ${doc.documentType}\n` +
        `**Country:** ${doc.country}\n` +
        `${doc.airport ? `**Airport:** ${doc.airport}\n` : ''}` +
        `**AIRAC Cycle:** ${doc.airacCycle}\n` +
        `**Sections:**\n${JSON.stringify(doc.sections, null, 2)}`
      ).join('\n\n---\n\n');

      prompt += `I need you to create a new AIP document based on the following reference documents. Maintain structure and apply necessary updates for the new AIRAC cycle.

**Reference Documents:**

${previousDocsContent}

**Instructions:**
1. Analyze the reference documents carefully
2. Create appropriate sections for the new document based on the references
3. Update any time-sensitive information (dates, AIRAC cycles, validity periods)
4. Ensure compliance with ICAO Annex 15 mandatory sections
5. Ensure compliance with EUROCONTROL Spec 3.0 structure requirements
6. Maintain content quality and completeness
7. Include all relevant sections from the reference documents`;
    } else {
      // Create from template
      prompt += `I need you to create a new AIP document from scratch. Since no reference documents exist, create a proper template structure with placeholder content.

**Instructions:**
1. Create appropriate mandatory sections based on ICAO Annex 15 requirements for ${documentType} documents
2. For AIP documents, include sections like:
   - GEN (General): National regulations, aerodrome administration, entry procedures, etc.
   - ENR (En-Route): Airspace structure, ATS routes, navigation warnings, etc.
   - AD (Aerodrome): Aerodrome information, runways, navigation aids, procedures, etc.
3. For SUPPLEMENT documents, create relevant update sections
4. For NOTAM documents, create appropriate notice sections
5. Ensure compliance with ICAO Annex 15 mandatory sections
6. Ensure compliance with EUROCONTROL Spec 3.0 structure requirements
7. Add comprehensive placeholder content that can be edited later
8. Include proper section numbering and hierarchy`;
    }

    prompt += `

Please return ONLY a valid JSON object with this structure:
{
  "sections": [...array of section objects with proper structure...],
  "metadata": {
    "language": "en",
    "authority": "Aviation Authority",
    "contact": "contact@authority.gov"
  },
  "summary": "Brief summary of the document created"
}

Each section should have this structure:
{
  "id": "unique-section-id",
  "type": "GEN|ENR|AD",
  "code": "section code (e.g., GEN-1.1)",
  "title": "Section Title",
  "content": "Section content in HTML format with comprehensive information",
  "subsections": [...nested subsections if applicable...]
}`;

    // Call Claude API to generate document
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Extract response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse AI response
    let aiResponse;
    try {
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
                       responseText.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : responseText;
      aiResponse = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      return NextResponse.json(
        { success: false, error: 'Failed to parse AI response. Please try again or create document manually.' },
        { status: 500 }
      );
    }

    // Validate response
    if (!aiResponse.sections || !Array.isArray(aiResponse.sections)) {
      return NextResponse.json(
        { success: false, error: 'Invalid AI response format' },
        { status: 500 }
      );
    }

    // Get organization for metadata
    const Organization = (await import('@/models/Organization')).default;
    const targetOrg = await Organization.findById(targetOrganizationId);

    // Create document with AI-generated content
    const documentData: any = {
      title,
      documentType,
      country: country.toUpperCase(),
      airport: airport?.toUpperCase() || undefined,
      sections: aiResponse.sections,
      version: versionId,
      organization: targetOrganizationId,
      createdBy: user._id,
      updatedBy: user._id,
      airacCycle: newVersion.airacCycle,
      effectiveDate: effectiveDate || newVersion.effectiveDate,
      status: 'draft',
      metadata: {
        language: aiResponse.metadata?.language || 'en',
        authority: aiResponse.metadata?.authority || targetOrg?.name || 'Authority',
        contact: aiResponse.metadata?.contact || 'contact@authority.gov',
        lastReview: new Date(),
        nextReview: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        aiAssisted: true,
        aiCreatedFrom: previousVersionId,
        aiCreationDate: new Date(),
        aiSummary: aiResponse.summary
      }
    };

    const document = await AIPDocument.create(documentData);

    // Add to version
    await AIPVersion.findByIdAndUpdate(versionId, {
      $push: { documents: document._id }
    });

    // Log creation
    DataIsolationService.logAccess(user, 'documents', 'ai-create', true);

    const populatedDocument = await AIPDocument.findById(document._id)
      .populate('version', 'versionNumber airacCycle effectiveDate')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('organization', 'name domain');

    return NextResponse.json(
      {
        success: true,
        data: {
          ...populatedDocument.toObject(),
          aiSummary: aiResponse.summary
        },
        message: 'Document created successfully with AI assistance'
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('AI document creation error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      status: error.status,
      name: error.name
    });

    // Handle specific API errors
    if (error.status === 401) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key. Please configure ANTHROPIC_API_KEY.' },
        { status: 500 }
      );
    }

    if (error.status === 429) {
      return NextResponse.json(
        { success: false, error: 'AI service rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Return more detailed error in development
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create document with AI',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
});
