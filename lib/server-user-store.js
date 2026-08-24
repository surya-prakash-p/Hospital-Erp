import fs from 'fs';
import path from 'path';

const CREDENTIALS_FILE = path.join(process.cwd(), 'staff_credentials.json');
const DELETED_FILE = path.join(process.cwd(), 'deleted_users.json');
const CLOUD_OBJECT_ID = "ff8081819ff5b11001a0329aadac0a21";

// Default initial accounts
const INITIAL_ACCOUNTS = [
  {
    email: 'suryapraks588@gmail.com',
    mobile_no: '8270173588',
    password: 'Admin@2026',
    full_name: 'Hospital Admin',
    roles: ['Hospital Admin'],
    permissions: ['*'],
    department: 'Hospital Administration',
    designation: 'Chief Administrator'
  },
  {
    email: 'manager@thangamhospital.com',
    mobile_no: '8073788034',
    password: '123456',
    full_name: 'Hospital Manager',
    roles: ['Hospital Admin'],
    permissions: ['*'],
    department: 'Hospital Administration',
    designation: 'General Manager'
  }
];

export async function readCloudStore() {
  try {
    const res = await fetch(`https://api.restful-api.dev/objects/${CLOUD_OBJECT_ID}`, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data.users)) {
        return json.data;
      }
    }
  } catch (e) {
    console.warn("Cloud store read warning:", e.message);
  }
  return { users: readServerUsers(), deleted: readDeletedUsers() };
}

export async function writeCloudStore(users, deleted) {
  try {
    saveServerUsersFile(users);
    saveDeletedUsersFile(deleted);

    const res = await fetch(`https://api.restful-api.dev/objects/${CLOUD_OBJECT_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "thangam_hospital_staff_registry_2026",
        data: { users, deleted }
      })
    });
    return res.ok;
  } catch (e) {
    console.warn("Cloud store write warning:", e.message);
    return false;
  }
}

export function readDeletedUsers() {
  try {
    if (fs.existsSync(DELETED_FILE)) {
      const content = fs.readFileSync(DELETED_FILE, 'utf8');
      const data = JSON.parse(content);
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.error('Error reading deleted_users.json:', err);
  }
  return [];
}

function saveDeletedUsersFile(deletedList) {
  try {
    fs.writeFileSync(DELETED_FILE, JSON.stringify(deletedList, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing deleted_users.json:', err);
  }
}

export function isUserDeleted(identifier, customDeletedList = null) {
  if (!identifier) return false;
  const deletedList = customDeletedList || readDeletedUsers();
  const inputStr = (identifier || '').trim().toLowerCase();
  const cleanDigits = inputStr.replace(/\D/g, '');
  const isDigits = cleanDigits.length >= 7;

  return deletedList.some(item => {
    const itemStr = (item || '').trim().toLowerCase();
    const itemDigits = itemStr.replace(/\D/g, '');

    const strMatch = Boolean(itemStr && inputStr && (itemStr === inputStr || itemStr.includes(inputStr) || inputStr.includes(itemStr)));
    const digitMatch = Boolean(isDigits && itemDigits.length >= 7 && (
      itemDigits === cleanDigits || itemDigits.endsWith(cleanDigits) || cleanDigits.endsWith(itemDigits)
    ));

    return strMatch || digitMatch;
  });
}

export function readServerUsers() {
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      const content = fs.readFileSync(CREDENTIALS_FILE, 'utf8');
      const data = JSON.parse(content);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.error('Error reading staff_credentials.json:', err);
  }
  saveServerUsersFile(INITIAL_ACCOUNTS);
  return INITIAL_ACCOUNTS;
}

function saveServerUsersFile(users) {
  try {
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing staff_credentials.json:', err);
  }
}

export function saveServerUser(userData) {
  if (!userData) return null;
  const cleanEmail = (userData.email || '').trim().toLowerCase();
  const cleanMobile = (userData.mobile_no || '').replace(/\D/g, '');

  if (isUserDeleted(cleanEmail) || isUserDeleted(cleanMobile)) {
    console.warn("Attempted to save deleted user, blocked:", cleanEmail || cleanMobile);
    return null;
  }

  const users = readServerUsers();

  const index = users.findIndex(u => {
    const uEmail = (u.email || '').trim().toLowerCase();
    const uMobile = (u.mobile_no || '').replace(/\D/g, '');

    const emailMatch = Boolean(cleanEmail && uEmail && uEmail === cleanEmail);
    const mobileMatch = Boolean(cleanMobile && cleanMobile.length >= 7 && uMobile && uMobile.length >= 7 && (
      uMobile === cleanMobile || uMobile.endsWith(cleanMobile) || cleanMobile.endsWith(uMobile)
    ));

    return emailMatch || mobileMatch;
  });

  const existingPwd = index !== -1 ? users[index].password : '';
  const newPwd = (userData.password || '').trim();

  const updatedUser = {
    email: userData.email || (index !== -1 ? users[index].email : ''),
    mobile_no: userData.mobile_no || (index !== -1 ? users[index].mobile_no : ''),
    password: newPwd || existingPwd,
    full_name: userData.full_name || (index !== -1 ? users[index].full_name : 'Staff Member'),
    roles: userData.roles || (index !== -1 ? users[index].roles : ['Staff Member']),
    permissions: userData.permissions || (index !== -1 ? users[index].permissions : []),
    department: userData.department || (index !== -1 ? users[index].department : ''),
    designation: userData.designation || (index !== -1 ? users[index].designation : 'Staff')
  };

  if (index !== -1) {
    users[index] = { ...users[index], ...updatedUser };
  } else {
    users.push(updatedUser);
  }

  const deletedList = readDeletedUsers();
  writeCloudStore(users, deletedList).catch(e => console.warn("Background cloud sync warning:", e));

  return updatedUser;
}

export function findServerUserByIdentifier(identifier, customUserList = null) {
  if (!identifier || isUserDeleted(identifier)) {
    return null;
  }

  const users = customUserList || readServerUsers();
  const inputStr = (identifier || '').trim();
  const cleanInputDigits = inputStr.replace(/\D/g, '');
  const isInputDigits = /^[0-9]+$/.test(cleanInputDigits) && cleanInputDigits.length >= 7;

  return users.find(u => {
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

export function findServerUser(identifier, password, customUserList = null) {
  const found = findServerUserByIdentifier(identifier, customUserList);
  if (!found) return null;

  // Strictly verify original password
  const storedPwd = (found.password || '').trim();
  const inputPwd = (password || '').trim();

  if (!inputPwd || !storedPwd || storedPwd !== inputPwd) {
    return null;
  }

  return found;
}

export function deleteServerUser(identifier) {
  let users = readServerUsers();
  const inputStr = (identifier || '').trim().toLowerCase();
  const cleanInputDigits = inputStr.replace(/\D/g, '');
  const isDigits = cleanInputDigits.length >= 7;

  let deletedList = readDeletedUsers();

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

  const filtered = users.filter(u => {
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

  writeCloudStore(filtered, deletedList).catch(e => console.warn("Background cloud sync warning:", e));

  return true;
}
