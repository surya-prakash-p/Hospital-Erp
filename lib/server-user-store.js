import fs from 'fs';
import path from 'path';

const CREDENTIALS_FILE = path.join(process.cwd(), 'staff_credentials.json');

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
  const users = readServerUsers();
  const cleanEmail = (userData.email || '').trim().toLowerCase();
  const cleanMobile = (userData.mobile_no || '').replace(/\D/g, '');

  const index = users.findIndex(u => {
    const uEmail = (u.email || '').trim().toLowerCase();
    const uMobile = (u.mobile_no || '').replace(/\D/g, '');

    const emailMatch = Boolean(cleanEmail && uEmail && uEmail === cleanEmail);
    const mobileMatch = Boolean(cleanMobile && cleanMobile.length >= 7 && uMobile && uMobile.length >= 7 && (
      uMobile === cleanMobile || uMobile.endsWith(cleanMobile) || cleanMobile.endsWith(uMobile)
    ));

    return emailMatch || mobileMatch;
  });

  const updatedUser = {
    email: userData.email || (index !== -1 ? users[index].email : ''),
    mobile_no: userData.mobile_no || (index !== -1 ? users[index].mobile_no : ''),
    password: userData.password || (index !== -1 ? users[index].password : ''),
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

  saveServerUsersFile(users);
  return updatedUser;
}

export function findServerUser(identifier, password) {
  const users = readServerUsers();
  const inputStr = (identifier || '').trim();
  const cleanInputDigits = inputStr.replace(/\D/g, '');
  const isInputDigits = /^[0-9]+$/.test(cleanInputDigits) && cleanInputDigits.length >= 7;

  const found = users.find(u => {
    const userEmail = (u.email || '').trim().toLowerCase();
    const userMobileDigits = (u.mobile_no || '').replace(/\D/g, '');

    const matchesEmail = Boolean(userEmail && userEmail === inputStr.toLowerCase());
    const matchesMobile = Boolean(isInputDigits && userMobileDigits && userMobileDigits.length >= 7 && (
      userMobileDigits === cleanInputDigits || 
      userMobileDigits.endsWith(cleanInputDigits) || 
      cleanInputDigits.endsWith(userMobileDigits)
    ));

    return matchesEmail || matchesMobile;
  });

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

  saveServerUsersFile(filtered);
  return true;
}
