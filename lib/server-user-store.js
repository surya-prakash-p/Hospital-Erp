import path from 'path';
import fs from 'fs';

let frappeConfig = null;
try {
  const configPath = path.join(process.cwd(), 'frappe_config.json');
  if (fs.existsSync(configPath)) {
    frappeConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (err) {}

const SITE_URL = process.env.FRAPPE_SITE_URL || frappeConfig?.site_url || 'https://thangamhospital.m.frappe.cloud';
const API_KEY = process.env.FRAPPE_API_KEY || frappeConfig?.api_key || '802a7dc89ec8034';
const API_SECRET = process.env.FRAPPE_API_SECRET || frappeConfig?.api_secret || 'edd331225cf6ca1';
const NOTE_ID = "brmj9ldim4";

const headers = {
  'Authorization': `token ${API_KEY}:${API_SECRET}`,
  'Content-Type': 'application/json'
};

// Default initial accounts for seeding if empty
const INITIAL_ACCOUNTS = [
  {
    id: 'STAFF-ADMIN-1',
    email: 'suryapraks588@gmail.com',
    mobile_no: '8270173588',
    password: 'Admin@2026',
    full_name: 'Hospital Admin',
    roles: ['Hospital Admin'],
    permissions: ['*'],
    department: 'Hospital Administration',
    designation: 'Chief Administrator',
    sessionVersion: 1,
    createdAt: new Date().toISOString()
  },
  {
    id: 'STAFF-MGR-1',
    email: 'manager@thangamhospital.com',
    mobile_no: '8073788034',
    password: '123456',
    full_name: 'Hospital Manager',
    roles: ['Hospital Admin'],
    permissions: ['*'],
    department: 'Hospital Administration',
    designation: 'General Manager',
    sessionVersion: 1,
    createdAt: new Date().toISOString()
  }
];

/**
 * Reads the central cloud store from Frappe Cloud (Note: brmj9ldim4)
 */
export async function readCloudStore() {
  try {
    const res = await fetch(`${SITE_URL}/api/resource/Note/${encodeURIComponent(NOTE_ID)}`, {
      headers,
      cache: 'no-store'
    });

    if (res.ok) {
      const json = await res.json();
      const contentStr = json.data?.content;
      if (contentStr) {
        const parsed = JSON.parse(contentStr);
        if (Array.isArray(parsed.users)) {
          return {
            users: parsed.users,
            deleted: Array.isArray(parsed.deleted) ? parsed.deleted : []
          };
        }
      }
    }
  } catch (err) {
    console.error("Frappe Cloud Store Read Warning:", err.message);
  }

  // Seed default accounts if cloud store read returns empty
  return { users: INITIAL_ACCOUNTS, deleted: [] };
}

/**
 * Writes to Central Cloud Database and VERIFIES write completion before returning success.
 */
export async function writeAndVerifyCloudStore(users, deleted) {
  const payload = {
    users,
    deleted: Array.from(new Set(deleted || [])),
    updatedAt: Date.now()
  };

  const putRes = await fetch(`${SITE_URL}/api/resource/Note/${encodeURIComponent(NOTE_ID)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ content: JSON.stringify(payload) })
  });

  if (!putRes.ok) {
    const errText = await putRes.text();
    throw new Error(`Central Cloud Database Write Failed (${putRes.status}): ${errText}`);
  }

  // Verification Step: Read back immediately to ensure DB state has updated
  const verifyRes = await fetch(`${SITE_URL}/api/resource/Note/${encodeURIComponent(NOTE_ID)}`, {
    headers,
    cache: 'no-store'
  });

  if (!verifyRes.ok) {
    throw new Error("Central Cloud Database Verification Read Failed");
  }

  const verifyJson = await verifyRes.json();
  const verifyContent = verifyJson.data?.content ? JSON.parse(verifyJson.data.content) : null;

  if (!verifyContent || !Array.isArray(verifyContent.users) || verifyContent.users.length !== users.length) {
    throw new Error(`Database Verification Mismatch: Expected ${users.length} users, found ${verifyContent?.users?.length}`);
  }

  return verifyContent;
}

export function isUserDeleted(identifier, customDeletedList = []) {
  if (!identifier) return false;
  const inputStr = (identifier || '').trim().toLowerCase();
  const cleanDigits = inputStr.replace(/\D/g, '');
  const isDigits = cleanDigits.length >= 7;

  return (customDeletedList || []).some(item => {
    const itemStr = (item || '').trim().toLowerCase();
    const itemDigits = itemStr.replace(/\D/g, '');

    const strMatch = Boolean(itemStr && inputStr && (itemStr === inputStr || itemStr.includes(inputStr) || inputStr.includes(itemStr)));
    const digitMatch = Boolean(isDigits && itemDigits.length >= 7 && (
      itemDigits === cleanDigits || itemDigits.endsWith(cleanDigits) || cleanDigits.endsWith(itemDigits)
    ));

    return strMatch || digitMatch;
  });
}

/**
 * Creates or updates a staff user in Central Cloud Database with write verification.
 */
export async function saveServerUser(userData) {
  if (!userData) return null;
  const cleanEmail = (userData.email || '').trim().toLowerCase();
  const cleanMobile = (userData.mobile_no || '').replace(/\D/g, '');

  const cloudStore = await readCloudStore();
  const users = cloudStore.users || [];
  const deletedList = cloudStore.deleted || [];

  if (isUserDeleted(cleanEmail, deletedList) || isUserDeleted(cleanMobile, deletedList)) {
    throw new Error("This staff account has been deleted by Hospital Admin");
  }

  const index = users.findIndex(u => {
    const uEmail = (u.email || '').trim().toLowerCase();
    const uMobile = (u.mobile_no || '').replace(/\D/g, '');

    const emailMatch = Boolean(cleanEmail && uEmail && uEmail === cleanEmail);
    const mobileMatch = Boolean(cleanMobile && cleanMobile.length >= 7 && uMobile && uMobile.length >= 7 && (
      uMobile === cleanMobile || uMobile.endsWith(cleanMobile) || cleanMobile.endsWith(uMobile)
    ));

    return emailMatch || mobileMatch;
  });

  const existingUser = index !== -1 ? users[index] : null;
  const existingPwd = existingUser ? existingUser.password : '';
  const newPwd = (userData.password || '').trim();

  // If password changed, bump sessionVersion to invalidate existing sessions everywhere
  const passwordChanged = Boolean(newPwd && existingPwd && newPwd !== existingPwd);
  const currentSessionVersion = existingUser ? (existingUser.sessionVersion || 1) : 1;
  const newSessionVersion = passwordChanged ? currentSessionVersion + 1 : currentSessionVersion;

  const updatedUser = {
    id: userData.id || (existingUser ? existingUser.id : `STAFF-${Math.floor(1000 + Math.random() * 9000)}`),
    email: userData.email || (existingUser ? existingUser.email : ''),
    mobile_no: userData.mobile_no || (existingUser ? existingUser.mobile_no : ''),
    password: newPwd || existingPwd,
    full_name: userData.full_name || (existingUser ? existingUser.full_name : 'Staff Member'),
    roles: userData.roles || (existingUser ? existingUser.roles : ['Staff Member']),
    permissions: userData.permissions || (existingUser ? existingUser.permissions : []),
    department: userData.department || (existingUser ? existingUser.department : ''),
    designation: userData.designation || (existingUser ? existingUser.designation : 'Staff Member'),
    sessionVersion: newSessionVersion,
    updatedAt: new Date().toISOString()
  };

  if (index !== -1) {
    users[index] = { ...users[index], ...updatedUser };
  } else {
    users.push(updatedUser);
  }

  await writeAndVerifyCloudStore(users, deletedList);
  return updatedUser;
}

/**
 * Deletes a staff member from Central Cloud Database with write verification.
 */
export async function deleteServerUser(identifier) {
  const cloudStore = await readCloudStore();
  let users = cloudStore.users || [];
  let deletedList = cloudStore.deleted || [];

  const inputStr = (identifier || '').trim().toLowerCase();
  const cleanInputDigits = inputStr.replace(/\D/g, '');
  const isDigits = cleanInputDigits.length >= 7;

  const toDelete = users.filter(u => {
    const userEmail = (u.email || '').trim().toLowerCase();
    const userMobileDigits = (u.mobile_no || '').replace(/\D/g, '');

    const emailMatch = Boolean(userEmail && inputStr && userEmail === inputStr);
    const mobileMatch = Boolean(isDigits && userMobileDigits && userMobileDigits.length >= 7 && (
      userMobileDigits === cleanInputDigits ||
      userMobileDigits.endsWith(cleanInputDigits) ||
      cleanInputDigits.endsWith(userMobileDigits)
    ));

    return emailMatch || mobileMatch;
  });

  toDelete.forEach(u => {
    if (u.email) deletedList.push(u.email.toLowerCase());
    if (u.mobile_no) deletedList.push(u.mobile_no.replace(/\D/g, ''));
  });

  if (inputStr) deletedList.push(inputStr);
  if (isDigits) deletedList.push(cleanInputDigits);

  deletedList = Array.from(new Set(deletedList));

  const filteredUsers = users.filter(u => {
    const userEmail = (u.email || '').trim().toLowerCase();
    const userMobileDigits = (u.mobile_no || '').replace(/\D/g, '');

    const emailMatch = Boolean(userEmail && inputStr && userEmail === inputStr);
    const mobileMatch = Boolean(isDigits && userMobileDigits && userMobileDigits.length >= 7 && (
      userMobileDigits === cleanInputDigits ||
      userMobileDigits.endsWith(cleanInputDigits) ||
      cleanInputDigits.endsWith(userMobileDigits)
    ));

    return !(emailMatch || mobileMatch);
  });

  await writeAndVerifyCloudStore(filteredUsers, deletedList);
  return true;
}

export function findServerUserByIdentifier(identifier, customUserList = []) {
  if (!identifier) return null;
  const inputStr = (identifier || '').trim();
  const cleanInputDigits = inputStr.replace(/\D/g, '');
  const isInputDigits = /^[0-9]+$/.test(cleanInputDigits) && cleanInputDigits.length >= 7;

  return (customUserList || []).find(u => {
    const userEmail = (u.email || '').trim().toLowerCase();
    const userMobileDigits = (u.mobile_no || '').replace(/\D/g, '');

    const matchesEmail = Boolean(userEmail && userEmail === inputStr.toLowerCase());
    const matchesMobile = Boolean(isInputDigits && userMobileDigits && userMobileDigits.length >= 7 && (
      userMobileDigits === cleanInputDigits || 
      userMobileDigits.endsWith(cleanInputDigits) || 
      cleanInputDigits.endsWith(userMobileDigits)
    ));

    return matchesEmail || matchesMobile;
  }) || null;
}

export function findServerUser(identifier, password, customUserList = []) {
  const found = findServerUserByIdentifier(identifier, customUserList);
  if (!found) return null;

  const storedPwd = (found.password || '').trim();
  const inputPwd = (password || '').trim();

  if (!inputPwd || !storedPwd || storedPwd !== inputPwd) {
    return null;
  }

  return found;
}
