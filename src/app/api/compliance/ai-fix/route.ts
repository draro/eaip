import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import AIPDocument from "@/models/AIPDocument";
import { withAuth, createErrorResponse } from "@/lib/apiMiddleware";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

    // Build AI prompt with compliance issues
    const criticalIssues = auditReport.issues.filter(
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
1. Analyze each compliance issue carefully
2. Fix the document structure and content to resolve all critical and high priority issues
3. Ensure compliance with ICAO Annex 15 mandatory sections
4. Ensure compliance with EUROCONTROL Spec 3.0 metadata and structure requirements
5. Preserve all valid existing content
6. Add missing mandatory sections with appropriate content
7. Return the updated sections array in valid JSON format

Please return ONLY a valid JSON object with this structure:
{
  "sections": [...updated sections array...],
  "fixedIssues": [...array of issue checkIds that were fixed...],
  "summary": "Brief summary of changes made"
}`;

    // Call Claude API to generate fixes
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8000,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extract the response
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse AI response - extract JSON from potential markdown code blocks
    let aiResponse;
    try {
      // Try to extract JSON from code blocks if present
      const jsonMatch =
        responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
        responseText.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : responseText;
      aiResponse = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", responseText);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to parse AI response. The AI may need more context.",
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
