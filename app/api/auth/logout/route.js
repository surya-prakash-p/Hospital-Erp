import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const response = NextResponse.json({ success: true });
    response.cookies.delete('better-auth.session_token');
    response.cookies.delete('hospital_erp_user');
    response.cookies.delete('__Secure-better-auth.session_token');
    return response;
  } catch (err) {
    return NextResponse.json({ success: true });
  }
}

