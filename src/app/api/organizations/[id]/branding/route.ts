import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Organization from '@/models/Organization';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params?: { id: string } }
) {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid organization ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const organization = await Organization.findById(params.id);

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      branding: organization.branding || {}
    });
  } catch (error) {
    console.error('Error fetching organization branding:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch branding' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params?: { id: string } }
) {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid organization ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const body = await request.json();
    const brandingUpdate = { ...body };

    // Validate branding data
    if (brandingUpdate.primaryColor && !isValidColor(brandingUpdate.primaryColor)) {
      return NextResponse.json(
        { success: false, error: 'Invalid primary color format' },
        { status: 400 }
      );
    }

    if (brandingUpdate.secondaryColor && !isValidColor(brandingUpdate.secondaryColor)) {
      return NextResponse.json(
        { success: false, error: 'Invalid secondary color format' },
        { status: 400 }
      );
    }

    const organization = await Organization.findByIdAndUpdate(
      params.id,
      {
        $set: {
          branding: brandingUpdate,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    );

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      branding: organization.branding,
      message: 'Branding updated successfully'
    });
  } catch (error) {
    console.error('Error updating organization branding:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update branding' },
      { status: 500 }
    );
  }
}

function isValidColor(color: string): boolean {
  // Check for hex color format
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
    return true;
  }

  // Check for rgb/rgba format
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/.test(color)) {
    return true;
  }

  // Check for hsl/hsla format
  if (/^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+)?\s*\)$/.test(color)) {
    return true;
  }

  return false;
}