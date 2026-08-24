import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

let frappeConfig = null;
try {
  const configPath = path.join(process.cwd(), 'frappe_config.json');
  if (fs.existsSync(configPath)) {
    frappeConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (err) {
  console.error('Failed to load frappe_config.json:', err);
}

const siteUrl = process.env.FRAPPE_SITE_URL || frappeConfig?.site_url || 'https://thangamhospital.m.frappe.cloud';
const apiKey = process.env.FRAPPE_API_KEY || frappeConfig?.api_key;
const apiSecret = process.env.FRAPPE_API_SECRET || frappeConfig?.api_secret;

import { findServerUser, saveServerUser, isUserDeleted, findServerUserByIdentifier } from '@/lib/server-user-store';

export async function POST(req) {
  try {
    const { identifier, password, localStaff } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Please enter Email / Mobile Number and Password' }, { status: 400 });
    }

    let targetEmail = identifier.trim();

    if (isUserDeleted(targetEmail)) {
      return NextResponse.json({ error: 'This staff account has been deleted by Hospital Admin' }, { status: 401 });
    }

    // 1. Check if user is registered in server-side persistent credentials store
    const registeredUser = findServerUserByIdentifier(targetEmail);

    if (registeredUser) {
      if (isUserDeleted(registeredUser.email) || isUserDeleted(registeredUser.mobile_no)) {
        return NextResponse.json({ error: 'This staff account has been deleted by Hospital Admin' }, { status: 401 });
      }

      // Check password strictly against registered user's current password
      const storedPwd = (registeredUser.password || '').trim();
      const inputPwd = (password || '').trim();

      if (!inputPwd || !storedPwd || storedPwd !== inputPwd) {
        return NextResponse.json({ error: 'Invalid email/mobile number or password' }, { status: 401 });
      }

      // Password matches registered user -> LOGIN SUCCESS
      const userObj = {
        email: registeredUser.email,
        full_name: registeredUser.full_name,
        name: registeredUser.full_name,
        mobile_no: registeredUser.mobile_no,
        roles: registeredUser.roles || ['Staff Member'],
        permissions: registeredUser.permissions || [],
        department: registeredUser.department || '',
        designation: registeredUser.designation || ''
      };

      const response = NextResponse.json({ success: true, user: userObj });
      response.cookies.set('hospital_erp_user', JSON.stringify(userObj), {
        httpOnly: false,
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
      return response;
    }

    const isMobileNumber = /^[0-9+-\s()]{7,15}$/.test(targetEmail);

    // If identifier is a mobile number, lookup corresponding User in Frappe
    if (isMobileNumber && apiKey && apiSecret) {
      const cleanMobile = targetEmail.replace(/\D/g, '');
      const filterStr = JSON.stringify([["mobile_no", "like", `%${cleanMobile}%`]]);
      const lookupUrl = `${siteUrl}/api/resource/User?filters=${encodeURIComponent(filterStr)}&fields=["name","email","mobile_no"]`;
      
      const lookupRes = await fetch(lookupUrl, {
        headers: { 'Authorization': `token ${apiKey}:${apiSecret}` },
        cache: 'no-store'
      });

      if (lookupRes.ok) {
        const lookupData = await lookupRes.json();
        if (lookupData.data && lookupData.data.length > 0) {
          targetEmail = lookupData.data[0].email || lookupData.data[0].name;
        }
      }
    }

    // 1. Authenticate with Frappe /api/method/login
    const loginRes = await fetch(`${siteUrl}/api/method/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usr: targetEmail, pwd: password }),
      cache: 'no-store'
    });

    if (!loginRes.ok) {
      return NextResponse.json({ error: 'Invalid email/mobile number or password' }, { status: 401 });
    }

    // 2. Fetch User Profile and Roles from Frappe User DocType
    let roles = [];
    let fullName = targetEmail;
    let userMobile = targetEmail;

    if (apiKey && apiSecret) {
      const userRes = await fetch(`${siteUrl}/api/resource/User/${encodeURIComponent(targetEmail)}`, {
        headers: { 'Authorization': `token ${apiKey}:${apiSecret}` },
        cache: 'no-store'
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        const info = userData.data || {};
        fullName = info.full_name || info.first_name || targetEmail;
        userMobile = info.mobile_no || info.phone || targetEmail;
        roles = (info.roles || []).map(r => r.role);
      }
    }

    // 3. Lookup Doctor Profile by email in Frappe Hospital Doctor
    let doctorProfile = null;
    if (apiKey && apiSecret) {
      try {
        const filterStr = JSON.stringify([["email", "=", targetEmail]]);
        const docRes = await fetch(`${siteUrl}/api/resource/Hospital Doctor?filters=${encodeURIComponent(filterStr)}&fields=["*"]`, {
          headers: { 'Authorization': `token ${apiKey}:${apiSecret}` },
          cache: 'no-store'
        });
        if (docRes.ok) {
          const docData = await docRes.json();
          if (docData.data && docData.data.length > 0) {
            doctorProfile = docData.data[0];
          }
        }
      } catch (docErr) {
        console.warn('Doctor profile lookup failed during login:', docErr.message);
      }
    }

    if (doctorProfile) {
      if (!roles.includes('Doctor')) {
        roles.push('Doctor');
      }
      fullName = doctorProfile.doctor_name || fullName;
    }

    if (roles.length === 0) {
      roles = ['Hospital Admin']; // Default fallback role
    }

    const userObj = {
      email: targetEmail,
      full_name: fullName,
      name: fullName,
      mobile_no: userMobile,
      roles: roles,
      ...(doctorProfile ? {
        doctor_name: doctorProfile.doctor_name,
        specialization: doctorProfile.specialization || "General Medicine",
        qualification: doctorProfile.qualifications || "MBBS, MD",
        qualifications: doctorProfile.qualifications || "MBBS, MD",
        fee: doctorProfile.consultation_fee || 500,
        consultation_fee: doctorProfile.consultation_fee || 500,
        location: doctorProfile.location || "OPD Room 102",
        room_no: doctorProfile.location || "OPD Room 102",
        doctor_image: doctorProfile.doctor_image || "",
        avatar: doctorProfile.doctor_image || "",
        experience: doctorProfile.experience || "",
        about: doctorProfile.about || ""
      } : {})
    };

    saveServerUser({
      email: targetEmail,
      password: password,
      full_name: fullName,
      mobile_no: userMobile,
      roles: roles
    });

    const response = NextResponse.json({ success: true, user: userObj });
    response.cookies.set('hospital_erp_user', JSON.stringify(userObj), {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Authentication failed: ' + error.message }, { status: 500 });
  }
}
