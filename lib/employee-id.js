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
    const match = cleanStr.match(/\d+$/);
    if (match) {
      const parsed = parseInt(match[0], 10);
      return !isNaN(parsed) ? parsed : 0;
    }
    return 0;
  };

  // 1. Scan active users
  usersList.forEach(u => {
    const id = u.employeeId || u.employee_id || u.frappeStaffId || u.id;
    const seq = extractSeqNum(id);
    if (seq > maxSeq) maxSeq = seq;
  });

  // 2. Scan deleted list
  deletedList.forEach(item => {
    const id = typeof item === 'string' ? item : item?.employeeId;
    const seq = extractSeqNum(id);
    if (seq > maxSeq) maxSeq = seq;
  });

  // 3. Scan activity logs
  activitiesList.forEach(act => {
    const textStr = `${act.title || ''} ${act.desc || ''}`;
    const matches = textStr.match(/TH-?[A-Z]*[-]?\d+/gi);
    if (matches) {
      matches.forEach(m => {
        const seq = extractSeqNum(m);
        if (seq > maxSeq) maxSeq = seq;
      });
    }
  });

  const nextSeq = maxSeq + 1;
  const seqPadded = String(nextSeq).padStart(3, '0');
  return `${prefix}${seqPadded}`;
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
