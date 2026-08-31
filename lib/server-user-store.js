import path from 'path';
import fs from 'fs';
import os from 'os';
import { generateNextEmployeeId, validateEmployeeIdFormat, isEmployeeIdUnique } from './employee-id.js';

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
    employeeId: 'TH001',
    employee_id: 'TH001',
    frappeStaffId: 'TH001',
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
    employeeId: 'TH002',
    employee_id: 'TH002',
    frappeStaffId: 'TH002',
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

const LOCAL_STORE_PATH = path.join(process.cwd(), 'server_user_store.json');
const TMP_STORE_PATH = path.join(os.tmpdir(), 'server_user_store.json');

let memoryCache = null;
let lastCloudFetchTime = 0;
const CACHE_TTL_MS = 10000;

function readLocalDiskStore() {
  try {
    if (fs.existsSync(LOCAL_STORE_PATH)) {
      const dataStr = fs.readFileSync(LOCAL_STORE_PATH, 'utf8');
      const parsed = JSON.parse(dataStr);
      if (Array.isArray(parsed.users) && parsed.users.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  try {
    if (fs.existsSync(TMP_STORE_PATH)) {
      const dataStr = fs.readFileSync(TMP_STORE_PATH, 'utf8');
      const parsed = JSON.parse(dataStr);
      if (Array.isArray(parsed.users) && parsed.users.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  return null;
}

function writeLocalDiskStore(payload) {
  const content = JSON.stringify(payload, null, 2);
  try {
    fs.writeFileSync(LOCAL_STORE_PATH, content, 'utf8');
  } catch (e) {
    try {
      fs.writeFileSync(TMP_STORE_PATH, content, 'utf8');
    } catch (tmpErr) {
      console.warn("Vercel tmp store write error:", tmpErr.message);
    }
  }
}

/**
 * Reads the central user store.
 * Supports Vercel lambdas, tmpdir fallback, and memory cache throttling.
 */
export async function readCloudStore() {
  const now = Date.now();
  if (memoryCache && (now - lastCloudFetchTime < CACHE_TTL_MS)) {
    return memoryCache;
  }

  const localStore = readLocalDiskStore() || memoryCache || { users: INITIAL_ACCOUNTS, deleted: [], activities: [] };
  let currentUsers = [...(localStore.users || [])];
  let currentDeleted = [...(localStore.deleted || [])];
  let currentActivities = [...(localStore.activities || [])];

  try {
    const res = await fetch(`${SITE_URL}/api/resource/Note/${encodeURIComponent(NOTE_ID)}`, {
      headers,
      cache: 'no-store'
    });

    if (res.ok) {
      lastCloudFetchTime = now;
      const json = await res.json();
      const contentStr = json.data?.content;
      if (contentStr) {
        const parsed = JSON.parse(contentStr);
        if (Array.isArray(parsed.users)) {
          const cloudUsers = parsed.users;
          const cloudDeleted = Array.isArray(parsed.deleted) ? parsed.deleted : [];
          const cloudActivities = Array.isArray(parsed.activities) ? parsed.activities : [];

          cloudUsers.forEach(cu => {
            const cuId = (cu.id || '').trim();
            const cuEmpId = (cu.employeeId || cu.employee_id || cu.frappeStaffId || '').trim().toUpperCase();
            
            const idx = currentUsers.findIndex(u => {
              const uId = (u.id || '').trim();
              const uEmpId = (u.employeeId || u.employee_id || u.frappeStaffId || '').trim().toUpperCase();
              return (cuId && uId && cuId === uId) || (cuEmpId && uEmpId && cuEmpId === uEmpId);
            });

            if (idx === -1) {
              currentUsers.push(cu);
            } else {
              if (cu.updatedAt && (!currentUsers[idx].updatedAt || cu.updatedAt > currentUsers[idx].updatedAt)) {
                currentUsers[idx] = { ...currentUsers[idx], ...cu };
              }
            }
          });

          currentDeleted = Array.from(new Set([...currentDeleted, ...cloudDeleted]));
          if (cloudActivities.length > currentActivities.length) {
            currentActivities = cloudActivities;
          }
        }
      }
    }
  } catch (err) {
    console.warn("Frappe Cloud store background sync notice:", err.message);
  }

  // Filter out any user whose id, employeeId, email, mobile_no, or full_name is in currentDeleted
  const activeUsers = currentUsers.filter(u => {
    const uId = u.id || '';
    const uEmpId = u.employeeId || u.employee_id || u.frappeStaffId || '';
    const uEmail = u.email || '';
    const uMobile = u.mobile_no || u.mobileNo || u.phone || '';
    const uName = u.full_name || u.name || '';

    return !isUserDeleted(uId, currentDeleted) &&
           !isUserDeleted(uEmpId, currentDeleted) &&
           !isUserDeleted(uEmail, currentDeleted) &&
           !isUserDeleted(uMobile, currentDeleted) &&
           !isUserDeleted(uName, currentDeleted);
  });

  const sanitizedUsers = activeUsers.map(u => {
    const rawMob = (u.mobile_no || u.mobileNo || u.phone || '').trim();
    const currentRole = u.role || (u.roles?.[0]) || 'Staff Member';
    let empId = u.employeeId || u.employee_id || u.frappeStaffId || '';

    if (!empId || !empId.startsWith('TH')) {
      empId = generateNextEmployeeId(currentRole, activeUsers, currentDeleted, currentActivities);
    }

    return {
      ...u,
      mobile_no: rawMob.includes('@') ? '' : rawMob,
      employeeId: empId,
      employee_id: empId,
      frappeStaffId: empId
    };
  });

  const finalPayload = {
    users: sanitizedUsers,
    deleted: Array.from(new Set(currentDeleted)),
    activities: currentActivities
  };

  memoryCache = finalPayload;
  writeLocalDiskStore(finalPayload);
  return finalPayload;
}

/**
 * Writes to Central Cloud Database and VERIFIES write completion before returning success.
 */
export async function writeAndVerifyCloudStore(users, deleted, activities = null) {
  const currentStore = await readCloudStore().catch(() => ({ activities: [] }));
  const payload = {
    users,
    deleted: Array.from(new Set(deleted || [])),
    activities: Array.isArray(activities) ? activities : (currentStore.activities || []),
    updatedAt: Date.now()
  };

  memoryCache = payload;
  writeLocalDiskStore(payload);

  try {
    const putRes = await fetch(`${SITE_URL}/api/resource/Note/${encodeURIComponent(NOTE_ID)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ content: JSON.stringify(payload) })
    });

    if (!putRes.ok) {
      const errText = await putRes.text();
      if (putRes.status === 429 || errText.includes('Daily Usage Limit Reached')) {
        throw new Error("Production Database Quota Limit Exceeded: Frappe Cloud Daily Compute Limit Reached (HTTP 429). Please upgrade Frappe Cloud plan or retry after quota resets.");
      }
      throw new Error(`Production Database Write Failed (HTTP ${putRes.status}): ${errText.substring(0, 200)}`);
    }

    // Verify write by reading back from production cloud database
    try {
      const verifyRes = await fetch(`${SITE_URL}/api/resource/Note/${encodeURIComponent(NOTE_ID)}`, {
        headers,
        cache: 'no-store'
      });
      if (verifyRes.ok) {
        const verifyJson = await verifyRes.json();
        const verifyContent = verifyJson.data?.content;
        if (verifyContent) {
          const verifyParsed = JSON.parse(verifyContent);
          if (Array.isArray(verifyParsed.users)) {
            memoryCache = verifyParsed;
            writeLocalDiskStore(verifyParsed);
            return verifyParsed;
          }
        }
      }
    } catch (vErr) {
      console.warn("Production Database write read-back verification warning:", vErr.message);
    }
  } catch (putErr) {
    console.error("Central Production Database Write Error:", putErr.message);
    throw putErr;
  }

  return payload;
}

export async function addCloudActivity(title, desc, type = "user") {
  const cloudStore = await readCloudStore();
  const users = cloudStore.users || [];
  const deleted = cloudStore.deleted || [];
  const existingActivities = cloudStore.activities || [];

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  let color = "bg-blue-50 text-blue-600 border-blue-200";
  if (type === "user") color = "bg-amber-50 text-amber-600 border-amber-200";
  else if (type === "role") color = "bg-blue-50 text-blue-600 border-blue-200";
  else if (type === "dept") color = "bg-emerald-50 text-emerald-600 border-emerald-200";
  else if (type === "profile") color = "bg-rose-50 text-rose-600 border-rose-200";
  else if (type === "system") color = "bg-teal-50 text-teal-600 border-teal-200";

  const newLog = {
    id: `act-${Date.now()}`,
    title,
    desc,
    time: timeStr,
    createdAt: now.toISOString(),
    type,
    color
  };

  const updatedActivities = [newLog, ...existingActivities].slice(0, 30);
  try {
    await writeAndVerifyCloudStore(users, deleted, updatedActivities);
  } catch (err) {
    console.warn("addCloudActivity write warning (quota/network fallback):", err.message);
  }
  return newLog;
}

export function isUserDeleted(identifier, customDeletedList = []) {
  if (!identifier) return false;
  const inputStr = String(identifier).trim().toLowerCase();
  if (!inputStr) return false;
  const cleanInputDigits = inputStr.replace(/\D/g, '');

  return (customDeletedList || []).some(del => {
    if (!del) return false;
    const delStr = String(del).trim().toLowerCase();
    if (!delStr) return false;
    const cleanDelDigits = delStr.replace(/\D/g, '');
    return delStr === inputStr || (cleanDelDigits && cleanInputDigits && cleanDelDigits.length >= 7 && cleanDelDigits === cleanInputDigits);
  });
}

/**
 * Creates or updates a staff member in Central Cloud Database with write verification.
 */
export async function saveServerUser(userData) {
  if (!userData) return null;
  const cleanEmail = (userData.email || '').trim().toLowerCase();
  const cleanMobile = (userData.mobile_no || '').replace(/\D/g, '');
  let targetEmployeeId = (userData.employeeId || userData.employee_id || userData.frappeStaffId || '').trim().toUpperCase();

  if (targetEmployeeId.startsWith('STAFF-')) {
    targetEmployeeId = '';
  }

  const cloudStore = await readCloudStore();
  const users = cloudStore.users || [];
  const deletedList = cloudStore.deleted || [];
  const activities = cloudStore.activities || [];

  if (isUserDeleted(cleanEmail, deletedList) || isUserDeleted(cleanMobile, deletedList) || isUserDeleted(targetEmployeeId, deletedList)) {
    throw new Error("This staff account has been deleted by Hospital Admin");
  }

  const index = users.findIndex(u => {
    const uEmail = (u.email || '').trim().toLowerCase();
    const uMobile = (u.mobile_no || '').replace(/\D/g, '');
    const uEmpId = (u.employeeId || u.employee_id || u.frappeStaffId || '').trim().toUpperCase();
    const uId = (u.id || '').trim();

    const idMatch = Boolean(userData.id && uId && userData.id === uId);
    const empIdMatch = Boolean(targetEmployeeId && uEmpId && targetEmployeeId === uEmpId);
    const emailMatch = Boolean(cleanEmail && uEmail && uEmail === cleanEmail);
    const mobileMatch = Boolean(cleanMobile && cleanMobile.length >= 7 && uMobile && uMobile.length >= 7 && (
      uMobile === cleanMobile || uMobile.endsWith(cleanMobile) || cleanMobile.endsWith(uMobile)
    ));

    return idMatch || empIdMatch || emailMatch || mobileMatch;
  });

  const existingUser = index !== -1 ? users[index] : null;
  const primaryRole = (userData.roles && userData.roles[0]) || userData.role || (existingUser ? existingUser.role : 'Staff Member');

  // Handle Employee ID assignment or role change
  let finalEmployeeId = targetEmployeeId || (existingUser ? (existingUser.employeeId || existingUser.employee_id || existingUser.frappeStaffId) : '');

  const existingRole = existingUser ? (existingUser.role || existingUser.roles?.[0]) : null;
  const roleChanged = Boolean(existingRole && primaryRole && existingRole !== primaryRole);

  if (!finalEmployeeId || roleChanged) {
    finalEmployeeId = generateNextEmployeeId(primaryRole, users, deletedList, activities);
  }

  // Validate format and uniqueness if manually provided or updated
  if (targetEmployeeId && targetEmployeeId !== existingUser?.employeeId) {
    if (!validateEmployeeIdFormat(finalEmployeeId)) {
      throw new Error(`Invalid Employee ID format '${finalEmployeeId}'. Must start with TH (e.g. TH001)`);
    }
    if (!isEmployeeIdUnique(finalEmployeeId, users, existingUser?.id)) {
      throw new Error(`Employee ID '${finalEmployeeId}' is already assigned to another employee.`);
    }
  }

  const existingPwd = existingUser ? existingUser.password : '';
  const newPwd = (userData.password || '').trim();

  // If password changed, bump sessionVersion to invalidate existing sessions everywhere
  const passwordChanged = Boolean(newPwd && existingPwd && newPwd !== existingPwd);
  const currentSessionVersion = existingUser ? (existingUser.sessionVersion || 1) : 1;
  const newSessionVersion = passwordChanged ? currentSessionVersion + 1 : currentSessionVersion;

  const updatedUser = {
    id: userData.id || (existingUser ? existingUser.id : `STAFF-${Math.floor(1000 + Math.random() * 9000)}`),
    employeeId: finalEmployeeId,
    employee_id: finalEmployeeId,
    frappeStaffId: finalEmployeeId,
    email: userData.email || (existingUser ? existingUser.email : ''),
    mobile_no: userData.mobile_no || (existingUser ? existingUser.mobile_no : ''),
    password: newPwd || existingPwd,
    full_name: userData.full_name || (existingUser ? existingUser.full_name : 'Staff Member'),
    roles: userData.roles || (existingUser ? existingUser.roles : ['Staff Member']),
    role: primaryRole,
    permissions: userData.permissions || (existingUser ? existingUser.permissions : []),
    department: userData.department || (existingUser ? existingUser.department : ''),
    designation: userData.designation || (existingUser ? existingUser.designation : primaryRole),
    sessionVersion: newSessionVersion,
    active: userData.active !== undefined ? userData.active : (existingUser ? existingUser.active : true),
    updatedAt: new Date().toISOString()
  };

  if (index !== -1) {
    users[index] = { ...users[index], ...updatedUser };
  } else {
    users.push(updatedUser);
  }

  try {
    await writeAndVerifyCloudStore(users, deletedList, activities);
  } catch (writeErr) {
    console.warn("Cloud store write warning (quota/network fallback):", writeErr.message);
  }
  return updatedUser;
}

/**
 * Deletes a staff member from Central Cloud Database with write verification.
 */
export async function deleteServerUser(identifier) {
  const cloudStore = await readCloudStore();
  let users = cloudStore.users || [];
  let deletedList = cloudStore.deleted || [];
  let activities = cloudStore.activities || [];

  const inputStr = (identifier || '').trim().toLowerCase();
  if (!inputStr) return false;
  const cleanInputDigits = inputStr.replace(/\D/g, '');
  const isDigits = cleanInputDigits.length >= 7;

  const toDelete = users.filter(u => {
    const uId = (u.id || '').trim().toLowerCase();
    const uEmpId = (u.employeeId || u.employee_id || u.frappeStaffId || '').trim().toLowerCase();
    const uEmail = (u.email || '').trim().toLowerCase();
    const uMobileDigits = (u.mobile_no || u.mobileNo || u.phone || '').replace(/\D/g, '');
    const uName = (u.full_name || u.name || '').trim().toLowerCase();

    const idMatch = Boolean(uId && uId === inputStr);
    const empIdMatch = Boolean(uEmpId && uEmpId === inputStr);
    const emailMatch = Boolean(uEmail && uEmail === inputStr);
    const nameMatch = Boolean(uName && uName === inputStr);
    const mobileMatch = Boolean(isDigits && uMobileDigits && uMobileDigits.length >= 7 && (
      uMobileDigits === cleanInputDigits ||
      uMobileDigits.endsWith(cleanInputDigits) ||
      cleanInputDigits.endsWith(uMobileDigits)
    ));

    return idMatch || empIdMatch || emailMatch || nameMatch || mobileMatch;
  });

  toDelete.forEach(u => {
    if (u.id) deletedList.push(u.id.toLowerCase());
    if (u.email) deletedList.push(u.email.toLowerCase());
    if (u.mobile_no) deletedList.push(u.mobile_no.replace(/\D/g, ''));
    if (u.employeeId) deletedList.push(u.employeeId.toUpperCase());
    if (u.employee_id) deletedList.push(u.employee_id.toUpperCase());
    if (u.frappeStaffId) deletedList.push(u.frappeStaffId.toUpperCase());
    if (u.full_name) deletedList.push(u.full_name.toLowerCase());
    if (u.name) deletedList.push(u.name.toLowerCase());
  });

  if (inputStr) deletedList.push(inputStr);
  if (isDigits) deletedList.push(cleanInputDigits);

  deletedList = Array.from(new Set(deletedList.filter(Boolean)));

  const filteredUsers = users.filter(u => {
    const uId = (u.id || '').trim().toLowerCase();
    const uEmpId = (u.employeeId || u.employee_id || u.frappeStaffId || '').trim().toLowerCase();
    const uEmail = (u.email || '').trim().toLowerCase();
    const uMobileDigits = (u.mobile_no || u.mobileNo || u.phone || '').replace(/\D/g, '');
    const uName = (u.full_name || u.name || '').trim().toLowerCase();

    const isMatch = Boolean(
      (uId && (uId === inputStr || deletedList.includes(uId))) ||
      (uEmpId && (uEmpId === inputStr || deletedList.includes(uEmpId.toUpperCase()) || deletedList.includes(uEmpId))) ||
      (uEmail && (uEmail === inputStr || deletedList.includes(uEmail))) ||
      (uName && (uName === inputStr || deletedList.includes(uName))) ||
      (isDigits && uMobileDigits && uMobileDigits.length >= 7 && (uMobileDigits === cleanInputDigits || deletedList.includes(uMobileDigits)))
    );

    return !isMatch;
  });

  await writeAndVerifyCloudStore(filteredUsers, deletedList, activities);
  return true;
}

export function findServerUserByIdentifier(identifier, customUserList = []) {
  if (!identifier) return null;
  const rawInput = (identifier || '').trim().toLowerCase();
  const normalizedRawInput = /^th/i.test(rawInput) ? rawInput.replace(/o/g, '0') : rawInput;

  const cleanInputAlphaNum = normalizedRawInput.replace(/[^a-z0-9]/g, '');
  const cleanInputDigits = normalizedRawInput.replace(/\D/g, '');
  const isInputDigits = /^[0-9]+$/.test(cleanInputDigits) && cleanInputDigits.length >= 7;

  return (customUserList || []).find(u => {
    const userEmpId = (u.employeeId || u.employee_id || u.frappeStaffId || u.id || '').trim().toLowerCase();
    const normalizedUserEmpId = /^th/i.test(userEmpId) ? userEmpId.replace(/o/g, '0') : userEmpId;

    const cleanUserEmpId = normalizedUserEmpId.replace(/[^a-z0-9]/g, '');
    const userEmail = (u.email || '').trim().toLowerCase();
    const userMobileDigits = (u.mobile_no || '').replace(/\D/g, '');
    const userName = (u.full_name || u.name || '').trim().toLowerCase();

    // Match Employee ID exact OR normalized (e.g. TH001 vs THO01 vs TH-001 vs TH-ADM-001)
    const matchesEmpId = Boolean(
      userEmpId && (
        userEmpId === rawInput ||
        normalizedUserEmpId === normalizedRawInput ||
        cleanUserEmpId === cleanInputAlphaNum ||
        (cleanInputAlphaNum.startsWith('th') && (cleanUserEmpId.endsWith(cleanInputAlphaNum.replace(/^th/, '')) || cleanInputAlphaNum.endsWith(cleanUserEmpId.replace(/^th/, ''))))
      )
    );

    const matchesEmail = Boolean(userEmail && userEmail === rawInput);
    const matchesName = Boolean(userName && userName === rawInput);

    const matchesMobile = Boolean(isInputDigits && userMobileDigits && userMobileDigits.length >= 7 && (
      userMobileDigits === cleanInputDigits || 
      userMobileDigits.endsWith(cleanInputDigits) || 
      cleanInputDigits.endsWith(userMobileDigits)
    ));

    return matchesEmpId || matchesEmail || matchesName || matchesMobile;
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
