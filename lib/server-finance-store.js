import path from "path";
import fs from "fs";
import os from "os";

let frappeConfig = null;
try {
  const configPath = path.join(process.cwd(), "frappe_config.json");
  if (fs.existsSync(configPath)) {
    frappeConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }
} catch (err) {}

const SITE_URL = process.env.FRAPPE_SITE_URL || frappeConfig?.site_url || "https://thangamhospital.m.frappe.cloud";
const API_KEY = process.env.FRAPPE_API_KEY || frappeConfig?.api_key || "802a7dc89ec8034";
const API_SECRET = process.env.FRAPPE_API_SECRET || frappeConfig?.api_secret || "edd331225cf6ca1";
const NOTE_ID = "brmj9ldim4";

const headers = {
  "Authorization": `token ${API_KEY}:${API_SECRET}`,
  "Content-Type": "application/json"
};

export const INITIAL_FINANCE_ENTRIES = [
  {
    id: "tx-init-1",
    title: "Staff Nurse Salaries (July)",
    type: "Expense",
    category: "Salary",
    amount: 65000,
    method: "Bank Transfer",
    date: "2026-07-25",
    notes: "Monthly salary disbursement for 3 nurses",
    createdAt: "2026-07-25T10:00:00.000Z"
  },
  {
    id: "tx-init-2",
    title: "Ambulance Fuel & Service",
    type: "Expense",
    category: "Ambulance",
    amount: 4800,
    method: "Cash",
    date: "2026-07-24",
    notes: "Fuel refill and minor engine tuning",
    createdAt: "2026-07-24T11:30:00.000Z"
  },
  {
    id: "tx-init-3",
    title: "ECG Machine Maintenance",
    type: "Expense",
    category: "Maintenance",
    amount: 8500,
    method: "Card",
    date: "2026-07-22",
    notes: "Biomedical engineer routine check & calibration",
    createdAt: "2026-07-22T14:15:00.000Z"
  },
  {
    id: "tx-init-4",
    title: "Electricity & Power Utilities",
    type: "Expense",
    category: "Utilities",
    amount: 12400,
    method: "Bank Transfer",
    date: "2026-07-20",
    notes: "TNEB monthly power utility bill",
    createdAt: "2026-07-20T09:45:00.000Z"
  },
  {
    id: "tx-init-5",
    title: "Pharmacy Drug Re-stocking",
    type: "Expense",
    category: "Medical Supplies",
    amount: 22000,
    method: "Bank Transfer",
    date: "2026-07-18",
    notes: "Bulk purchase of paracetamol, pantocid, amoxicillin",
    createdAt: "2026-07-18T16:00:00.000Z"
  },
  {
    id: "tx-init-6",
    title: "In-house Cafeteria Lease Rent",
    type: "Income",
    category: "Rent",
    amount: 15000,
    method: "UPI",
    date: "2026-07-15",
    notes: "Monthly lease rent received from vendor",
    createdAt: "2026-07-15T12:00:00.000Z"
  },
  {
    id: "tx-init-7",
    title: "Pharmacy Sale — demo",
    type: "Income",
    category: "Pharmacy Income",
    amount: 150,
    method: "Cash",
    date: "2026-08-03",
    notes: "Invoice: INV-PH-46551 | Doctor: Dr. Vignesh | Items: Paracetamol 650mg ×2",
    createdAt: "2026-08-03T11:00:00.000Z"
  },
  {
    id: "tx-init-8",
    title: "rent",
    type: "Income",
    category: "Rent",
    amount: 99,
    method: "UPI",
    date: "2026-07-31",
    notes: "Facility space rent",
    createdAt: "2026-07-31T15:30:00.000Z"
  },
  {
    id: "tx-init-9",
    title: "Patient Billing — Nikhil",
    type: "Income",
    category: "Clinical Services",
    amount: 450,
    method: "UPI",
    date: "2026-07-27",
    notes: "Settled at Billing desk. Doctor: Dr. Vignesh. Lab included: No. Pharmacy: No.",
    createdAt: "2026-07-27T17:20:00.000Z"
  },
  {
    id: "tx-init-10",
    title: "OPD Consultation — Nikhil",
    type: "Income",
    category: "Clinical Services",
    amount: 600,
    method: "UPI",
    date: "2026-07-27",
    notes: "Payment received at booking. Doctor: Dr. Vignesh.",
    createdAt: "2026-07-27T10:15:00.000Z"
  }
];

const LOCAL_STORE_PATH = path.join(process.cwd(), "server_finance_store.json");
const TMP_STORE_PATH = path.join(os.tmpdir(), "server_finance_store.json");

let memoryFinanceCache = null;
let lastCloudFetchTime = 0;
const CACHE_TTL_MS = 6000;

