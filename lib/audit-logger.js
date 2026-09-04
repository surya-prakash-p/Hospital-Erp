import path from 'path';
import fs from 'fs';
import os from 'os';

const LOGS_FILE_PATH = path.join(os.tmpdir(), 'thangam_hospital_audit_logs.json');
const TMP_LOGS_PATH = path.join(os.tmpdir(), 'server_audit_logs.json');

// In-memory cache for fast lookups
let memoryLogsCache = null;
const MAX_LOGS_STORED = 2000;

// Initial seed activities so audit history starts populated and informative
const INITIAL_SEEDED_LOGS = [
  {
    id: "log-seed-1",
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    timeStr: "01:30 PM",
    dateStr: "02 Sep 2026",
    type: "user_mgmt",
    action: "Staff User Created",
    description: "Hospital Admin created staff member Dr. Testing (TH005 - Doctor)",
    actor: {
      employeeId: "TH001",
      name: "Hospital Admin",
      role: "Hospital Admin",
      email: "suryapraks588@gmail.com"
    },
    target: "Dr. Testing (TH005)",
    metadata: {
      roleAssigned: "Doctor",
      department: "General Medicine",
      ip: "127.0.0.1"
    }
  },
  {
    id: "log-seed-2",
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    timeStr: "01:17 PM",
    dateStr: "02 Sep 2026",
    type: "page_visit",
    action: "Page Navigation",
    description: "Dr. Testing opened Doctor Consultation Chamber (/consultation)",
    actor: {
      employeeId: "TH005",
      name: "Dr. Testing",
      role: "Doctor",
      email: "doctor@thangamhospital.com"
    },
    target: "/consultation",
    metadata: {
      pageTitle: "Doctor Consultation",
      path: "/consultation",
      device: "Desktop / Chrome"
    }
  },
  {
    id: "log-seed-3",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    timeStr: "12:57 PM",
    dateStr: "02 Sep 2026",
    type: "page_visit",
    action: "Page Navigation",
    description: "Demo Pharmacist opened Pharmacy Station (/pharmacy)",
    actor: {
      employeeId: "TH004",
      name: "Demo Pharmacist",
      role: "Pharmacist",
      email: "pharmacist@thangamhospital.com"
    },
    target: "/pharmacy",
    metadata: {
      pageTitle: "Pharmacy Station",
      path: "/pharmacy",
      device: "Desktop / Firefox"
    }
  },
  {
    id: "log-seed-4",
    timestamp: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
    timeStr: "12:37 PM",
    dateStr: "02 Sep 2026",
    type: "auth",
    action: "User Login",
    description: "Saranya (TH003) logged into Hospital ERP Portal",
    actor: {
      employeeId: "TH003",
      name: "Saranya",
      role: "Hospital Admin",
      email: "saranya@thangamhospital.com"
    },
    target: "System Login",
    metadata: {
      authMethod: "Employee ID & Password",
      ip: "127.0.0.1"
    }
  },
  {
    id: "log-seed-5",
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    timeStr: "12:12 PM",
    dateStr: "02 Sep 2026",
    type: "patient",
    action: "Patient Registered",
    description: "Vishnu registered new walk-in patient Ramesh Kumar (9876543210)",
    actor: {
      employeeId: "TH006",
      name: "Vishnu",
      role: "Receptionist",
      email: "reception@thangamhospital.com"
    },
    target: "Ramesh Kumar",
    metadata: {
      mobile: "9876543210",
      department: "OPD Front Desk"
    }
  },
  {
    id: "log-seed-6",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    timeStr: "11:42 AM",
    dateStr: "02 Sep 2026",
    type: "page_visit",
    action: "Page Navigation",
    description: "Hospital Admin opened Admin Dashboard (/admin-dashboard)",
    actor: {
      employeeId: "TH001",
      name: "Hospital Admin",
      role: "Hospital Admin",
      email: "suryapraks588@gmail.com"
    },
    target: "/admin-dashboard",
    metadata: {
      pageTitle: "Admin Dashboard",
      path: "/admin-dashboard"
    }
  },
  {
    id: "log-seed-7",
    timestamp: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
    timeStr: "11:12 AM",
    dateStr: "02 Sep 2026",
    type: "billing",
    action: "Invoice Generated",
    description: "Billing clerk processed payment for Invoice #INV-204 (₹1,250)",
    actor: {
      employeeId: "TH001",
      name: "Hospital Admin",
      role: "Hospital Admin",
      email: "suryapraks588@gmail.com"
    },
    target: "Invoice #INV-204",
    metadata: {
      amount: "1250",
      paymentMethod: "UPI",
      patient: "Priya S"
    }
  }
];

