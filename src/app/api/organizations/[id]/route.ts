import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Organization from '@/models/Organization';
import User from '@/models/User';
import AIPDocument from '@/models/AIPDocument';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params?: { id: string } }
) {
  try {
    // Validate ObjectId
    if (!params?.id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(params?.id || '')) {
      return NextResponse.json(
        { success: false, error: 'Invalid organization ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const organization = await Organization.findById(params?.id)
      .populate('createdBy', 'name email');

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get organization statistics
    const [userCount, documentCount, activeUsers] = await Promise.all([
      User.countDocuments({ organization: params?.id }),
      AIPDocument.countDocuments({ organization: params?.id }),
      User.countDocuments({
        organization: params?.id,
        isActive: true,
        lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      })
    ]);

    // Get recent activity
    const recentDocuments = await AIPDocument.find({ organization: params?.id })
      .populate('updatedBy', 'name email')
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('title status updatedAt updatedBy');

    const organizationWithStats = {
      ...organization.toObject(),
      statistics: {
        totalUsers: userCount,
        totalDocuments: documentCount,
        activeUsers,
        recentActivity: recentDocuments
      }
    };

    return NextResponse.json({
      success: true,
      data: organizationWithStats
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch organization' },
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
    if (!mongoose.Types.ObjectId.isValid(params?.id || '')) {
      return NextResponse.json(
        { success: false, error: 'Invalid organization ID' },
        { status: 400 }
      );
    }

    await connectDB();

    // First get the existing organization
    const existingOrg = await Organization.findById(params?.id);
    if (!existingOrg) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updateData = { ...body };

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.createdBy;

    // Handle domain updates
    if (updateData.domain) {
      updateData.domain = updateData.domain.toLowerCase();

      // Check if new domain already exists
      const domainExists = await Organization.findOne({
        domain: updateData.domain,
        _id: { $ne: params?.id }
      });

      if (domainExists) {
        return NextResponse.json(
          { success: false, error: 'Domain already exists' },
          { status: 409 }
        );
      }
    }

    // Handle country code
    if (updateData.country) {
      updateData.country = updateData.country.toUpperCase();
    }

    // Handle ICAO code
    if (updateData.icaoCode) {
      updateData.icaoCode = updateData.icaoCode.toUpperCase();
    }

    // Merge settings properly to preserve required fields
    if (updateData.settings) {
      updateData.settings = {
        ...existingOrg.settings.toObject(),
        ...updateData.settings,
      };

      // Handle public URL
      if (updateData.settings.publicUrl) {
        updateData.settings.publicUrl = updateData.settings.publicUrl.toLowerCase();
      }

      // Ensure airacStartDate is preserved if not provided
      if (!updateData.settings.airacStartDate && existingOrg.settings.airacStartDate) {
        updateData.settings.airacStartDate = existingOrg.settings.airacStartDate;
      }
    }

    const organization = await Organization.findByIdAndUpdate(
      params?.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: organization,
      message: 'Organization updated successfully'
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update organization' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params?: { id: string } }
) {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(params?.id || '')) {
      return NextResponse.json(
        { success: false, error: 'Invalid organization ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const organization = await Organization.findById(params?.id);
    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if organization has users
    const userCount = await User.countDocuments({ organization: params?.id });
    if (userCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete organization with existing users. Please transfer or remove users first.'
        },
        { status: 400 }
      );
    }

    // Check if organization has documents
    const documentCount = await AIPDocument.countDocuments({ organization: params?.id });
    if (documentCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete organization with existing documents. Please transfer or remove documents first.'
        },
        { status: 400 }
      );
    }

    await Organization.findByIdAndDelete(params?.id);

    return NextResponse.json({
      success: true,
      message: 'Organization deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete organization' },
      { status: 500 }
    );
  }
}
