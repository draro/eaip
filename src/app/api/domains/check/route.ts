import { NextRequest, NextResponse } from 'next/server';
import { checkDNSRecords, getDNSSetupInstructions } from '@/lib/dns';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, targetIP } = body;

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Basic domain validation
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { success: false, error: 'Invalid domain format' },
        { status: 400 }
      );
    }

    // Default target IP (this should be configurable)
    const defaultTargetIP = process.env.EAIP_TARGET_IP || '127.0.0.1';
    const checkTargetIP = targetIP || defaultTargetIP;

    const dnsResult = await checkDNSRecords(domain, checkTargetIP);
    const setupInstructions = getDNSSetupInstructions(domain, checkTargetIP);

    return NextResponse.json({
      success: true,
      data: {
        domain,
        targetIP: checkTargetIP,
        dnsCheck: dnsResult,
        setupInstructions,
        isConfigured: dnsResult.valid,
        lastChecked: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error checking DNS records:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check DNS records' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');

  if (!domain) {
    return NextResponse.json(
      { success: false, error: 'Domain parameter is required' },
      { status: 400 }
    );
  }

  try {
    const defaultTargetIP = process.env.EAIP_TARGET_IP || '127.0.0.1';
    const dnsResult = await checkDNSRecords(domain, defaultTargetIP);

    return NextResponse.json({
      success: true,
      data: {
        domain,
        targetIP: defaultTargetIP,
        dnsCheck: dnsResult,
        isConfigured: dnsResult.valid,
        lastChecked: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error checking DNS records:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check DNS records' },
      { status: 500 }
    );
  }
}