/**
 * Reads logs from disk with fallback to tmp and memory
 */
function readLogsFromDisk() {
  if (memoryLogsCache && Array.isArray(memoryLogsCache) && memoryLogsCache.length > 0) {
    return memoryLogsCache;
  }

  try {
    if (fs.existsSync(LOGS_FILE_PATH)) {
      const dataStr = fs.readFileSync(LOGS_FILE_PATH, 'utf8');
      const parsed = JSON.parse(dataStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryLogsCache = parsed;
        return parsed;
      }
    }
  } catch (e) {}

  try {
    if (fs.existsSync(TMP_LOGS_PATH)) {
      const dataStr = fs.readFileSync(TMP_LOGS_PATH, 'utf8');
      const parsed = JSON.parse(dataStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryLogsCache = parsed;
        return parsed;
      }
    }
  } catch (e) {}

  // Initialize with seed data if fresh
  memoryLogsCache = INITIAL_SEEDED_LOGS;
  writeLogsToDisk(INITIAL_SEEDED_LOGS);
  return INITIAL_SEEDED_LOGS;
}

/**
 * Writes logs safely to disk
 */
function writeLogsToDisk(logsArray) {
  memoryLogsCache = logsArray;
  const content = JSON.stringify(logsArray, null, 2);
  try {
    fs.writeFileSync(LOGS_FILE_PATH, content, 'utf8');
  } catch (e) {
    try {
      fs.writeFileSync(TMP_LOGS_PATH, content, 'utf8');
    } catch (tmpErr) {
      console.warn("Audit logs disk write warning:", tmpErr.message);
    }
  }
}

/**
 * Record a new audit log
 */
export async function recordAuditLog({
  type = "system", // "page_visit" | "user_mgmt" | "patient" | "clinical" | "billing" | "auth" | "system"
  action = "Action Performed",
  description = "",
  actor = null, // { employeeId, name, role, email, department }
  target = "",
  metadata = {}
}) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  const dateStr = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const actorObj = {
    employeeId: actor?.employeeId || actor?.employee_id || actor?.frappeStaffId || "SYSTEM",
    name: actor?.name || actor?.full_name || actor?.email || "System User",
    role: actor?.role || (actor?.roles?.[0]) || "Staff Member",
    email: actor?.email || "",
    department: actor?.department || ""
  };

  const newLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: now.toISOString(),
    timeStr,
    dateStr,
    type,
    action,
    description: description || `${actorObj.name} performed ${action} on ${target || 'system'}`,
    actor: actorObj,
    target: String(target || ''),
    metadata: metadata || {}
  };

  const currentLogs = readLogsFromDisk();

  // Deduplicate exact duplicate page visit bursts within 3 seconds for same user and path
  if (type === "page_visit" && currentLogs.length > 0) {
    const lastLog = currentLogs[0];
    if (
      lastLog.type === "page_visit" &&
      lastLog.actor?.employeeId === actorObj.employeeId &&
      lastLog.target === newLog.target &&
      (Date.now() - new Date(lastLog.timestamp).getTime() < 3000)
    ) {
      return lastLog;
    }
  }

  const updated = [newLog, ...currentLogs].slice(0, MAX_LOGS_STORED);
  writeLogsToDisk(updated);
  return newLog;
}

