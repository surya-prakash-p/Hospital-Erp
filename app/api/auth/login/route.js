import { NextResponse } from 'next/server';
import { readCloudStore, isUserDeleted } from '@/lib/server-user-store';

export async function POST(req) {
  try {
    const body = await req.json();
    const loginIdentifier = (body.identifier || body.email || '').trim();
    const password = (body.password || '').trim();

    if (!loginIdentifier || !password) {
      return NextResponse.json({ error: 'Please enter Email / Mobile Number and Password' }, { status: 400 });
    }

    const cleanInputStr = loginIdentifier.toLowerCase();
    const cleanInputDigits = loginIdentifier.replace(/\D/g, '');
    const isInputDigits = cleanInputDigits.length >= 7;

    // 1. Fetch Central Cloud Store (Single Source of Truth)
    const cloudStore = await readCloudStore();
    const serverUsers = cloudStore.users || [];
    const serverDeleted = cloudStore.deleted || [];

    // 2. Check if account is deleted
    if (isUserDeleted(loginIdentifier, serverDeleted)) {
      return NextResponse.json({ error: 'This staff account has been deleted by Hospital Admin' }, { status: 401 });
    }

    // 3. Match user by Email OR Mobile Number
    const registeredUser = serverUsers.find(u => {
      const userEmail = (u.email || '').trim().toLowerCase();
      const userMobileDigits = (u.mobile_no || u.phone || '').replace(/\D/g, '');

      const matchesEmail = Boolean(userEmail && userEmail === cleanInputStr);
      const matchesMobile = Boolean(isInputDigits && userMobileDigits.length >= 7 && (
        userMobileDigits === cleanInputDigits ||
        userMobileDigits.endsWith(cleanInputDigits) ||
        cleanInputDigits.endsWith(userMobileDigits)
      ));

      return matchesEmail || matchesMobile;
    });

    if (!registeredUser) {
      return NextResponse.json({ error: 'Invalid email/mobile number or password' }, { status: 401 });
    }

    // Check if account is inactive or deleted
    if (registeredUser.active === false || isUserDeleted(registeredUser.email, serverDeleted) || isUserDeleted(registeredUser.mobile_no, serverDeleted)) {
      return NextResponse.json({ error: 'This staff account has been deactivated or deleted' }, { status: 401 });
    }

    // 4. Verify password
    const storedPwd = (registeredUser.password || '').trim();
    if (!storedPwd || storedPwd !== password) {
      return NextResponse.json({ error: 'Invalid email/mobile number or password' }, { status: 401 });
    }

    // 5. Construct session object
    const userObj = {
      id: registeredUser.id || `USER-${Date.now()}`,
      email: registeredUser.email,
      full_name: registeredUser.full_name || registeredUser.name || registeredUser.email,
      name: registeredUser.full_name || registeredUser.name || registeredUser.email,
      mobile_no: registeredUser.mobile_no || '',
      mobileNo: registeredUser.mobile_no || '',
      role: registeredUser.role || (registeredUser.roles?.[0]) || 'Staff Member',
      roles: registeredUser.roles || ['Staff Member'],
      department: registeredUser.department || '',
      designation: registeredUser.designation || '',
      frappeStaffId: registeredUser.frappeStaffId || '',
      active: true
    };

    const response = NextResponse.json({ success: true, user: userObj });

    // Set Better Auth & ERP session cookies
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

  } catch (error) {
    console.error("Login Route Error:", error);
    return NextResponse.json({ error: 'Invalid email/mobile number or password' }, { status: 401 });
  }
}
