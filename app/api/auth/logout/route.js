import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const res = await auth.api.signOut({
      headers: req.headers,
      asResponse: true
    });
    return res;
  } catch (err) {
    return NextResponse.json({ success: true });
  }
}