/**
 * Get filtered audit logs with search, role, category, and date filtering
 */
export async function getAuditLogs({
  search = "",
  type = "all",
  role = "all",
  user = "",
  dateRange = "all", // "today", "yesterday", "7days", "all"
  limit = 200,
  page = 1
} = {}) {
  const allLogs = readLogsFromDisk();
  const searchLower = (search || '').trim().toLowerCase();

  const now = new Date();
  const todayDateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDateStr = yesterday.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const filtered = allLogs.filter(log => {
    // Type / Category Filter
    if (type && type !== "all" && log.type !== type) {
      return false;
    }

    // Role Filter
    if (role && role !== "all") {
      const actorRole = (log.actor?.role || '').toLowerCase();
      if (!actorRole.includes(role.toLowerCase())) {
        return false;
      }
    }

    // Specific User Filter
    if (user) {
      const userLower = user.toLowerCase();
      const matchEmp = (log.actor?.employeeId || '').toLowerCase() === userLower;
      const matchEmail = (log.actor?.email || '').toLowerCase() === userLower;
      const matchName = (log.actor?.name || '').toLowerCase().includes(userLower);
      if (!matchEmp && !matchEmail && !matchName) {
        return false;
      }
    }

    // Date Range Filter
    if (dateRange === "today") {
      if (log.dateStr !== todayDateStr) return false;
    } else if (dateRange === "yesterday") {
      if (log.dateStr !== yesterdayDateStr) return false;
    } else if (dateRange === "7days") {
      const logDate = new Date(log.timestamp);
      if (logDate < sevenDaysAgo) return false;
    }

    // Free Text Search Query
    if (searchLower) {
      const inDesc = (log.description || '').toLowerCase().includes(searchLower);
      const inAction = (log.action || '').toLowerCase().includes(searchLower);
      const inActorName = (log.actor?.name || '').toLowerCase().includes(searchLower);
      const inActorEmp = (log.actor?.employeeId || '').toLowerCase().includes(searchLower);
      const inActorRole = (log.actor?.role || '').toLowerCase().includes(searchLower);
      const inTarget = (log.target || '').toLowerCase().includes(searchLower);
      const inPath = (log.metadata?.path || '').toLowerCase().includes(searchLower);
      const inPageTitle = (log.metadata?.pageTitle || '').toLowerCase().includes(searchLower);

      if (!inDesc && !inAction && !inActorName && !inActorEmp && !inActorRole && !inTarget && !inPath && !inPageTitle) {
        return false;
      }
    }

    return true;
  });

  // Calculate Metrics
  const todayLogs = allLogs.filter(l => l.dateStr === todayDateStr);
  const totalPageVisitsToday = todayLogs.filter(l => l.type === 'page_visit').length;
  const totalUserActionsToday = todayLogs.filter(l => l.type === 'user_mgmt').length;
  const uniqueUsersToday = new Set(todayLogs.map(l => l.actor?.employeeId || l.actor?.email).filter(Boolean)).size;

  const startIndex = (page - 1) * limit;
  const paginatedLogs = filtered.slice(startIndex, startIndex + limit);

  return {
    success: true,
    total: filtered.length,
    page,
    limit,
    logs: paginatedLogs,
    metrics: {
      totalRecords: allLogs.length,
      pageVisitsToday: totalPageVisitsToday,
      userActionsToday: totalUserActionsToday,
      activeStaffToday: Math.max(uniqueUsersToday, 1)
    }
  };
}

/**
 * Clear all audit logs (Admin privilege)
 */
export async function clearAuditLogs() {
  const preservedSeed = INITIAL_SEEDED_LOGS.slice(0, 3);
  writeLogsToDisk(preservedSeed);
  return { success: true, message: "Audit logs purged successfully" };
}
