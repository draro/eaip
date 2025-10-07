import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';
import { withAuth, createErrorResponse } from '@/lib/apiMiddleware';

// NOTAM Schema
const NOTAMSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Format: A1234/23
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

// GET /api/notam - List NOTAMs
export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    await dbConnect();

    const query: any = {};

    // Filter by organization if not super admin
    if (user.role !== 'super_admin') {
      query.organizationId = user.organization?._id;
    }

    const notams = await NOTAM.find(query).sort({ createdAt: -1 }).limit(100);

    return NextResponse.json({ success: true, notams });
  } catch (error) {
    return createErrorResponse(error, 'Failed to fetch NOTAMs');
  }
});

// POST /api/notam - Create NOTAM
export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    // Check permissions
    if (!['super_admin', 'org_admin', 'editor'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await dbConnect();

    const data = await request.json();

    // Generate NOTAM ID
    const year = new Date().getFullYear().toString().slice(-2);
    const notamId = `${data.series}${data.number.toString().padStart(4, '0')}/${year}`;

    // Check if NOTAM ID already exists
    const existingNOTAM = await NOTAM.findOne({ id: notamId });
    if (existingNOTAM) {
      return NextResponse.json(
        { error: 'NOTAM with this series and number already exists for this year' },
        { status: 400 }
      );
    }

    // Validate ICAO location code
    if (!/^[A-Z]{4}$/.test(data.location)) {
      return NextResponse.json(
        { error: 'Invalid ICAO location code. Must be 4 uppercase letters.' },
        { status: 400 }
      );
    }

    // Determine organization ID
    let organizationId = user.organization?._id;

    // If super admin without organization, use the one from the data if provided, or create a fallback
    if (user.role === 'super_admin' && !organizationId) {
      if (data.organizationId) {
        organizationId = data.organizationId;
      } else {
        return NextResponse.json(
          { error: 'Super admin must specify an organizationId when creating NOTAMs' },
          { status: 400 }
        );
      }
    }

    // Create NOTAM
    const notam = new NOTAM({
      id: notamId,
      series: data.series,
      number: parseInt(data.number),
      year: parseInt(year),
      type: data.type,
      scope: data.scope,
      purpose: data.purpose,
      location: data.location,
      effectiveFrom: new Date(data.effectiveFrom),
      effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
      schedule: data.schedule || null,
      text: data.text,
      category: data.category,
      traffic: data.traffic,
      lower: data.lower || null,
      upper: data.upper || null,
      coordinates: data.coordinates || null,
      radius: data.radius || null,
      status: 'active',
      organizationId: organizationId,
      createdBy: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
      lastModified: new Date(),
    });

    await notam.save();

    return NextResponse.json({
      success: true,
      notam,
      message: 'NOTAM created successfully'
    }, { status: 201 });

  } catch (error) {
    return createErrorResponse(error, 'Failed to create NOTAM');
  }
});