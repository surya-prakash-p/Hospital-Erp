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

export async function GET(req) {
  try {
    const cookie = req.cookies.get('hospital_erp_user');
    if (!cookie || !cookie.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    let user = JSON.parse(cookie.value);

    // Fetch fresh roles from Frappe Cloud if API credentials exist
    if (user.email && apiKey && apiSecret) {
      try {
        const userRes = await fetch(`${siteUrl}/api/resource/User/${encodeURIComponent(user.email)}`, {
          headers: { 'Authorization': `token ${apiKey}:${apiSecret}` },
          cache: 'no-store'
        });

        if (userRes.ok) {
          const userData = await userRes.json();
          const info = userData.data || {};
          const liveRoles = (info.roles || []).map(r => r.role);
          if (liveRoles.length > 0) {
            user.roles = liveRoles;
            if (info.full_name) user.full_name = info.full_name;
            if (info.mobile_no) user.mobile_no = info.mobile_no;
          }
        }
      } catch (e) {
        console.warn('Could not refresh live roles from Frappe:', e.message);
      }
    }

    const response = NextResponse.json({ authenticated: true, user });
    // Keep cookie updated with latest roles
    response.cookies.set('hospital_erp_user', JSON.stringify(user), {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });

    return response;
  } catch (err) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
