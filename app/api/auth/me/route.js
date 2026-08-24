import { NextResponse } from 'next/server';
import { readCloudStore, isUserDeleted, findServerUserByIdentifier } from '@/lib/server-user-store';

export async function GET(req) {
  try {
    const cookie = req.cookies.get('hospital_erp_user');
    if (!cookie || !cookie.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    let sessionUser = JSON.parse(cookie.value);
    const userIdentifier = sessionUser.email || sessionUser.mobile_no;

    // 1. Query CENTRAL CLOUD DATABASE for fresh account state
    const cloudStore = await readCloudStore();
    const serverUsers = cloudStore.users || [];
    const serverDeleted = cloudStore.deleted || [];

    // 2. Revoke session if account is in deleted blacklist
    if (isUserDeleted(userIdentifier, serverDeleted) || isUserDeleted(sessionUser.email, serverDeleted) || isUserDeleted(sessionUser.mobile_no, serverDeleted)) {
      const response = NextResponse.json({ authenticated: false, error: 'Account has been deleted' }, { status: 401 });
      response.cookies.delete('hospital_erp_user');
      return response;
    }

    // 3. Find server user in Central Cloud Database
    const serverUser = findServerUserByIdentifier(userIdentifier, serverUsers);
    if (!serverUser) {
      const response = NextResponse.json({ authenticated: false, error: 'Account no longer exists' }, { status: 401 });
      response.cookies.delete('hospital_erp_user');
      return response;
    }

    // 4. Session Invalidation Check: Verify sessionVersion
    const cookieVersion = sessionUser.sessionVersion || 1;
    const serverVersion = serverUser.sessionVersion || 1;

    if (cookieVersion !== serverVersion) {
      // Password was reset by Admin! Invalidate existing session immediately.
      const response = NextResponse.json({ authenticated: false, error: 'Session expired due to password reset. Please log in again.' }, { status: 401 });
      response.cookies.delete('hospital_erp_user');
      return response;
    }

    // Sync current profile details from server user
    const updatedUserObj = {
      ...sessionUser,
      full_name: serverUser.full_name || sessionUser.full_name,
      mobile_no: serverUser.mobile_no || sessionUser.mobile_no,
      roles: serverUser.roles || sessionUser.roles,
      permissions: serverUser.permissions || sessionUser.permissions,
      department: serverUser.department || sessionUser.department,
      designation: serverUser.designation || sessionUser.designation,
      sessionVersion: serverVersion
    };

    const response = NextResponse.json({ authenticated: true, user: updatedUserObj });
    response.cookies.set('hospital_erp_user', JSON.stringify(updatedUserObj), {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });

    return response;

  } catch (err) {
    console.error("GET /api/auth/me Error:", err);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
