import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { readCloudStore, isUserDeleted, findServerUserByIdentifier } from '@/lib/server-user-store';

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

    const userIdentifier = sessionUser.employeeId || sessionUser.employee_id || sessionUser.email || sessionUser.mobile_no || sessionUser.mobileNo || sessionUser.id;

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

    const serverUser = findServerUserByIdentifier(userIdentifier, serverUsers);

    if (!serverUser) {
      const response = NextResponse.json({ authenticated: false, error: 'Account no longer exists' }, { status: 401 });
      response.cookies.delete('better-auth.session_token');
      response.cookies.delete('hospital_erp_user');
      return response;
    }

    const empId = serverUser.employeeId || serverUser.employee_id || serverUser.frappeStaffId || serverUser.id;

    // Check if session version matches (if password was reset on another device, invalidate old session)
    if (sessionUser.sessionVersion && serverUser.sessionVersion && sessionUser.sessionVersion !== serverUser.sessionVersion) {
      const response = NextResponse.json({ authenticated: false, error: 'Password updated. Please log in again.' }, { status: 401 });
      response.cookies.delete('better-auth.session_token');
      response.cookies.delete('hospital_erp_user');
      return response;
    }

    const userObj = {
      id: serverUser.id || sessionUser.id,
      employeeId: empId,
      employee_id: empId,
      frappeStaffId: empId,
      email: serverUser.email,
      full_name: serverUser.full_name || serverUser.name || serverUser.email,
      name: serverUser.full_name || serverUser.name || serverUser.email,
      mobile_no: serverUser.mobile_no || '',
      mobileNo: serverUser.mobile_no || '',
      roles: serverUser.roles || [serverUser.role || 'Staff Member'],
      role: serverUser.role || (serverUser.roles?.[0]) || 'Staff Member',
      permissions: serverUser.permissions || [],
      department: serverUser.department || '',
      designation: serverUser.designation || '',
      sessionVersion: serverUser.sessionVersion || 1,
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
