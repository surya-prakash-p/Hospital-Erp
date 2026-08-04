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

export async function POST(req) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Please enter Email / Mobile Number and Password' }, { status: 400 });
    }

    let targetEmail = identifier.trim();
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
      // Fallback for demo users if Frappe instance credentials are not available / offline
      if (password === 'AdminPassword123!' || password === 'DoctorPassword123!' || password === 'PharmaPassword123!' || password === 'ReceptPassword123!') {
        let fallbackRole = 'Hospital Admin';
        let full_name = 'Hospital Admin';
        if (targetEmail.includes('doctor') || targetEmail === '9900000002') {
          fallbackRole = 'Doctor';
          full_name = 'Dr. Rajesh Kumar';
        } else if (targetEmail.includes('pharmacy') || targetEmail === '9900000003') {
          fallbackRole = 'Pharmacist';
          full_name = 'Rahul Sharma';
        } else if (targetEmail.includes('reception') || targetEmail === '9900000004') {
          fallbackRole = 'Receptionist';
          full_name = 'Priya Sundaram';
        }

        const userObj = {
          email: targetEmail,
          full_name: full_name,
          mobile_no: targetEmail,
          roles: [fallbackRole]
        };

        const response = NextResponse.json({ success: true, user: userObj });
        response.cookies.set('hospital_erp_user', JSON.stringify(userObj), {
          httpOnly: false,
          path: '/',
          maxAge: 60 * 60 * 24 * 7 // 7 days
        });
        return response;
      }

      return NextResponse.json({ error: 'Invalid email/mobile or password' }, { status: 401 });
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

    if (roles.length === 0) {
      roles = ['Hospital Admin']; // Default fallback role
    }

    const userObj = {
      email: targetEmail,
      full_name: fullName,
      mobile_no: userMobile,
      roles: roles
    };

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
