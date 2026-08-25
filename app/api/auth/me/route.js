import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { readCloudStore, isUserDeleted } from '@/lib/server-user-store';

export async function GET(req) {
  try {
    const cookie = req.cookies.get('better-auth.session_token') || req.cookies.get('hospital_erp_user');
    if (!cookie || !cookie.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    let sessionUser = null;
    try {
      sessionUser = JSON.parse(cookie.value);
    } catch (e) {
      const session = await auth.api.getSession({ headers: req.headers }).catch(() => null);
      sessionUser = session?.user;
    }

    if (!sessionUser) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const userIdentifier = sessionUser.email || sessionUser.mobile_no || sessionUser.mobileNo;

    // Fresh cloud lookup
    const cloudStore = await readCloudStore();
    const serverUsers = cloudStore.users || [];
    const serverDeleted = cloudStore.deleted || [];

    if (isUserDeleted(userIdentifier, serverDeleted)) {
      const response = NextResponse.json({ authenticated: false, error: 'Account has been deleted' }, { status: 401 });
      response.cookies.delete('better-auth.session_token');
      response.cookies.delete('hospital_erp_user');
      return response;
    }

    const serverUser = serverUsers.find(u => {
      const uEmail = (u.email || '').trim().toLowerCase();
      const uMobile = (u.mobile_no || u.phone || '').replace(/\D/g, '');
      const sStr = (userIdentifier || '').trim().toLowerCase();
      const sDigits = sStr.replace(/\D/g, '');
      return uEmail === sStr || (sDigits.length >= 7 && uMobile.length >= 7 && uMobile === sDigits);
    });

    if (!serverUser) {
      const response = NextResponse.json({ authenticated: false, error: 'Account no longer exists' }, { status: 401 });
      response.cookies.delete('better-auth.session_token');
      response.cookies.delete('hospital_erp_user');
      return response;
    }

    const userObj = {
      id: serverUser.id || sessionUser.id,
      email: serverUser.email,
      full_name: serverUser.full_name || serverUser.name || serverUser.email,
      name: serverUser.full_name || serverUser.name || serverUser.email,
      mobile_no: serverUser.mobile_no || '',
      mobileNo: serverUser.mobile_no || '',
      roles: serverUser.roles || [serverUser.role || 'Staff Member'],
      role: serverUser.role || (serverUser.roles?.[0]) || 'Staff Member',
      department: serverUser.department || '',
      designation: serverUser.designation || '',
      frappeStaffId: serverUser.frappeStaffId || '',
      active: serverUser.active !== false
    };

    const response = NextResponse.json({ authenticated: true, user: userObj });
    response.cookies.set('better-auth.session_token', JSON.stringify(userObj), {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });
    response.cookies.set('hospital_erp_user', JSON.stringify(userObj), {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });

    return response;
  } catch (err) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
