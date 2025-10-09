import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import AIPDocument from "@/models/AIPDocument";
import { withAuth, createErrorResponse } from "@/lib/apiMiddleware";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    await connectDB();

    const body = await request.json();
    const { documentId, auditReport } = body;

    if (!documentId || !auditReport) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: documentId and auditReport",
        },
        { status: 400 }
      );
    }

    // Check permissions - only editors and admins can fix documents
    if (user.role === "viewer") {
      return NextResponse.json(
        {
          success: false,
          error: "Insufficient permissions to modify documents",
        },
        { status: 403 }
      );
    }

    // Fetch the document
    const document = await AIPDocument.findById(documentId);
    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    // Verify user has access to this document (organization isolation)
    if (
      user.role !== "super_admin" &&
      document.organization.toString() !== user.organization?._id?.toString()
    ) {
      return NextResponse.json(
        { success: false, error: "Access denied to this document" },
        { status: 403 }
      );
    }

    // Get organization AI settings
    const Organization = (await import('@/models/Organization')).default;
    const org = await Organization.findById(document.organization).select('+aiApiKey');

    const aiProvider = org?.aiProvider || 'claude';
    const aiModel = org?.aiModel || 'claude-sonnet-4-5-20250929';

    // Determine API key based on provider
    let aiApiKey = org?.aiApiKey;
    if (!aiApiKey) {
      aiApiKey = aiProvider === 'openai'
        ? process.env.OPENAI_API_KEY
        : process.env.ANTHROPIC_API_KEY;
    }

    if (!aiApiKey) {
      return NextResponse.json(
        { success: false, error: `AI API key not configured for ${aiProvider}. Please configure in organization settings or environment variables.` },
        { status: 500 }
      );
    }

    // Collect all issues from framework results
    let allIssues: any[] = [];

    if (auditReport.frameworkResults) {
      // Extract issues from all framework results
      Object.values(auditReport.frameworkResults).forEach((result: any) => {
        if (result.issues && Array.isArray(result.issues)) {
          allIssues = allIssues.concat(result.issues);
        }
      });
    }

    // Validate we have issues to fix
    if (allIssues.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No compliance issues found in audit report.' },
        { status: 400 }
      );
    }

    // Build AI prompt with compliance issues
    const criticalIssues = allIssues.filter(
      (i: any) => i.severity === "critical" || i.severity === "high"
    );
    const issuesList = criticalIssues
      .map(
        (issue: any, idx: number) =>
          `${idx + 1}. [${issue.severity.toUpperCase()}] ${
            issue.message
          }\n   Check: ${issue.checkId}\n   Remediation: ${issue.remediation}`
      )
      .join("\n\n");

    const prompt = `You are an expert in ICAO Annex 15 and EUROCONTROL Specification 3.0 compliance for electronic Aeronautical Information Publications (eAIP).

I have an AIP document that has failed compliance validation. Your task is to fix the document by addressing the compliance issues while preserving all valid content.

**Document Title:** ${document.title}
**Document Type:** ${document.documentType}
**Country:** ${document.country}
${document.airport ? `**Airport:** ${document.airport}` : ""}

**Current Compliance Status:**
- Overall Score: ${auditReport.overallScore}%
- Total Checks: ${auditReport.totalChecks}
- Passed: ${auditReport.passedChecks}
- Failed: ${auditReport.failedChecks}
- Warnings: ${auditReport.warnings}

**Critical and High Priority Issues to Fix:**

${issuesList}

**Current Document Structure:**
${JSON.stringify(document.sections, null, 2)}

**Instructions:**
1. Fix ONLY the critical/high priority issues listed above
2. Add missing mandatory sections with minimal placeholder content
3. Keep existing valid content unchanged
4. Return concise, minimal fixes

IMPORTANT: Keep response under 4000 tokens. Use placeholders like [TO BE COMPLETED] for detailed content.

Return ONLY valid JSON:
{
  "sections": [...updated sections - MINIMAL CHANGES ONLY...],
  "fixedIssues": [...issue IDs fixed...],
  "summary": "Brief summary"
}`;

    // Call AI API based on provider
    let responseText = '';

    if (aiProvider === 'openai') {
      const openai = new OpenAI({ apiKey: aiApiKey });
      const completion = await openai.chat.completions.create({
        model: aiModel,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4096,
        temperature: 0.3,
      });
      responseText = completion.choices[0]?.message?.content || '';
    } else {
      // Claude
      const anthropic = new Anthropic({ apiKey: aiApiKey });
      const message = await anthropic.messages.create({
        model: aiModel,
        max_tokens: 4096,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }]
      });
      responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    }

    // Parse AI response - extract JSON from potential markdown code blocks
    let aiResponse;
    try {
      console.log('AI Response length:', responseText.length);
      console.log('AI Response preview:', responseText.substring(0, 500));
      console.log('AI Response end:', responseText.substring(responseText.length - 200));

      // Try to extract JSON from code blocks if present
      const jsonMatch =
        responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
        responseText.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : responseText;

      console.log('Attempting to parse JSON, length:', jsonStr.length);
      aiResponse = JSON.parse(jsonStr);

      console.log('Successfully parsed AI response');
    } catch (parseError: any) {
      console.error("Failed to parse AI response:", parseError.message);
      console.error("Response text (first 1000 chars):", responseText.substring(0, 1000));
      console.error("Response text (last 500 chars):", responseText.substring(responseText.length - 500));

      return NextResponse.json(
        {
          success: false,
          error: "Failed to parse AI response. The response may be incomplete or invalid JSON.",
          details: process.env.NODE_ENV === 'development' ? {
            error: parseError.message,
            responsePreview: responseText.substring(0, 500)
          } : undefined
        },
        { status: 500 }
      );
    }

    // Validate response structure
    if (!aiResponse.sections || !Array.isArray(aiResponse.sections)) {
      return NextResponse.json(
        { success: false, error: "Invalid AI response format" },
        { status: 500 }
      );
    }

    // Update the document with fixed sections
    document.sections = aiResponse.sections;
    document.updatedBy = user._id;
    document.metadata = {
      ...document.metadata,
      lastReview: new Date(),
      aiAssisted: true,
      aiFixDate: new Date(),
      aiFixSummary: aiResponse.summary,
    };

    await document.save();

    // Log the fix
    console.log(
      `AI fixed ${
        aiResponse.fixedIssues?.length || 0
      } issues in document ${documentId}`
    );
    console.log(`Summary: ${aiResponse.summary}`);

    return NextResponse.json({
      success: true,
      data: {
        documentId: document._id,
        fixedIssues: aiResponse.fixedIssues?.length || criticalIssues.length,
        summary: aiResponse.summary,
        updatedSections: aiResponse.sections.length,
      },
    });
  } catch (error: any) {
    console.error("AI fix error:", error);

    // Handle specific API errors
    if (error.status === 401) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid API key. Please configure ANTHROPIC_API_KEY.",
        },
        { status: 500 }
      );
    }

    if (error.status === 429) {
      return NextResponse.json(
        {
          success: false,
          error: "AI service rate limit exceeded. Please try again later.",
        },
        { status: 429 }
      );
    }

    return createErrorResponse(error, "Failed to apply AI fixes");
  }
});
