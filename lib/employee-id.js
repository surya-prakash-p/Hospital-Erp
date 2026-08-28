/**
 * Employee ID Utility Module
 * Unified TH001 Format, Sequential ID Generation, Format & Uniqueness Validation
 */

export const EMPLOYEE_ID_PREFIXES = {
  "Hospital Admin": "TH",
  "System Manager": "TH",
  "Admin": "TH",
  "Doctor": "TH",
  "Pharmacist": "TH",
  "Nurse": "TH",
  "Receptionist": "TH",
  "Lab Technician": "TH",
  "Billing Clerk": "TH",
  "Staff Member": "TH"
};

/**
 * Gets the standard prefix for a given role name
 */
export function getPrefixForRole(role) {
  return "TH";
}

/**
 * Generates the next available sequential Employee ID in TH001 format.
 * Scans active users, deleted lists, and activity logs to ensure
 * deleted IDs are NEVER reused and sequence numbers increment safely.
 */
export function generateNextEmployeeId(role, usersList = [], deletedList = [], activitiesList = []) {
  const prefix = "TH";
  let maxSeq = 0;

  const extractSeqNum = (idStr) => {
    if (!idStr || typeof idStr !== 'string') return 0;
    const cleanStr = idStr.trim().toUpperCase();
    // Strictly match TH employee ID formats like TH001, TH-ADM-001, TH-PHA-002, TH123
    const match = cleanStr.match(/^TH-?[A-Z]*[-]?(\d+)$/);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      return (!isNaN(parsed) && parsed < 100000) ? parsed : 0;
    }
    return 0;
  };

  // 1. Scan active users
  usersList.forEach(u => {
    const id = u.employeeId || u.employee_id || u.frappeStaffId;
    const seq = extractSeqNum(id);
    if (seq > maxSeq) maxSeq = seq;
  });

  // 2. Scan deleted list (only valid TH Employee IDs, ignoring emails/phone numbers)
  deletedList.forEach(item => {
    const idStr = typeof item === 'string' ? item : (item?.employeeId || item?.employee_id);
    if (idStr && typeof idStr === 'string' && idStr.trim().toUpperCase().startsWith('TH')) {
      const seq = extractSeqNum(idStr);
      if (seq > maxSeq) maxSeq = seq;
    }
  });

  // 3. Scan activity logs
  activitiesList.forEach(act => {
    const textStr = `${act.title || ''} ${act.desc || ''}`;
    const matches = textStr.match(/TH-?[A-Z]*[-]?\d+/gi);
    if (matches) {
      matches.forEach(m => {
        const seq = extractSeqNum(m);
        if (seq > maxSeq && seq < 100000) maxSeq = seq;
      });
    }
  });

  let nextSeq = maxSeq + 1;
  let candidate = `${prefix}${String(nextSeq).padStart(3, '0')}`;

  // Ensure candidate is truly unique against active users
  while (!isEmployeeIdUnique(candidate, usersList)) {
    nextSeq++;
    candidate = `${prefix}${String(nextSeq).padStart(3, '0')}`;
  }

  return candidate;
}

/**
 * Validates whether an Employee ID adheres to TH001 or TH-XXX-001 format.
 */
export function validateEmployeeIdFormat(employeeId) {
  if (!employeeId || typeof employeeId !== 'string') return false;
  const regex = /^TH-?[A-Z]*[-]?\d{3,}$/i;
  return regex.test(employeeId.trim());
}

/**
 * Checks if an Employee ID is unique across the central user list.
 */
export function isEmployeeIdUnique(employeeId, usersList = [], excludeUserId = null) {
  if (!employeeId) return false;
  const targetId = employeeId.trim().toUpperCase();
  return !usersList.some(u => {
    if (excludeUserId && (u.id === excludeUserId || u.email === excludeUserId)) return false;
    const existingEmpId = (u.employeeId || u.employee_id || u.frappeStaffId || '').trim().toUpperCase();
    return existingEmpId === targetId;
  });
}
