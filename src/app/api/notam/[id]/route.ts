import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

// NOTAM Schema (reuse from main route)
const NOTAMSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  series: { type: String, required: true },
  number: { type: Number, required: true },
  year: { type: Number, required: true },
  type: { type: String, enum: ['N', 'R', 'C'], required: true },
  scope: { type: String, required: true },
  purpose: { type: String, required: true },
  location: { type: String, required: true },
  effectiveFrom: { type: Date, required: true },
  effectiveTo: { type: Date, default: null },
  schedule: { type: String, default: null },
  text: { type: String, required: true },
  category: { type: String, required: true },
  traffic: { type: String, required: true },
  lower: { type: String, default: null },
  upper: { type: String, default: null },
  coordinates: { type: String, default: null },
  radius: { type: String, default: null },
  status: { type: String, enum: ['active', 'cancelled', 'expired'], default: 'active' },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  createdBy: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
  },
  lastModified: { type: Date, default: Date.now },
  relatedAIP: { type: mongoose.Schema.Types.ObjectId, ref: 'AIPDocument', default: null },
}, { timestamps: true });

const NOTAM = mongoose.models.NOTAM || mongoose.model('NOTAM', NOTAMSchema);

// GET /api/notam/[id] - Get single NOTAM
export async function GET(
  request: NextRequest,
  { params }: { params?: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const notam = await NOTAM.findById(params.id);

    if (!notam) {
      return NextResponse.json({ error: 'NOTAM not found' }, { status: 404 });
    }

    // Check access permissions
    const user = session.user as any;
    if (user.role !== 'super_admin' && notam.organizationId.toString() !== user.organizationId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ success: true, notam });
  } catch (error) {
    console.error('Error fetching NOTAM:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NOTAM' },
      { status: 500 }
    );
  }
}

// PATCH /api/notam/[id] - Update NOTAM (mainly for cancellation)
export async function PATCH(
  request: NextRequest,
  { params }: { params?: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;

    // Check permissions
    if (!['super_admin', 'org_admin', 'editor'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await dbConnect();

    const notam = await NOTAM.findById(params.id);

    if (!notam) {
      return NextResponse.json({ error: 'NOTAM not found' }, { status: 404 });
    }

    // Check access permissions
    if (user.role !== 'super_admin' && notam.organizationId.toString() !== user.organizationId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const data = await request.json();

    // Allow status updates (mainly for cancellation)
    if (data.status) {
      notam.status = data.status;
      notam.lastModified = new Date();
      await notam.save();
    }

    return NextResponse.json({
      success: true,
      notam,
      message: 'NOTAM updated successfully'
    });

  } catch (error) {
    console.error('Error updating NOTAM:', error);
    return NextResponse.json(
      { error: 'Failed to update NOTAM' },
      { status: 500 }
    );
  }
}

// DELETE /api/notam/[id] - Delete NOTAM
export async function DELETE(
  request: NextRequest,
  { params }: { params?: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;

    // Only super_admin and org_admin can delete
    if (!['super_admin', 'org_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await dbConnect();

    const notam = await NOTAM.findById(params.id);

    if (!notam) {
      return NextResponse.json({ error: 'NOTAM not found' }, { status: 404 });
    }

    // Check access permissions
    if (user.role !== 'super_admin' && notam.organizationId.toString() !== user.organizationId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await NOTAM.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: 'NOTAM deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting NOTAM:', error);
    return NextResponse.json(
      { error: 'Failed to delete NOTAM' },
      { status: 500 }
    );
  }
}