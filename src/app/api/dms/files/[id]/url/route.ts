import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import DMSFile from '@/models/DMSFile';
import User from '@/models/User';
import { getSignedUrl } from '@/lib/googleCloudStorage';

/**
 * GET /api/dms/files/[id]/url
 * Generate a fresh signed URL for a file in GCS
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the file
    const file = await DMSFile.findById(params.id);
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check if user has access to this file
    if (file.organization?.toString() !== user.organization?.toString() && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'You do not have permission to access this file' },
        { status: 403 }
      );
    }

    // Check role-based access
    if (!file.canUserAccess(user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to access this file' },
        { status: 403 }
      );
    }

    // Get GCS path from metadata or filePath
    const gcsPath = file.metadata?.gcsPath || file.filePath;

    // Generate a fresh signed URL (valid for 1 hour)
    const signedUrl = await getSignedUrl(gcsPath, 60);

    // Update the file's storageUrl with the new signed URL
    file.storageUrl = signedUrl;
    await file.save();

    return NextResponse.json({
      success: true,
      url: signedUrl,
      expiresIn: 3600, // 1 hour in seconds
    });
  } catch (error: any) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate signed URL', details: error.message },
      { status: 500 }
    );
  }
}
