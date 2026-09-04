import { NextResponse } from 'next/server';
import { getAuditLogs, clearAuditLogs } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all';
    const role = searchParams.get('role') || 'all';
    const user = searchParams.get('user') || '';
    const dateRange = searchParams.get('dateRange') || 'all';
    const limit = parseInt(searchParams.get('limit') || '300', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);

    const result = await getAuditLogs({
      search,
      type,
      role,
      user,
      dateRange,
      limit,
      page
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Audit log list API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const res = await clearAuditLogs();
    return NextResponse.json(res);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to clear audit logs' },
      { status: 500 }
    );
  }
}
