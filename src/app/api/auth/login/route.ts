import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import crypto from 'crypto';
import { log } from "@/lib/logger";

// Helper function to hash password
function hashPassword(password: string): string {
  return crypto
    .createHash("sha256")
    .update(password + "eAIP_salt_2025")
    .digest("hex");
}

export async function POST(request: NextRequest) {
  const start = Date.now();
  try {
    await connectDB();

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      log.auth("[Login] Missing credentials", {
        method: "POST",
        url: request.url,
        ipAddress: request.headers.get("x-forwarded-for"),
        statusCode: 400,
        action: "login_attempt_missing_fields",
        resource: "auth",
      });

      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).populate(
      "organization",
      "name domain status"
    );

    if (!user) {
      log.auth("[Login] Invalid email", {
        method: "POST",
        url: request.url,
        email,
        ipAddress: request.headers.get("x-forwarded-for"),
        statusCode: 401,
        action: "login_failed_invalid_email",
        resource: "auth",
      });

      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const hashedInputPassword = hashPassword(password);
    if (user.password !== hashedInputPassword) {
      log.auth("[Login] Invalid password", {
        method: "POST",
        url: request.url,
        userId: user._id.toString(),
        email,
        ipAddress: request.headers.get("x-forwarded-for"),
        statusCode: 401,
        action: "login_failed_invalid_password",
        resource: "auth",
      });

      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      log.auth("[Login] Account deactivated", {
        method: "POST",
        url: request.url,
        userId: user._id.toString(),
        email,
        ipAddress: request.headers.get("x-forwarded-for"),
        statusCode: 403,
        action: "login_blocked_inactive",
        resource: "auth",
      });
      return NextResponse.json(
        { success: false, error: "Account is deactivated" },
        { status: 403 }
      );
    }

    // Check if organization is active (if user has one)
    if (
      user.organization &&
      (user.organization as any).status === "suspended"
    ) {
      log.auth("[Login] Organization suspended", {
        method: "POST",
        url: request.url,
        userId: user._id.toString(),
        organizationId: (user.organization as any)._id?.toString(),
        ipAddress: request.headers.get("x-forwarded-for"),
        statusCode: 403,
        action: "login_blocked_org_suspended",
        resource: "auth",
      });

      return NextResponse.json(
        { success: false, error: "Organization is suspended" },
        { status: 403 }
      );
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Return user data (excluding password)
    const userData = {
      _id: user._id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organization: user.organization,
      avatar: user.avatar,
      permissions: user.permissions,
      preferences: user.preferences,
      lastLoginAt: user.lastLoginAt,
      isActive: user.isActive,
    };
    log.auth("[Login] Success", {
      method: "POST",
      url: request.url,
      userId: user._id.toString(),
      organizationId: (user.organization as any)?._id?.toString(),
      ipAddress: request.headers.get("x-forwarded-for"),
      statusCode: 200,
      duration: Date.now() - start,
      action: "login_success",
      resource: "auth",
    });

    return NextResponse.json({
      success: true,
      data: userData,
      message: "Login successful",
    });
  } catch (error) {
    log.auth("[Login] Internal error", {
      method: "POST",
      url: request.url,
      ipAddress: request.headers.get("x-forwarded-for"),
      statusCode: 500,
      error: (error as Error)?.message,
      action: "login_internal_error",
      resource: "auth",
    });

    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Login failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  log.auth("[Login] GET endpoint checked", {
    method: "GET",
    url: "/api/auth/login",
    action: "endpoint_check",
    resource: "auth",
  });
  return NextResponse.json({
    success: true,
    message: "Login endpoint available",
    usage: "POST with { email, password } in body",
  });
}