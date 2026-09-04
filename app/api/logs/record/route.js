import { NextResponse } from 'next/server';
import { recordAuditLog } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const { type, action, description, actor, target, metadata } = body;

    // Get client IP and User-Agent if available
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Browser Client';

    const enrichedMetadata = {
      ...(metadata || {}),
      ip: (metadata?.ip) || ip.split(',')[0].trim(),
      userAgent: (metadata?.userAgent) || userAgent
    };

    const logged = await recordAuditLog({
      type: type || 'system',
      action: action || 'Action Recorded',
      description: description || '',
      actor: actor || null,
      target: target || '',
      metadata: enrichedMetadata
    });

    return NextResponse.json({
      success: true,
      log: logged
    });
  } catch (error) {
    console.error("Audit log record API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record audit log' },
      { status: 500 }
    );
  }
}
