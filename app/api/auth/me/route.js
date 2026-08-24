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

import { isUserDeleted } from '@/lib/server-user-store';

export async function GET(req) {
  try {
    const cookie = req.cookies.get('hospital_erp_user');
    if (!cookie || !cookie.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    let user = JSON.parse(cookie.value);

    // Revoke session if user has been deleted by Admin
    if (isUserDeleted(user.email) || isUserDeleted(user.mobile_no)) {
      const response = NextResponse.json({ authenticated: false, error: 'Account has been deleted' }, { status: 401 });
      response.cookies.delete('hospital_erp_user');
      return response;
    }

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

        // Also check if user is in Hospital Doctor Doctype
        const filterStr = JSON.stringify([["email", "=", user.email]]);
        const docRes = await fetch(`${siteUrl}/api/resource/Hospital Doctor?filters=${encodeURIComponent(filterStr)}&fields=["*"]`, {
          headers: { 'Authorization': `token ${apiKey}:${apiSecret}` },
          cache: 'no-store'
        });
        if (docRes.ok) {
          const docData = await docRes.json();
          if (docData.data && docData.data.length > 0) {
            const doctorProfile = docData.data[0];
            if (!user.roles.includes('Doctor')) {
              user.roles.push('Doctor');
            }
            user.full_name = doctorProfile.doctor_name || user.full_name;
            user.doctor_name = doctorProfile.doctor_name;
            user.specialization = doctorProfile.specialization || user.specialization;
            user.qualification = doctorProfile.qualifications || user.qualification;
            user.qualifications = doctorProfile.qualifications || user.qualifications;
            user.fee = doctorProfile.consultation_fee || user.fee;
            user.consultation_fee = doctorProfile.consultation_fee || user.consultation_fee;
            user.location = doctorProfile.location || user.location;
            user.room_no = doctorProfile.location || user.room_no;
            user.doctor_image = doctorProfile.doctor_image || user.doctor_image;
            user.avatar = doctorProfile.doctor_image || user.avatar;
            user.experience = doctorProfile.experience || user.experience;
            user.about = doctorProfile.about || user.about;
          }
        }
      } catch (e) {
        console.warn('Could not refresh live roles/doctor info from Frappe:', e.message);
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
