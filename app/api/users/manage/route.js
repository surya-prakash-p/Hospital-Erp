import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '@/lib/auth-guard';
import { saveServerUser, deleteServerUser, readCloudStore, addCloudActivity } from '@/lib/server-user-store';

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

export const dynamic = 'force-dynamic';

// GET: List all staff users & activities with sanitized responses (No passwords or hashes returned)
export async function GET(req) {
  try {
    const cloudData = await readCloudStore();
    const sanitizedUsers = (cloudData.users || []).map(u => {
      const { password, ...safeUser } = u;
      return {
        ...safeUser,
        role: safeUser.role || (safeUser.roles?.[0]) || 'Staff Member'
      };
    });

    return NextResponse.json({
      success: true,
      users: sanitizedUsers,
      activities: cloudData.activities || []
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Remove/Deactivate User in Better Auth & Frappe
export async function DELETE(req) {
  try {
    const authResult = await requireAuth(req, ['Hospital Admin', 'System Manager']);
    if (authResult.errorResponse) return authResult.errorResponse;

    const { searchParams } = new URL(req.url);
    const identifier = searchParams.get('identifier') || searchParams.get('email') || searchParams.get('mobile_no');

    if (!identifier) {
      return NextResponse.json({ error: 'Identifier (email or mobile) is required for deletion' }, { status: 400 });
    }

    const cleanIdentifier = identifier.trim();

    await deleteServerUser(cleanIdentifier);
    await addCloudActivity("Staff Member Deleted", `Identifier: ${cleanIdentifier}`, "user");

    if (apiKey && apiSecret) {
      try {
        await frappeFetch(`/api/resource/User/${encodeURIComponent(cleanIdentifier)}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.warn("Frappe user deletion warning:", err.message);
      }
    }

    return NextResponse.json({ success: true, message: `Staff user ${cleanIdentifier} deleted successfully` });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Create or Update Staff User with Better Auth & Frappe linking
export async function POST(req) {
  try {
    const authResult = await requireAuth(req, ['Hospital Admin', 'System Manager']);
    if (authResult.errorResponse) return authResult.errorResponse;

    const currentUser = authResult.user;
    const adminEmployeeId = currentUser?.employeeId || currentUser?.employee_id || currentUser?.id || 'TH-ADM-001';

    const body = await req.json();
    const { id, email, password, full_name, mobile_no, roles, permissions, department, designation, employee_id, employeeId } = body;

    const requestedEmpId = (employeeId || employee_id || '').trim().toUpperCase();

    if (!full_name && !email && !requestedEmpId && !id) {
      return NextResponse.json({ error: 'Full Name is required to create a staff member' }, { status: 400 });
    }

    const cloudStore = await readCloudStore();
    const serverUsers = cloudStore.users || [];
    const cleanEmail = (email || '').trim().toLowerCase();
    
    // Find existing user if updating
    const existingUser = serverUsers.find(u => {
      const uId = (u.id || '').trim();
      const uEmpId = (u.employeeId || u.employee_id || u.frappeStaffId || '').trim().toUpperCase();
      const uEmail = (u.email || '').trim().toLowerCase();
      return (id && uId === id) || (requestedEmpId && uEmpId === requestedEmpId) || (cleanEmail && uEmail === cleanEmail);
    });

    const oldEmpId = existingUser ? (existingUser.employeeId || existingUser.employee_id || existingUser.frappeStaffId) : null;
    const isEmpIdChanging = Boolean(oldEmpId && requestedEmpId && oldEmpId !== requestedEmpId);

    const nameParts = (full_name || existingUser?.full_name || cleanEmail).split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';
    const userRoles = Array.isArray(roles) && roles.length > 0 ? roles : (existingUser?.roles || ['Staff Member']);
    const primaryRole = userRoles[0];

    const savedUser = await saveServerUser({
      id: id || existingUser?.id,
      email: cleanEmail || existingUser?.email,
      password: password,
      full_name: full_name || existingUser?.full_name || cleanEmail,
      name: full_name || existingUser?.full_name || cleanEmail,
      mobile_no: mobile_no !== undefined ? mobile_no : existingUser?.mobile_no,
      role: primaryRole,
      roles: userRoles,
      permissions: permissions || existingUser?.permissions || [],
      department: department || existingUser?.department || '',
      designation: designation || existingUser?.designation || primaryRole,
      employeeId: requestedEmpId || oldEmpId,
      employee_id: requestedEmpId || oldEmpId,
      frappeStaffId: requestedEmpId || oldEmpId,
      active: true
    });

    if (isEmpIdChanging) {
      await addCloudActivity(
        "Employee ID Changed",
        `Old: ${oldEmpId} | New: ${savedUser.employeeId} | Changed By: ${adminEmployeeId}`,
        "user"
      );
    } else if (!existingUser) {
      await addCloudActivity(
        "New staff user created",
        `${savedUser.full_name} (${savedUser.employeeId} - ${primaryRole})`,
        "user"
      );
    } else if (password) {
      await addCloudActivity(
        "Staff Password Reset",
        `Password reset for ${savedUser.full_name} (${savedUser.employeeId}) by Admin`,
        "user"
      );
    } else {
      await addCloudActivity(
        "Staff Profile Updated",
        `${savedUser.full_name} (${savedUser.employeeId})`,
        "profile"
      );
    }

    let frappeUser = null;
    if (apiKey && apiSecret) {
      try {
        let existingUser = null;
        try {
          const checkRes = await frappeFetch(`/api/resource/User/${encodeURIComponent(cleanEmail)}`);
          existingUser = checkRes.data;
        } catch (e) {
          existingUser = null;
        }

        const roleObjects = userRoles.map(r => ({ role: r }));

        if (existingUser) {
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
            console.warn("Frappe password reset warning:", pwdErr.message);
          }
        }
      } catch (frappeErr) {
        console.error("Frappe User Sync Error:", frappeErr.message);
      }
    }

    const { password: _, ...sanitizedUser } = savedUser || {};
    return NextResponse.json({
      success: true,
      message: `Staff user ${cleanEmail} saved successfully in Better Auth & Frappe`,
      user: {
        ...sanitizedUser,
        email: cleanEmail,
        full_name: full_name || cleanEmail,
        roles: userRoles,
        role: primaryRole,
        frappe_user: frappeUser ? frappeUser.name : null
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
