import { NextResponse } from 'next/server';
import { readCloudStore, isUserDeleted } from '@/lib/server-user-store';

export async function POST(req) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Please enter Email / Mobile Number and Password' }, { status: 400 });
    }

    const targetEmail = identifier.trim();
    const cleanInputStr = targetEmail.toLowerCase();
    const cleanInputDigits = targetEmail.replace(/\D/g, '');
    const isInputDigits = cleanInputDigits.length >= 7;

    // 1. Fetch CENTRAL CLOUD DATABASE as the SINGLE SOURCE OF TRUTH
    const cloudStore = await readCloudStore();
    const serverUsers = cloudStore.users || [];
    const serverDeleted = cloudStore.deleted || [];

    // 2. Check if user is in deleted list
    if (isUserDeleted(targetEmail, serverDeleted)) {
      return NextResponse.json({ error: 'This staff account has been deleted by Hospital Admin' }, { status: 401 });
    }

    // 3. Find user in Central Cloud Database by Email OR Mobile Number
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

    // Check if user is deleted
    if (isUserDeleted(registeredUser.email, serverDeleted) || isUserDeleted(registeredUser.mobile_no, serverDeleted)) {
      return NextResponse.json({ error: 'This staff account has been deleted by Hospital Admin' }, { status: 401 });
    }

    // 4. Verify password strictly against Central Cloud Database
    const storedPwd = (registeredUser.password || '').trim();
    const inputPwd = (password || '').trim();

    if (!inputPwd || !storedPwd || storedPwd !== inputPwd) {
      return NextResponse.json({ error: 'Invalid email/mobile number or password' }, { status: 401 });
    }

    // 5. Password matches -> Construct session object with sessionVersion for session invalidation
    const userObj = {
      id: registeredUser.id,
      email: registeredUser.email,
      full_name: registeredUser.full_name,
      name: registeredUser.full_name,
      mobile_no: registeredUser.mobile_no,
      roles: registeredUser.roles || ['Staff Member'],
      permissions: registeredUser.permissions || [],
      department: registeredUser.department || '',
      designation: registeredUser.designation || '',
      sessionVersion: registeredUser.sessionVersion || 1
    };

    const response = NextResponse.json({ success: true, user: userObj });
    response.cookies.set('hospital_erp_user', JSON.stringify(userObj), {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;

  } catch (error) {
    console.error("Login Route Error:", error);
    return NextResponse.json({ error: 'Invalid email/mobile number or password' }, { status: 401 });
  }
}
