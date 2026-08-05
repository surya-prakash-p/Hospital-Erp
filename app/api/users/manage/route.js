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
  console.error('Failed to load frappe_config.json in user management API:', err);
}

const siteUrl = process.env.FRAPPE_SITE_URL || frappeConfig?.site_url || 'https://thangamhospital.m.frappe.cloud';
const apiKey = process.env.FRAPPE_API_KEY || frappeConfig?.api_key;
const apiSecret = process.env.FRAPPE_API_SECRET || frappeConfig?.api_secret;

// Helper to make authorized Frappe requests
async function frappeFetch(endpoint, options = {}) {
  if (!apiKey || !apiSecret) {
    throw new Error("Frappe API credentials missing in frappe_config.json");
  }

  const cleanSiteUrl = siteUrl.replace(/\/$/, '');
  const url = `${cleanSiteUrl}${endpoint}`;

  const headers = {
    'Authorization': `token ${apiKey}:${apiSecret}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {})
  };

  const res = await fetch(url, {
    ...options,
    headers,
    cache: 'no-store'
  });

  const text = await res.text();
  let json = {};
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = { raw: text };
  }

  if (!res.ok) {
    throw new Error(json.exception || json.message || `Frappe HTTP ${res.status}: ${text}`);
  }

  return json;
}

// GET: List all users from Frappe
export async function GET(req) {
  try {
    if (apiKey && apiSecret) {
      try {
        const data = await frappeFetch('/api/resource/User?fields=["name","email","first_name","last_name","full_name","mobile_no","enabled","user_type"]&limit=200');
        const users = data.data || [];
        
        // Fetch detailed roles for each user in parallel
        const usersWithRoles = await Promise.all(users.map(async (u) => {
          try {
            const userDetail = await frappeFetch(`/api/resource/User/${encodeURIComponent(u.name)}`);
            const info = userDetail.data || {};
            const roles = (info.roles || []).map(r => r.role);
            return {
              ...u,
              roles: roles.length > 0 ? roles : ['Staff Member']
            };
          } catch (err) {
            return { ...u, roles: ['Staff Member'] };
          }
        }));

        return NextResponse.json({ success: true, users: usersWithRoles });
      } catch (err) {
        console.warn("Frappe user fetch failed, fallback to local users", err.message);
      }
    }

    return NextResponse.json({ success: true, users: [] });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { saveServerUser } from '@/lib/server-user-store';

// POST: Create or Update User with Role & Password in Backend
export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password, full_name, mobile_no, roles, permissions, department, designation, employee_id } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    const cleanEmail = email.trim();
    const nameParts = (full_name || cleanEmail).split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';
    const userRoles = Array.isArray(roles) && roles.length > 0 ? roles : ['Staff Member'];

    // Always persist to server-side credentials store for immediate, seamless login
    saveServerUser({
      email: cleanEmail,
      password: password,
      full_name: full_name || cleanEmail,
      mobile_no: mobile_no || cleanEmail,
      roles: userRoles,
      permissions: permissions || [],
      department: department || '',
      designation: designation || userRoles[0]
    });

    let frappeUser = null;

    if (apiKey && apiSecret) {
      try {
        // Check if user already exists in Frappe
        let existingUser = null;
        try {
          const checkRes = await frappeFetch(`/api/resource/User/${encodeURIComponent(cleanEmail)}`);
          existingUser = checkRes.data;
        } catch (e) {
          existingUser = null;
        }

        const roleObjects = userRoles.map(r => ({ role: r }));

        if (existingUser) {
          // Update existing user
          const updateRes = await frappeFetch(`/api/resource/User/${encodeURIComponent(cleanEmail)}`, {
            method: 'PUT',
            body: JSON.stringify({
              first_name: firstName,
              last_name: lastName,
              mobile_no: mobile_no || cleanEmail,
              phone: mobile_no || cleanEmail,
              roles: roleObjects
            })
          });
          frappeUser = updateRes.data;
        } else {
          // Create new user in Frappe
          const createRes = await frappeFetch('/api/resource/User', {
            method: 'POST',
            body: JSON.stringify({
              doctype: 'User',
              email: cleanEmail,
              first_name: firstName,
              last_name: lastName,
              mobile_no: mobile_no || cleanEmail,
              phone: mobile_no || cleanEmail,
              enabled: 1,
              send_welcome_email: 0,
              user_type: 'System User',
              roles: roleObjects
            })
          });
          frappeUser = createRes.data;
        }

        // Set/reset password if password is provided
        if (password) {
          try {
            await frappeFetch('/api/method/frappe.core.doctype.user.user.reset_password', {
              method: 'POST',
              body: JSON.stringify({
                user: cleanEmail,
                new_password: password
              })
            });
          } catch (pwdErr) {
            console.warn("Password reset via Frappe method warning:", pwdErr.message);
          }
        }
      } catch (frappeErr) {
        console.error("Frappe User Sync Error:", frappeErr.message);
      }
    }

    const createdUserObj = {
      email: cleanEmail,
      full_name: full_name || cleanEmail,
      mobile_no: mobile_no || cleanEmail,
      roles: userRoles,
      permissions: permissions || [],
      department: department || '',
      designation: designation || userRoles[0],
      employee_id: employee_id || `STF-${Math.floor(100 + Math.random() * 900)}`,
      frappe_synced: !!frappeUser
    };

    return NextResponse.json({
      success: true,
      message: 'User credentials and roles saved successfully in backend',
      user: createdUserObj
    });

  } catch (error) {
    console.error('User management endpoint error:', error);
    return NextResponse.json({ error: 'Failed to manage user: ' + error.message }, { status: 500 });
  }
}