function readLocalDiskStore() {
  try {
    if (fs.existsSync(LOCAL_STORE_PATH)) {
      const dataStr = fs.readFileSync(LOCAL_STORE_PATH, "utf8");
      const parsed = JSON.parse(dataStr);
      if (Array.isArray(parsed.transactions) && parsed.transactions.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  try {
    if (fs.existsSync(TMP_STORE_PATH)) {
      const dataStr = fs.readFileSync(TMP_STORE_PATH, "utf8");
      const parsed = JSON.parse(dataStr);
      if (Array.isArray(parsed.transactions) && parsed.transactions.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  return null;
}

function writeLocalDiskStore(payload) {
  const content = JSON.stringify(payload, null, 2);
  try {
    fs.writeFileSync(LOCAL_STORE_PATH, content, "utf8");
  } catch (e) {
    try {
      fs.writeFileSync(TMP_STORE_PATH, content, "utf8");
    } catch (tmpErr) {
      console.warn("Vercel tmp finance store write warning:", tmpErr.message);
    }
  }
}

export async function readFinanceStore() {
  const now = Date.now();
  if (memoryFinanceCache && (now - lastCloudFetchTime < CACHE_TTL_MS)) {
    return memoryFinanceCache;
  }

  const localStore = readLocalDiskStore() || memoryFinanceCache || { transactions: INITIAL_FINANCE_ENTRIES };
  let currentTransactions = [...(localStore.transactions || [])];

  try {
    const res = await fetch(`${SITE_URL}/api/resource/Note/${encodeURIComponent(NOTE_ID)}`, {
      headers,
      cache: "no-store"
    });

    if (res.ok) {
      lastCloudFetchTime = now;
      const json = await res.json();
      const contentStr = json.data?.content;
      if (contentStr) {
        const parsed = JSON.parse(contentStr);
        if (Array.isArray(parsed.finance_transactions) && parsed.finance_transactions.length > 0) {
          const cloudTx = parsed.finance_transactions;
          cloudTx.forEach(ctx => {
            const idx = currentTransactions.findIndex(t => t.id === ctx.id);
            if (idx === -1) {
              currentTransactions.push(ctx);
            } else {
              currentTransactions[idx] = { ...currentTransactions[idx], ...ctx };
            }
          });
        }
      }
    }
  } catch (err) {}

  if (currentTransactions.length === 0) {
    currentTransactions = [...INITIAL_FINANCE_ENTRIES];
  }

  currentTransactions.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

  const finalPayload = {
    transactions: currentTransactions,
    updatedAt: now
  };

  memoryFinanceCache = finalPayload;
  writeLocalDiskStore(finalPayload);
  return finalPayload;
}

export async function writeFinanceStore(transactions) {
  const payload = {
    transactions: Array.isArray(transactions) ? transactions : [],
    updatedAt: Date.now()
  };

  memoryFinanceCache = payload;
  writeLocalDiskStore(payload);

  try {
    const res = await fetch(`${SITE_URL}/api/resource/Note/${encodeURIComponent(NOTE_ID)}`, {
      headers,
      cache: "no-store"
    });
    if (res.ok) {
      const json = await res.json();
      const contentStr = json.data?.content;
      let notePayload = {};
      if (contentStr) {
        try { notePayload = JSON.parse(contentStr); } catch (e) {}
      }
      notePayload.finance_transactions = payload.transactions;
      notePayload.updatedAt = Date.now();

      await fetch(`${SITE_URL}/api/resource/Note/${encodeURIComponent(NOTE_ID)}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ content: JSON.stringify(notePayload) })
      });
    }
  } catch (cloudErr) {
    console.warn("Frappe finance cloud sync note:", cloudErr.message);
  }

  return payload;
}

export async function addFinanceTransaction(tx) {
  const current = await readFinanceStore();
  const txList = current.transactions || [];

  const newEntry = {
    id: tx.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: tx.title || "Hospital Transaction",
    type: tx.type || "Expense",
    category: tx.category || "General",
    amount: parseFloat(tx.amount || 0),
    method: tx.method || "Cash",
    date: tx.date || new Date().toISOString().split("T")[0],
    notes: tx.notes || "",
    actor: tx.actor || null,
    createdAt: tx.createdAt || new Date().toISOString()
  };

  const updated = [newEntry, ...txList.filter(t => t.id !== newEntry.id)];
  await writeFinanceStore(updated);
  return newEntry;
}

export async function deleteFinanceTransaction(id) {
  const current = await readFinanceStore();
  const txList = current.transactions || [];
  const updated = txList.filter(t => t.id !== id);
  await writeFinanceStore(updated);
  return { success: true, deletedId: id };
}

export function computeFinanceMetrics(transactions = []) {
  let totalIncome = 0;
  let totalExpense = 0;
  let clinicalIncome = 0;
  let pharmacyIncome = 0;

  transactions.forEach(tx => {
    const amt = parseFloat(tx.amount || 0);
    if (tx.type === "Income") {
      totalIncome += amt;
      const cat = (tx.category || "").toLowerCase();
      const title = (tx.title || "").toLowerCase();
      if (cat.includes("pharmacy") || title.includes("pharmacy sale") || cat === "pharmacy") {
        pharmacyIncome += amt;
      } else if (cat.includes("clinical") || title.includes("opd consultation") || title.includes("patient billing")) {
        clinicalIncome += amt;
      }
    } else if (tx.type === "Expense") {
      totalExpense += amt;
    }
  });

  const netProfit = totalIncome - totalExpense;

  return {
    totalIncome,
    totalExpense,
    clinicalIncome,
    pharmacyIncome,
    netProfit,
    count: transactions.length
  };
}
