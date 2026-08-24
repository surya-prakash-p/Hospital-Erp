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

import { findServerUser, saveServerUser, isUserDeleted, findServerUserByIdentifier, readServerUsers } from '@/lib/server-user-store';

export async function POST(req) {
  try {
    const { identifier, password, localStaff, localDeleted } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Please enter Email / Mobile Number and Password' }, { status: 400 });
    }

    const cleanInputStr = identifier.trim().toLowerCase();
    const cleanInputDigits = identifier.replace(/\D/g, '');
    const isInputDigits = cleanInputDigits.length >= 7;

    // Check if identifier is in localDeleted or server deleted list
    const isDeletedOnServer = isUserDeleted(identifier);
    const isDeletedOnClient = Array.isArray(localDeleted) && localDeleted.some(d => {
      const dStr = (d || '').trim().toLowerCase();
      const dDigits = dStr.replace(/\D/g, '');
      return (dStr && cleanInputStr && (dStr === cleanInputStr || dStr.includes(cleanInputStr))) ||
             (isInputDigits && dDigits.length >= 7 && (dDigits === cleanInputDigits || dDigits.endsWith(cleanInputDigits) || cleanInputDigits.endsWith(dDigits)));
    });

    if (isDeletedOnServer || isDeletedOnClient) {
      return NextResponse.json({ error: 'This staff account has been deleted by Hospital Admin' }, { status: 401 });
    }

    // Merge server users with localStaff sent from client browser
    const serverUsers = readServerUsers();
    let mergedUsersMap = new Map();

    // 1. Add server users first
    serverUsers.forEach(u => {
      const key = (u.email || u.mobile_no || '').toLowerCase();
      if (key) mergedUsersMap.set(key, { ...u });
    });

    // 2. Override with localStaff sent from client (has latest updated passwords)
    if (Array.isArray(localStaff) && localStaff.length > 0) {
      localStaff.forEach(lu => {
        const emailKey = (lu.email || '').toLowerCase();
        const mobileDigits = (lu.mobile_no || lu.phone || '').replace(/\D/g, '');

        let matchKey = null;
        for (let [k, v] of mergedUsersMap.entries()) {
          const vEmail = (v.email || '').toLowerCase();
          const vMobileDigits = (v.mobile_no || '').replace(/\D/g, '');

          const emailMatch = Boolean(emailKey && vEmail && emailKey === vEmail);
          const mobileMatch = Boolean(mobileDigits.length >= 7 && vMobileDigits.length >= 7 && (
            mobileDigits === vMobileDigits || mobileDigits.endsWith(vMobileDigits) || vMobileDigits.endsWith(mobileDigits)
          ));

          if (emailMatch || mobileMatch) {
            matchKey = k;
            break;
          }
        }

        if (matchKey) {
          const existing = mergedUsersMap.get(matchKey);
          mergedUsersMap.set(matchKey, {
            ...existing,
            ...lu,
            password: (lu.password || '').trim() || existing.password
          });
        } else if (emailKey || mobileDigits) {
          mergedUsersMap.set(emailKey || mobileDigits, { ...lu, password: (lu.password || '').trim() });
        }
      });
    }

    const allUsers = Array.from(mergedUsersMap.values());

    // Find user in merged list
    const registeredUser = allUsers.find(u => {
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

      // Save to server store as background sync
      saveServerUser({
        email: registeredUser.email,
        password: inputPwd,
        full_name: registeredUser.full_name,
        mobile_no: registeredUser.mobile_no,
        roles: registeredUser.roles,
        permissions: registeredUser.permissions,
        department: registeredUser.department,
        designation: registeredUser.designation
      });

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
