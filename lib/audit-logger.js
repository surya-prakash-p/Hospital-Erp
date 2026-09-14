import path from 'path';
import fs from 'fs';
import os from 'os';

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

export function isProductionEnvironment() {
  return process.env.NODE_ENV === 'production' && (Boolean(process.env.VERCEL) || Boolean(process.env.FRAPPE_PRODUCTION_DEPLOYMENT) || process.env.APP_ENV === 'production');
}

const LOCAL_LOGS_PATH = path.join(process.cwd(), isProductionEnvironment() ? 'thangam_hospital_audit_logs.json' : 'thangam_hospital_audit_logs_dev.json');
const TMP_LOGS_PATH = path.join(os.tmpdir(), isProductionEnvironment() ? 'thangam_hospital_audit_logs.json' : 'thangam_hospital_audit_logs_dev.json');
const SERVER_LOGS_PATH = path.join(os.tmpdir(), isProductionEnvironment() ? 'server_audit_logs.json' : 'server_audit_logs_dev.json');

// In-memory cache with timestamp
let memoryLogsCache = null;
let lastCacheReadTime = 0;
const CACHE_VALIDITY_MS = 3000;
const MAX_LOGS_STORED = 3000;

// Fixed baseline historical entries for local development only (no dynamic shifting timestamps)
const INITIAL_DEV_SEEDED_LOGS = [
  {
    id: "log-seed-1",
    timestamp: "2026-09-02T13:30:00.000Z",
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
    timestamp: "2026-09-02T13:17:00.000Z",
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
    timestamp: "2026-09-02T12:37:00.000Z",
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
  }
];

function readLocalDiskStore() {
  // 1. Try local project file
  try {
    if (fs.existsSync(LOCAL_LOGS_PATH)) {
      const dataStr = fs.readFileSync(LOCAL_LOGS_PATH, 'utf8');
      const parsed = JSON.parse(dataStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  // 2. Try OS tmp path
  try {
    if (fs.existsSync(TMP_LOGS_PATH)) {
      const dataStr = fs.readFileSync(TMP_LOGS_PATH, 'utf8');
      const parsed = JSON.parse(dataStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  // 3. Try server logs path
  try {
    if (fs.existsSync(SERVER_LOGS_PATH)) {
      const dataStr = fs.readFileSync(SERVER_LOGS_PATH, 'utf8');
      const parsed = JSON.parse(dataStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  return null;
}

function writeLocalDiskStore(logsArray) {
  const content = JSON.stringify(logsArray, null, 2);

  try {
    fs.writeFileSync(LOCAL_LOGS_PATH, content, 'utf8');
  } catch (e) {}

  try {
    fs.writeFileSync(TMP_LOGS_PATH, content, 'utf8');
  } catch (e) {}

  try {
    fs.writeFileSync(SERVER_LOGS_PATH, content, 'utf8');
  } catch (e) {}
}

async function readCloudLogs() {
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
        if (Array.isArray(parsed.audit_logs)) {
          return parsed.audit_logs;
        }
      }
    }
  } catch (err) {
    console.warn("Frappe Cloud audit logs fetch notice:", err.message);
  }
  return null;
}

async function writeCloudLogs(logsArray) {
  try {
    const getRes = await fetch(`${SITE_URL}/api/resource/Note/${encodeURIComponent(NOTE_ID)}`, {
      headers,
      cache: 'no-store'
    });

    let noteContent = {};
    if (getRes.ok) {
      const json = await getRes.json();
      if (json.data?.content) {
        try { noteContent = JSON.parse(json.data.content); } catch (e) {}
      }
    }

    noteContent.audit_logs = logsArray.slice(0, MAX_LOGS_STORED);

    await fetch(`${SITE_URL}/api/resource/Note/${encodeURIComponent(NOTE_ID)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        content: JSON.stringify(noteContent)
      })
    });
  } catch (err) {
    console.warn("Frappe Cloud audit logs write notice:", err.message);
  }
}

/**
 * Reads logs from cloud / disk with memory caching
 */
export async function readLogs() {
  const now = Date.now();
  if (memoryLogsCache && Array.isArray(memoryLogsCache) && (now - lastCacheReadTime < CACHE_VALIDITY_MS)) {
    return memoryLogsCache;
  }

  const localLogs = readLocalDiskStore();

  if (isProductionEnvironment()) {
    const cloudLogs = await readCloudLogs();
    if (cloudLogs && Array.isArray(cloudLogs)) {
      // Merge unique logs from cloud and local
      const mergedMap = new Map();
      cloudLogs.forEach(l => { if (l?.id) mergedMap.set(l.id, l); });
      (localLogs || []).forEach(l => { if (l?.id && !mergedMap.has(l.id)) mergedMap.set(l.id, l); });

      const mergedList = Array.from(mergedMap.values()).sort((a, b) => {
        return new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime();
      });

      memoryLogsCache = mergedList;
      lastCacheReadTime = now;
      writeLocalDiskStore(mergedList);
      return mergedList;
    }

    if (localLogs && Array.isArray(localLogs)) {
      memoryLogsCache = localLogs;
      lastCacheReadTime = now;
      return localLogs;
    }

    // Fresh production instance with no logs yet
    memoryLogsCache = [];
    lastCacheReadTime = now;
    return [];
  }

  // Local Development
  if (localLogs && Array.isArray(localLogs) && localLogs.length > 0) {
    memoryLogsCache = localLogs;
    lastCacheReadTime = now;
    return localLogs;
  }

  // Default initial development fallback
  memoryLogsCache = INITIAL_DEV_SEEDED_LOGS;
  lastCacheReadTime = now;
  writeLocalDiskStore(INITIAL_DEV_SEEDED_LOGS);
  return INITIAL_DEV_SEEDED_LOGS;
}

/**
 * Record a new audit log
 */
export async function recordAuditLog({
  type = "system",
  action = "Action Performed",
  description = "",
  actor = null,
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

  const currentLogs = await readLogs();

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
  memoryLogsCache = updated;
  lastCacheReadTime = Date.now();
  writeLocalDiskStore(updated);

  if (isProductionEnvironment()) {
    // Non-blocking write to Frappe Cloud
    writeCloudLogs(updated).catch(() => null);
  }

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
  dateRange = "all",
  limit = 200,
  page = 1
} = {}) {
  const allLogs = await readLogs();
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
  memoryLogsCache = [];
  lastCacheReadTime = Date.now();
  writeLocalDiskStore([]);

  if (isProductionEnvironment()) {
    await writeCloudLogs([]);
  }

  return { success: true, message: "Audit logs purged successfully" };
}
