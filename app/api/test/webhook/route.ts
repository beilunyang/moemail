import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    console.log('[TEST-WEBHOOK] Received test webhook:', {
      headers: Object.fromEntries(request.headers.entries()),
      payload,
    });

    return NextResponse.json({
      success: true,
      message: 'Test webhook received successfully',
      receivedAt: new Date().toISOString(),
      payload,
    });
  } catch (error) {
    console.error('[TEST-WEBHOOK] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process test webhook' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Test Webhook Endpoint',
    timestamp: new Date().toISOString(),
  });
}
