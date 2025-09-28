import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getOrCreateDefaultUser } from '@/lib/defaultUser';
import { remoteStorage } from '@/lib/remoteStorage';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { connectionId } = body;

    if (!connectionId) {
      return NextResponse.json(
        { success: false, error: 'Connection ID is required' },
        { status: 400 }
      );
    }

    // In a real app, get userId from session
    const userId = await getOrCreateDefaultUser();

    const user = await User.findById(userId);
    if (!user || !user.companySettings) {
      return NextResponse.json(
        { success: false, error: 'User or company settings not found' },
        { status: 404 }
      );
    }

    const connection = user.companySettings.remoteConnections.find(
      conn => conn.id === connectionId
    );

    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Remote connection not found' },
        { status: 404 }
      );
    }

    // Test the connection
    const success = await remoteStorage.syncToRemote(connection);

    if (success) {
      // Update last sync time
      connection.lastSync = new Date();
      await user.save();

      return NextResponse.json({
        success: true,
        message: 'Remote connection tested successfully',
        data: { lastSync: connection.lastSync },
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to connect to remote storage' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error testing remote connection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test remote connection' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { connectionId, enabled } = body;

    if (!connectionId || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Connection ID and enabled status are required' },
        { status: 400 }
      );
    }

    // In a real app, get userId from session
    const userId = await getOrCreateDefaultUser();

    const user = await User.findById(userId);
    if (!user || !user.companySettings) {
      return NextResponse.json(
        { success: false, error: 'User or company settings not found' },
        { status: 404 }
      );
    }

    const connection = user.companySettings.remoteConnections.find(
      conn => conn.id === connectionId
    );

    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Remote connection not found' },
        { status: 404 }
      );
    }

    connection.enabled = enabled;
    await user.save();

    return NextResponse.json({
      success: true,
      message: `Remote connection ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: connection,
    });
  } catch (error) {
    console.error('Error updating remote connection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update remote connection' },
      { status: 500 }
    );
  }
}