import fs from 'fs';
import path from 'path';

const CREDENTIALS_FILE = path.join(process.cwd(), 'staff_credentials.json');

// Default initial accounts
const INITIAL_ACCOUNTS = [
  {
    email: 'admin@thangamhospital.com',
    mobile_no: '9900000001',
    password: 'AdminPassword123!',
    full_name: 'Hospital Admin',
    roles: ['Hospital Admin'],
    permissions: ['*'],
    department: 'Hospital Administration',
    designation: 'Chief Administrator'
  },
  {
    email: 'doctor@thangamhospital.com',
    mobile_no: '9900000002',
    password: 'DoctorPassword123!',
    full_name: 'Dr. Rajesh Kumar',
    roles: ['Doctor'],
    permissions: ['Doctor Consultations', 'Write Prescriptions', 'Order Lab Tests', 'View Patient Records'],
    department: 'General Medicine',
    designation: 'Senior Consultant'
  },
  {
    email: 'pharmacy@thangamhospital.com',
    mobile_no: '9900000003',
    password: 'PharmaPassword123!',
    full_name: 'Rahul Sharma',
    roles: ['Pharmacist'],
    permissions: ['Pharmacy Dispensing', 'Inventory Access', 'View Prescriptions'],
    department: 'Pharmacy Block A',
    designation: 'Chief Pharmacist'
  },
  {
    email: 'reception@thangamhospital.com',
    mobile_no: '9900000004',
    password: 'ReceptPassword123!',
    full_name: 'Priya Sundaram',
    roles: ['Receptionist'],
    permissions: ['Patient Registration', 'Book Appointments', 'Front Desk'],
    department: 'Front Desk & Admissions',
    designation: 'Senior Receptionist'
  },
  {
    email: 'lab@thangamhospital.com',
    mobile_no: '9900000005',
    password: 'LabPassword123!',
    full_name: 'Rajan Tech',
    roles: ['Lab Technician'],
    permissions: ['Lab Diagnostic Reports', 'Process Specimens'],
    department: 'Diagnostics Lab',
    designation: 'Lead Lab Technician'
  },
  {
    email: 'naughtyprakash2003@gmail.com',
    mobile_no: '7010120616',
    password: 'Staff@2026',
    full_name: 'nirmala',
    roles: ['Nurse'],
    permissions: ['View Patient Records', 'IPD Ward Notes'],
    department: 'General',
    designation: 'Nurse'
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

  const index = users.findIndex(u => 
    (cleanEmail && u.email && u.email.trim().toLowerCase() === cleanEmail) ||
    (cleanMobile && u.mobile_no && u.mobile_no.replace(/\D/g, '') === cleanMobile)
  );

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

    const matchesEmail = userEmail === inputStr.toLowerCase();
    const matchesMobile = isInputDigits && userMobileDigits && (userMobileDigits === cleanInputDigits || userMobileDigits.endsWith(cleanInputDigits) || cleanInputDigits.endsWith(userMobileDigits));

    return matchesEmail || matchesMobile;
  });

  if (!found) return null;

  // Check password if provided
  if (password && found.password) {
    if (found.password !== password) {
      return null;
    }
  }

  return found;
}
