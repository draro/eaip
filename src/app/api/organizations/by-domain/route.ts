import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Organization from "@/models/Organization";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");

    if (!domain) {
      return NextResponse.json(
        { success: false, error: "Domain parameter is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Look up organization by domain OR publicUrl (case-insensitive)
    // This allows matching both:
    // 1. Primary domain (e.g., "flyclim.com")
    // 2. Public URL / custom domain (e.g., "demoaip.flyclim.com")
    const organization = await Organization.findOne({
      $or: [
        { domain: domain.toLowerCase() },
        { "settings.publicUrl": domain.toLowerCase() },
      ],
    });
    const plainOrg = organization.toObject();
    console.log("Organization lookup by domain:", {
      requestedDomain: domain.toLowerCase(),
      foundOrg: {
        id: plainOrg._id,
        name: plainOrg.name,
        domain: plainOrg.domain,
        publicUrl: plainOrg.settings?.publicUrl,
      },
    });
    // console.log("Organization lookup by domain:", {
    //   requestedDomain: domain.toLowerCase(),
    //   foundOrg: organization
    //     ? {
    //         id: organization._id,
    //         name: organization.name,
    //         domain: organization.domain,
    //         publicUrl: organization.settings?.publicUrl,
    //       }
    //     : null,
    // });
    // console.log("ORGANIZATION", organization);

    if (!organization) {
      return NextResponse.json(
        { success: false, error: "Organization not found for this domain" },
        { status: 404 }
      );
    }

    // Check if organization is active
    if (organization.status !== "active") {
      return NextResponse.json(
        { success: false, error: "Organization is not active" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      organization: {
        _id: plainOrg._id,
        name: plainOrg.name,
        domain: plainOrg.domain,
        status: plainOrg.status,
        settings: plainOrg.settings,
        branding: plainOrg.branding || {},
      },
    });
  } catch (error) {
    console.error("Error looking up organization by domain:", error);
    return NextResponse.json(
      { success: false, error: "Failed to lookup organization" },
      { status: 500 }
    );
  }
}
