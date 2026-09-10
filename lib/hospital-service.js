// Data Access Layer for Thangam Hospital ERP
// Handles communication with Frappe API Proxy with automatic fallback to localStorage Simulator Mode

const MOCK_DOCTORS = [];

const MOCK_LAB_TESTS = [
  { test_name: "Complete Blood Count (CBC)", fee: 450 },
  { test_name: "Blood Sugar (Fasting)", fee: 250 },
  { test_name: "Lipid Profile", fee: 800 },
  { test_name: "Liver Function Test", fee: 900 },
  { test_name: "Thyroid Profile (T3 T4 TSH)", fee: 700 }
];

const INITIAL_MOCK_MEDICINES = {
  "Paracetamol 650mg": { medicine_name: "Paracetamol 650mg", generic_name: "Paracetamol", brand: "Calpol 650", manufacturer: "GSK India", strength: "650 mg", dosage_form: "Tablet", category: "Regular Medicine", schedule_type: "None", prescription_required: 0, controlled_drug: 0, sleeping_pill: 0, min_stock: 100, max_stock: 500, reorder_level: 150, rack_location: "Rack A-02", purchase_price: 18.0, selling_price: 20.0, gst: 12.0, stock: 90 },
  "Amoxicillin 500mg": { medicine_name: "Amoxicillin 500mg", generic_name: "Amoxicillin Trihydrate", brand: "Mox 500", manufacturer: "Sun Pharma Ltd", strength: "500 mg", dosage_form: "Capsule", category: "Schedule H", schedule_type: "Schedule H", prescription_required: 1, controlled_drug: 0, sleeping_pill: 0, min_stock: 50, max_stock: 200, reorder_level: 80, rack_location: "Rack B-04", purchase_price: 80.0, selling_price: 95.0, gst: 12.0, stock: 35 },
  "Alprazolam 0.5mg": { medicine_name: "Alprazolam 0.5mg", generic_name: "Alprazolam", brand: "Xanax 0.5", manufacturer: "Pfizer India", strength: "0.5 mg", dosage_form: "Tablet", category: "Sleeping Pill", schedule_type: "Schedule H1", prescription_required: 1, controlled_drug: 0, sleeping_pill: 1, min_stock: 20, max_stock: 100, reorder_level: 30, rack_location: "Rack C-01 (Locked)", purchase_price: 12.0, selling_price: 15.0, gst: 12.0, stock: 58 },
  "Fentanyl 50mcg": { medicine_name: "Fentanyl 50mcg", generic_name: "Fentanyl Citrate", brand: "Duragesic Patch", manufacturer: "Janssen Pharma", strength: "50 mcg/hr", dosage_form: "Other", category: "Controlled Drug", schedule_type: "Schedule H1", prescription_required: 1, controlled_drug: 1, sleeping_pill: 0, min_stock: 10, max_stock: 50, reorder_level: 15, rack_location: "Double-Locked Safe-01", purchase_price: 250.0, selling_price: 300.0, gst: 18.0, stock: 23 },
  "Cetirizine 10mg": { medicine_name: "Cetirizine 10mg", generic_name: "Cetirizine Dihydrochloride", brand: "Okacet", manufacturer: "Cipla Ltd", strength: "10 mg", dosage_form: "Tablet", category: "OTC", schedule_type: "None", prescription_required: 0, controlled_drug: 0, sleeping_pill: 0, min_stock: 40, max_stock: 200, reorder_level: 60, rack_location: "Rack A-01", purchase_price: 10.0, selling_price: 15.0, gst: 12.0, stock: 180 },
  "Zolpidem 10mg": { medicine_name: "Zolpidem 10mg", generic_name: "Zolpidem Tartrate", brand: "Stilnox", manufacturer: "Sanofi India", strength: "10 mg", dosage_form: "Tablet", category: "Sleeping Pill", schedule_type: "Schedule H", prescription_required: 1, controlled_drug: 0, sleeping_pill: 1, min_stock: 15, max_stock: 80, reorder_level: 25, rack_location: "Rack C-02 (Locked)", purchase_price: 40.0, selling_price: 50.0, gst: 12.0, stock: 0 }
};

const INITIAL_MOCK_BATCHES = [
  { batch_number: "PM-EXPIRED", medicine: "Paracetamol 650mg", mfg_date: "2024-01-01", exp_date: "2026-01-01", pack_size: 10, no_of_packs: 0, total_units: 0, current_stock: 0, purchase_price: 18.0, mrp: 20.0, selling_price: 20.0, supplier: "ABC Pharma", rack_location: "Rack A-02" },
  { batch_number: "PM-EXP30D", medicine: "Paracetamol 650mg", mfg_date: "2024-08-01", exp_date: "2026-08-15", pack_size: 10, no_of_packs: 1, total_units: 10, current_stock: 10, purchase_price: 18.0, mrp: 20.0, selling_price: 20.0, supplier: "ABC Pharma", rack_location: "Rack A-02" },
  { batch_number: "PM-EXP6M", medicine: "Paracetamol 650mg", mfg_date: "2024-12-01", exp_date: "2026-11-30", pack_size: 10, no_of_packs: 2, total_units: 20, current_stock: 20, purchase_price: 18.0, mrp: 20.0, selling_price: 20.0, supplier: "ABC Pharma", rack_location: "Rack A-02" },
  { batch_number: "PM-STABLE", medicine: "Paracetamol 650mg", mfg_date: "2025-05-01", exp_date: "2027-05-01", pack_size: 10, no_of_packs: 6, total_units: 60, current_stock: 60, purchase_price: 18.0, mrp: 20.0, selling_price: 20.0, supplier: "ABC Pharma", rack_location: "Rack A-02" },
  
  { batch_number: "AM-EXP30D", medicine: "Amoxicillin 500mg", mfg_date: "2024-08-01", exp_date: "2026-08-20", pack_size: 10, no_of_packs: 1.5, total_units: 15, current_stock: 15, purchase_price: 80.0, mrp: 95.0, selling_price: 95.0, supplier: "XYZ Distributors", rack_location: "Rack B-04" },
  { batch_number: "AM-EXP3M", medicine: "Amoxicillin 500mg", mfg_date: "2024-10-01", exp_date: "2026-10-15", pack_size: 10, no_of_packs: 2, total_units: 20, current_stock: 20, purchase_price: 80.0, mrp: 95.0, selling_price: 95.0, supplier: "XYZ Distributors", rack_location: "Rack B-04" },
  
  { batch_number: "AL-EXP3M", medicine: "Alprazolam 0.5mg", mfg_date: "2024-11-01", exp_date: "2026-10-01", pack_size: 10, no_of_packs: 0.8, total_units: 8, current_stock: 8, purchase_price: 12.0, mrp: 15.0, selling_price: 15.0, supplier: "Pharma Plus", rack_location: "Rack C-01 (Locked)" },
  { batch_number: "AL-STABLE", medicine: "Alprazolam 0.5mg", mfg_date: "2025-01-01", exp_date: "2027-12-31", pack_size: 10, no_of_packs: 5, total_units: 50, current_stock: 50, purchase_price: 12.0, mrp: 15.0, selling_price: 15.0, supplier: "Pharma Plus", rack_location: "Rack C-01 (Locked)" },
  
  { batch_number: "FT-EXP6M", medicine: "Fentanyl 50mcg", mfg_date: "2025-01-01", exp_date: "2026-12-31", pack_size: 5, no_of_packs: 0.6, total_units: 3, current_stock: 3, purchase_price: 250.0, mrp: 300.0, selling_price: 300.0, supplier: "Special Drugs Ltd", rack_location: "Double-Locked Safe-01" },
  { batch_number: "FT-STABLE", medicine: "Fentanyl 50mcg", mfg_date: "2025-04-01", exp_date: "2027-10-31", pack_size: 5, no_of_packs: 4, total_units: 20, current_stock: 20, purchase_price: 250.0, mrp: 300.0, selling_price: 300.0, supplier: "Special Drugs Ltd", rack_location: "Double-Locked Safe-01" },
 
  { batch_number: "CT-STABLE", medicine: "Cetirizine 10mg", mfg_date: "2025-01-01", exp_date: "2027-01-01", pack_size: 30, no_of_packs: 6, total_units: 180, current_stock: 180, purchase_price: 10.0, mrp: 15.0, selling_price: 15.0, supplier: "City Meds", rack_location: "Rack A-01" }
];

const INITIAL_MOCK_REGISTER = [];

const INITIAL_MOCK_POS = [];

const INITIAL_MOCK_GRNS = [];

const INITIAL_MOCK_PATIENTS = {};

const INITIAL_MOCK_QUEUE = [];

const isClient = typeof window !== 'undefined';
const MASTER_RESET_VERSION = 'v2026_08_24_master_purge_v3';

function initLocalStorage() {
  if (!isClient) return;

  const currentVersion = localStorage.getItem('hospital_erp_clean_version');
  if (currentVersion !== MASTER_RESET_VERSION) {
    localStorage.setItem('hospital_patients', JSON.stringify({}));
    localStorage.setItem('hospital_queue', JSON.stringify([]));
    localStorage.setItem('hospital_doctors', JSON.stringify([]));
    localStorage.setItem('hospital_staff_users', JSON.stringify(INITIAL_MOCK_STAFF_USERS));
    localStorage.setItem('hospital_drug_register', JSON.stringify([]));
    localStorage.setItem('hospital_purchase_orders', JSON.stringify([]));
    localStorage.setItem('hospital_goods_receipts', JSON.stringify([]));
    localStorage.setItem('hospital_finance_entries', JSON.stringify([]));
    localStorage.setItem('hospital_system_activities', JSON.stringify([]));
    localStorage.setItem('hospital_batches', JSON.stringify(INITIAL_MOCK_BATCHES));
    localStorage.setItem('hospital_medicines', JSON.stringify(INITIAL_MOCK_MEDICINES));
    localStorage.setItem('hospital_erp_clean_version', MASTER_RESET_VERSION);
  }

  // Ensure hospital_batches and hospital_medicines exist
  if (!localStorage.getItem('hospital_batches') || localStorage.getItem('hospital_batches') === '[]') {
    localStorage.setItem('hospital_batches', JSON.stringify(INITIAL_MOCK_BATCHES));
  }
  if (!localStorage.getItem('hospital_medicines') || localStorage.getItem('hospital_medicines') === '{}' || localStorage.getItem('hospital_medicines') === '[]') {
    localStorage.setItem('hospital_medicines', JSON.stringify(INITIAL_MOCK_MEDICINES));
  }
}

export function recordClientAudit(type, action, description, target, metadata = {}) {
  if (!isClient) return;
  try {
    let sessionUser = null;
    const localStr = localStorage.getItem('hospital_erp_user_session');
    if (localStr) {
      try { sessionUser = JSON.parse(localStr); } catch (e) {}
    }

    const empId = sessionUser?.employeeId || sessionUser?.employee_id || sessionUser?.frappeStaffId || sessionUser?.id || 'STAFF';
    const actorName = sessionUser?.full_name || sessionUser?.name || empId;
    const actorRole = sessionUser?.role || (sessionUser?.roles?.[0]) || 'Staff Member';

    fetch('/api/logs/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: type || 'system',
        action: action || 'Action Recorded',
        description: description || '',
        actor: {
          employeeId: empId,
          name: actorName,
          role: actorRole,
          email: sessionUser?.email || '',
          department: sessionUser?.department || ''
        },
        target: String(target || ''),
        metadata: metadata || {}
      })
    }).catch(() => null);
  } catch (e) {}
}

export function isProductionEnvironment() {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host.includes('192.168.') || host.includes('.local') || host === '0.0.0.0';
    return !isLocal;
  }
  return process.env.NODE_ENV === 'production' && (Boolean(process.env.VERCEL) || process.env.APP_ENV === 'production');
}

let cachedDbMode = null;
let lastDbCheckTime = 0;
let dbCheckPromise = null;
const DB_CHECK_TTL = 30000; // 30 seconds cache

export async function checkConnection() {
  if (!isClient) return false;
  // If running locally in development, DO NOT connect to production Frappe (keep testing strictly isolated)
  if (!isProductionEnvironment()) return false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 400);
    const res = await fetch('/api/method/ping', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      return data.message === 'pong';
    }
    return false;
  } catch (e) {
    return false;
  }
}

export async function getDbMode() {
  if (!isClient) return 'simulator';
  // In local development, ALWAYS use isolated simulator mode so test patients, pharmacy, and billing never pollute production
  if (!isProductionEnvironment()) {
    return 'simulator';
  }

  const now = Date.now();
  if (cachedDbMode !== null && (now - lastDbCheckTime) < DB_CHECK_TTL) {
    return cachedDbMode;
  }
  if (dbCheckPromise) {
    return dbCheckPromise;
  }
  dbCheckPromise = (async () => {
    try {
      const isUp = await checkConnection();
      cachedDbMode = isUp ? 'frappe' : 'simulator';
      lastDbCheckTime = Date.now();
      return cachedDbMode;
    } catch {
      cachedDbMode = 'simulator';
      lastDbCheckTime = Date.now();
      return 'simulator';
    } finally {
      dbCheckPromise = null;
    }
  })();
  return dbCheckPromise;
}

export async function getDoctors() {
  initLocalStorage();

  // 1. Fetch active staff users from Central User Management store
  let staffUsers = [];
  try {
    staffUsers = await getStaffUsers();
  } catch (e) {
    console.warn("getDoctors - getStaffUsers fallback:", e);
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('hospital_staff_users');
      if (local) {
        try { staffUsers = JSON.parse(local); } catch (err) {}
      }
    }
  }

  // 2. Fetch any extra doctor metadata from local storage or Frappe
  let extraDoctorMeta = [];
  const mode = await getDbMode();
  if (mode === 'frappe') {
    try {
      const res = await fetch('/api/resource/Hospital Doctor?fields=["*"]');
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw.data)) {
          extraDoctorMeta = raw.data;
        }
      }
    } catch (e) {
      console.warn("Frappe getDoctors metadata fetch notice:", e);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const localDocs = JSON.parse(localStorage.getItem('hospital_doctors') || '[]');
      if (Array.isArray(localDocs) && localDocs.length > 0) {
        extraDoctorMeta = [...extraDoctorMeta, ...localDocs];
      }
    } catch (e) {}
  }

  // 3. Filter staff users for active users with role Doctor
  const doctorStaffUsers = (Array.isArray(staffUsers) ? staffUsers : []).filter(u => {
    if (!u) return false;
    if (u.active === false || u.status === 'Inactive') return false;

    // Strict role check: must have 'Doctor' in roles, role, or designation
    const roles = Array.isArray(u.roles) ? u.roles.map(r => String(r).toLowerCase().trim()) : [];
    const roleStr = String(u.role || '').toLowerCase().trim();
    const designationStr = String(u.designation || '').toLowerCase().trim();

    return roles.includes('doctor') || 
           roleStr === 'doctor' || 
           designationStr === 'doctor' ||
           (u.department && String(u.department).toLowerCase().includes('physician') && (roles.includes('doctor') || roleStr === 'doctor'));
  });

  // 4. Standardize and merge doctor details
  const standardizedDoctors = doctorStaffUsers.map(user => {
    const rawName = (user.full_name || user.name || 'Doctor').trim();
    const cleanName = rawName;
    const email = (user.email || '').trim().toLowerCase();
    const empId = (user.employeeId || user.employee_id || user.frappeStaffId || user.id || '').trim().toLowerCase();

    // Find any matching extra metadata
    const meta = extraDoctorMeta.find(m => {
      if (!m) return false;
      const mName = (m.doctor_name || m.name || '').trim().toLowerCase();
      const mEmail = (m.email || '').trim().toLowerCase();
      const mEmpId = (m.employeeId || m.employee_id || m.id || '').trim().toLowerCase();

      return (email && mEmail && email === mEmail) ||
             (empId && mEmpId && empId === mEmpId) ||
             (mName && cleanName.toLowerCase() === mName) ||
             (mName && cleanName.toLowerCase().replace(/^dr\.?\s+/i, '') === mName.replace(/^dr\.?\s+/i, ''));
    }) || {};

    const consultationFee = meta.consultation_fee !== undefined && meta.consultation_fee !== null && meta.consultation_fee !== ""
      ? parseFloat(meta.consultation_fee)
      : (user.consultation_fee ? parseFloat(user.consultation_fee) : 500);

    return {
      name: cleanName,
      doctor_name: cleanName,
      employeeId: user.employeeId || user.employee_id || user.frappeStaffId || user.id || '',
      email: user.email || meta.email || '',
      mobile_no: user.mobile_no || user.phone || meta.mobile_no || '',
      department: user.department || meta.department || meta.specialization || 'General Medicine',
      specialization: user.department || meta.specialization || meta.department || 'General Medicine',
      consultation_fee: isNaN(consultationFee) ? 500 : consultationFee,
      qualifications: meta.qualifications || user.qualifications || 'MBBS, MD',
      experience: meta.experience || user.experience || '5+ Years',
      rating: meta.rating ? parseFloat(meta.rating) : (user.rating ? parseFloat(user.rating) : 5.0),
      patients: meta.patients || user.patients || '120+',
      success_rate: meta.success_rate || user.success_rate || '98%',
      doctor_image: meta.doctor_image || user.doctor_image || '',
      location: meta.location || user.location || 'OPD Block A',
      status: meta.status || user.status || 'Available',
      about: meta.about || user.about || `Consultant at Thangam Hospital specializing in ${user.department || 'General Medicine'}.`
    };
  });

  // If no doctor staff users exist, fallback to local storage
  if (standardizedDoctors.length === 0 && typeof window !== 'undefined') {
    try {
      const localDocs = JSON.parse(localStorage.getItem('hospital_doctors') || '[]');
      if (Array.isArray(localDocs) && localDocs.length > 0) {
        return localDocs;
      }
    } catch (e) {}
  }

  // Cache standardized doctors list in localStorage
  if (typeof window !== 'undefined' && standardizedDoctors.length > 0) {
    try {
      localStorage.setItem('hospital_doctors', JSON.stringify(standardizedDoctors));
    } catch (e) {}
  }

  return standardizedDoctors;
}

export async function getDoctorFee(doctorName, defaultFee = 500) {
  if (!doctorName) return defaultFee;
  try {
    const docs = await getDoctors();
    const doc = docs.find(d => 
      d.name?.toLowerCase() === doctorName.toLowerCase() ||
      d.doctor_name?.toLowerCase() === doctorName.toLowerCase() ||
      doctorName.toLowerCase().includes(d.doctor_name?.toLowerCase() || '') ||
      (d.doctor_name && doctorName.toLowerCase().includes(d.doctor_name.toLowerCase()))
    );
    if (doc && (doc.consultation_fee !== undefined && doc.consultation_fee !== null && doc.consultation_fee !== "")) {
      const fee = parseFloat(doc.consultation_fee);
      if (!isNaN(fee) && fee > 0) return fee;
    }
  } catch (e) {
    console.warn("getDoctorFee error", e);
  }
  return defaultFee;
}

export async function createDoctor(doctorData) {
  initLocalStorage();
  
  // 1. Sync User Credentials (email, password, mobile_no, roles) to backend
  if (!doctorData.skipUserSync) {
    try {
      await createStaffUser({
        full_name: doctorData.doctor_name || doctorData.name,
        email: doctorData.email || '',
        mobile_no: doctorData.mobile_no || doctorData.mobileNo || doctorData.phone || '',
        password: doctorData.password || 'Doctor@123',
        roles: ['Doctor'],
        role: 'Doctor',
        department: doctorData.specialization || 'General Medicine',
        designation: 'Doctor',
        consultation_fee: doctorData.consultation_fee || 500,
        qualifications: doctorData.qualifications || 'MBBS, MD',
        doctor_image: doctorData.doctor_image || '',
        status: doctorData.status || 'Available'
      });
    } catch (userErr) {
      console.warn("Staff user creation sync warning for doctor:", userErr);
    }
  }

  // 2. Sync Doctor Record to Frappe resource / Hospital Doctor if Frappe is active
  const mode = await getDbMode();
  let createdRecord = null;

  if (mode === 'frappe') {
    try {
      const res = await fetch('/api/resource/Hospital Doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doctorData)
      });
      if (res.ok) {
        const raw = await res.json();
        createdRecord = raw.data;
      }
    } catch (e) {
      console.warn("Frappe createDoctor failed, fallback", e);
    }
  }

  const docs = JSON.parse(localStorage.getItem('hospital_doctors') || '[]');
  const newDoc = createdRecord || { 
    name: doctorData.doctor_name || doctorData.name, 
    doctor_name: doctorData.doctor_name || doctorData.name,
    specialization: doctorData.specialization || 'General Medicine',
    department: doctorData.specialization || 'General Medicine',
    consultation_fee: doctorData.consultation_fee ? parseFloat(doctorData.consultation_fee) : 500,
    ...doctorData 
  };
  
  // Replace existing if name/email match or append
  const existingIdx = docs.findIndex(d => 
    (d.name && d.name.toLowerCase() === newDoc.name.toLowerCase()) || 
    (d.email && doctorData.email && d.email.toLowerCase() === doctorData.email.toLowerCase())
  );
  if (existingIdx !== -1) {
    docs[existingIdx] = { ...docs[existingIdx], ...newDoc };
  } else {
    docs.push(newDoc);
  }

  localStorage.setItem('hospital_doctors', JSON.stringify(docs));

  recordClientAudit(
    'user_mgmt',
    'Doctor Registered',
    `Doctor ${doctorData.doctor_name} (${doctorData.specialization || 'Doctor'}) registered in hospital roster`,
    doctorData.doctor_name,
    { specialization: doctorData.specialization, fee: doctorData.consultation_fee }
  );

  return newDoc;
}

export async function getLabTests() {
  initLocalStorage();
  const mode = await getDbMode();
  if (mode === 'frappe') {
    try {
      const res = await fetch('/api/resource/Hospital Lab Test?fields=["*"]');
      if (res.ok) {
        const raw = await res.json();
        return raw.data || MOCK_LAB_TESTS;
      }
    } catch (e) {
      console.warn("Frappe getLabTests failed, fallback", e);
    }
  }
  return JSON.parse(localStorage.getItem('hospital_lab_tests')) || MOCK_LAB_TESTS;
}

export async function getPatients() {
  initLocalStorage();
  const mode = await getDbMode();
  if (mode === 'frappe') {
    try {
      const res = await fetch('/api/resource/Hospital Patient?fields=["*"]&limit=100');
      if (res.ok) {
        const raw = await res.json();
        const patientMap = {};
        (raw.data || []).forEach(p => { patientMap[p.mobile_number] = p; });
        return patientMap;
      }
    } catch (e) {
      console.warn("Frappe getPatients failed, fallback", e);
    }
  }
  return JSON.parse(localStorage.getItem('hospital_patients')) || INITIAL_MOCK_PATIENTS;
}

export async function getPatient(identifier) {
  if (!identifier) return null;
  initLocalStorage();
  const cleanId = String(identifier).trim();
  const digitsOnly = cleanId.replace(/\D/g, '');
  const mode = await getDbMode();
  if (mode === 'frappe') {
    try {
      const res = await fetch(`/api/resource/Hospital Patient/${encodeURIComponent(cleanId)}`);
      if (res.ok) {
        const raw = await res.json();
        return raw.data;
      }
      if (digitsOnly.length === 10) {
        const resMobile = await fetch(`/api/resource/Hospital Patient/${digitsOnly}`);
        if (resMobile.ok) {
          const rawM = await resMobile.json();
          return rawM.data;
        }
      }
    } catch (e) {
      console.warn("Frappe getPatient failed, fallback", e);
    }
  }
  const patients = JSON.parse(localStorage.getItem('hospital_patients')) || INITIAL_MOCK_PATIENTS;
  if (patients[cleanId]) return patients[cleanId];
  if (digitsOnly.length === 10 && patients[digitsOnly]) return patients[digitsOnly];
  const found = Object.values(patients).find(p => 
    p.mobile_number === cleanId || 
    p.mobile_number === digitsOnly ||
    p.patient_name.toLowerCase().includes(cleanId.toLowerCase())
  );
  return found || null;
}

export async function searchPatient(query) {
  initLocalStorage();
  if (!query) return null;
  const mode = await getDbMode();
  if (mode === 'frappe') {
    try {
      const resById = await fetch(`/api/resource/Hospital Patient/${query}`);
      if (resById.ok) {
        const raw = await resById.json();
        return raw.data;
      }
      const filterStr = JSON.stringify([["Hospital Patient", "patient_name", "like", `%${query}%`]]);
      const resByName = await fetch(`/api/resource/Hospital Patient?filters=${encodeURIComponent(filterStr)}&fields=["*"]`);
      if (resByName.ok) {
        const raw = await resByName.json();
        if (raw.data && raw.data.length > 0) return raw.data[0];
      }
    } catch (e) {
      console.warn("Frappe searchPatient failed, fallback", e);
    }
  }
  const patients = JSON.parse(localStorage.getItem('hospital_patients')) || INITIAL_MOCK_PATIENTS;
  const foundByMobile = patients[query];
  if (foundByMobile) return foundByMobile;
  const foundByName = Object.values(patients).find(p => p.patient_name.toLowerCase().includes(query.toLowerCase()));
  return foundByName || null;
}

export async function createPatient(patientData) {
  initLocalStorage();
  const mode = await getDbMode();
  let created = null;
  const pKey = patientData.mobile_number || patientData.name || patientData.patient_id || `PAT-${Date.now().toString().slice(-6)}`;
  const normalizedData = {
    ...patientData,
    mobile_number: patientData.mobile_number || "",
    name: patientData.name || pKey
  };

  if (mode === 'frappe' && patientData.mobile_number) {
    try {
      const checkRes = await fetch(`/api/resource/Hospital Patient/${patientData.mobile_number}`);
      if (checkRes.ok) {
        const rawCheck = await checkRes.json();
        return rawCheck.data;
      }
      const res = await fetch('/api/resource/Hospital Patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizedData)
      });
      if (res.ok) {
        const raw = await res.json();
        const patients = JSON.parse(localStorage.getItem('hospital_patients')) || INITIAL_MOCK_PATIENTS;
        patients[pKey] = raw.data;
        localStorage.setItem('hospital_patients', JSON.stringify(patients));
        created = raw.data;
      }
    } catch (e) {
      console.warn("Frappe createPatient failed, fallback", e);
    }
  }

  if (!created) {
    const patients = JSON.parse(localStorage.getItem('hospital_patients')) || INITIAL_MOCK_PATIENTS;
    if (patients[pKey]) return patients[pKey];
    patients[pKey] = normalizedData;
    localStorage.setItem('hospital_patients', JSON.stringify(patients));
    created = normalizedData;
  }

  // Audit Log Patient Registration
  recordClientAudit(
    'patient',
    'Patient Registered',
    `Patient registered: ${normalizedData.patient_name} (${normalizedData.mobile_number || 'No Mobile'})`,
    normalizedData.patient_name,
    { mobile: normalizedData.mobile_number, age: normalizedData.age, gender: normalizedData.gender, department: "Reception" }
  );

  return created;
}

export async function updatePatientHistory(mobileNumber, medicalHistory) {
  initLocalStorage();
  const mode = await getDbMode();
  if (mode === 'frappe') {
    try {
      const res = await fetch(`/api/resource/Hospital Patient/${mobileNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medical_history: medicalHistory })
      });
      if (res.ok) {
        const raw = await res.json();
        const patients = JSON.parse(localStorage.getItem('hospital_patients')) || INITIAL_MOCK_PATIENTS;
        if (patients[mobileNumber]) {
          patients[mobileNumber].medical_history = medicalHistory;
          localStorage.setItem('hospital_patients', JSON.stringify(patients));
        }
        return raw.data;
      }
    } catch (e) {
      console.warn("Frappe updatePatientHistory failed, fallback", e);
    }
  }
  const patients = JSON.parse(localStorage.getItem('hospital_patients')) || INITIAL_MOCK_PATIENTS;
  if (patients[mobileNumber]) {
    patients[mobileNumber].medical_history = medicalHistory;
    localStorage.setItem('hospital_patients', JSON.stringify(patients));
  }
  return patients[mobileNumber] || null;
}

export async function getQueue() {
  initLocalStorage();
  const mode = await getDbMode();
  if (mode === 'frappe') {
    try {
      const res = await fetch('/api/resource/Hospital Patient Walk In?fields=["*"]&limit=100&order_by=creation desc');
      if (res.ok) {
        const raw = await res.json();
        const frappeData = raw.data || [];
        const local = JSON.parse(localStorage.getItem('hospital_queue')) || [];
        const merged = frappeData.map(fItem => {
          const lItem = local.find(l => l.name === fItem.name);
          if (lItem) {
            return {
              ...fItem,
              ...lItem,
              creation: fItem.creation || lItem.creation,
              modified: fItem.modified || lItem.modified
            };
          }
          return fItem;
        });

        local.forEach(lItem => {
          if (!merged.some(m => m.name === lItem.name)) {
            merged.push(lItem);
          }
        });

        return merged.length > 0 ? merged : INITIAL_MOCK_QUEUE;
      }
    } catch (e) {
      console.warn("Frappe getQueue failed, fallback", e);
    }
  }
  return JSON.parse(localStorage.getItem('hospital_queue')) || INITIAL_MOCK_QUEUE;
}

export async function createWalkIn(walkInData) {
  initLocalStorage();
  const mode = await getDbMode();

  const recordConsultationPayment = async (walkIn) => {
    if (walkIn.appointment_status === "Doctor Consultation") {
      const docFee = await getDoctorFee(walkIn.doctor);
      const now = Date.now();
      const storedPayments = localStorage.getItem("hospital_dept_payments");
      const deptPayments = storedPayments ? JSON.parse(storedPayments) : [];
      deptPayments.unshift({
        id: `dp-consult-${now}`,
        walkInId: walkIn.name,
        patientName: walkIn.patient_name,
        mobile: walkIn.mobile_number,
        department: "Consultation",
        description: `OPD Fee — ${walkIn.doctor}`,
        amount: docFee,
        method: "UPI",
        date: new Date().toISOString().split("T")[0],
        status: "Paid"
      });
      localStorage.setItem("hospital_dept_payments", JSON.stringify(deptPayments));

      const storedFinance = localStorage.getItem("hospital_custom_finance");
      const financeEntries = storedFinance ? JSON.parse(storedFinance) : [];
      const consultTx = {
        id: `tx-consult-${now}`,
        title: `OPD Consultation — ${walkIn.patient_name}`,
        type: "Income",
        category: "Clinical Services",
        amount: docFee,
        method: "UPI",
        date: new Date().toISOString().split("T")[0],
        notes: `Payment received at booking. Doctor: ${walkIn.doctor}. Walk-in: ${walkIn.name}`
      };
      financeEntries.unshift(consultTx);
      localStorage.setItem("hospital_custom_finance", JSON.stringify(financeEntries));
      recordFinanceTransaction(consultTx).catch(() => null);

      saveInvoiceToProfile(walkIn.mobile_number, {
        name: `OPD Consultation - ${walkIn.doctor}`,
        bill_amount: docFee,
        payment_method: "UPI",
        walkinData: {
          name: walkIn.name,
          patient_name: walkIn.patient_name,
          mobile_number: walkIn.mobile_number,
          doctor: walkIn.doctor,
          docFee: docFee,
          labFee: 0,
          pharmacy_bill_amount: 0,
          need_lab_test: 0,
          deptAlreadyPaid: 0,
          netBalance: docFee,
          paymentMethod: "UPI"
        }
      });
    }
  };

  let createdWalkIn = null;
  if (mode === 'frappe') {
    try {
      const res = await fetch('/api/resource/Hospital Patient Walk In', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: walkInData.patient_name,
          mobile_number: walkInData.mobile_number,
          patient: walkInData.mobile_number,
          is_existing: walkInData.is_existing ? 1 : 0,
          doctor: walkInData.doctor,
          appointment_status: walkInData.appointment_status || 'Doctor Consultation'
        })
      });
      if (res.ok) {
        const raw = await res.json();
        const local = JSON.parse(localStorage.getItem('hospital_queue')) || INITIAL_MOCK_QUEUE;
        localStorage.setItem('hospital_queue', JSON.stringify([...local, raw.data]));
        await recordConsultationPayment(raw.data);
        createdWalkIn = raw.data;
      }
    } catch (e) {
      console.warn("Frappe createWalkIn failed, fallback", e);
    }
  }

  if (!createdWalkIn) {
    const queue = JSON.parse(localStorage.getItem('hospital_queue')) || INITIAL_MOCK_QUEUE;
    const walkinName = `HOSP-WALK-2026-${String(queue.length + 1).padStart(5, '0')}`;
    const newWalkIn = {
      name: walkinName,
      patient_name: walkInData.patient_name,
      mobile_number: walkInData.mobile_number,
      patient: walkInData.mobile_number,
      is_existing: walkInData.is_existing ? 1 : 0,
      doctor: walkInData.doctor,
      appointment_status: walkInData.appointment_status || 'Doctor Consultation',
      diagnosis: "", prescription: "", need_lab_test: 0, lab_test_name: "", lab_test_status: "Pending", lab_result: "", need_medicines: 0, pharmacy_status: "Pending", bill_amount: 0, payment_received: 0, payment_method: ""
    };
    queue.push(newWalkIn);
    localStorage.setItem('hospital_queue', JSON.stringify(queue));
    await recordConsultationPayment(newWalkIn);
    createdWalkIn = newWalkIn;
  }

  // Audit Log Walk-In
  recordClientAudit(
    'patient',
    'Walk-In Queued',
    `Walk-in queued for ${walkInData.patient_name} -> Dr. ${walkInData.doctor}`,
    walkInData.patient_name,
    { doctor: walkInData.doctor, mobile: walkInData.mobile_number, department: "Reception" }
  );

  return createdWalkIn;
}

export async function updateWalkIn(name, updateData) {
  initLocalStorage();
  const mode = await getDbMode();
  if (updateData.lab_test_image && updateData.lab_test_image.length > 200) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`hospital_scan_images_${name}`, updateData.lab_test_image);
      updateData.lab_test_image = "stored_locally";
    }
  }

  let updatedRecord = null;
  if (mode === 'frappe') {
    try {
      const res = await fetch(`/api/resource/Hospital Patient Walk In/${name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (res.ok) {
        const raw = await res.json();
        const queue = JSON.parse(localStorage.getItem('hospital_queue')) || INITIAL_MOCK_QUEUE;
        const updatedQueue = queue.map(q => q.name === name ? { ...q, ...updateData } : q);
        localStorage.setItem('hospital_queue', JSON.stringify(updatedQueue));
        updatedRecord = raw.data;
      }
    } catch (e) {
      console.warn("Frappe updateWalkIn failed, fallback", e);
    }
  }

  if (!updatedRecord) {
    const queue = JSON.parse(localStorage.getItem('hospital_queue')) || INITIAL_MOCK_QUEUE;
    const updatedQueue = queue.map(q => q.name === name ? { ...q, ...updateData } : q);
    localStorage.setItem('hospital_queue', JSON.stringify(updatedQueue));
    updatedRecord = updatedQueue.find(q => q.name === name) || null;
  }

  // Audit Log update event
  const isConsultation = Boolean(updateData.diagnosis || updateData.prescription);
  const actionTitle = isConsultation 
    ? 'Doctor Consultation Completed'
    : updateData.pharmacy_status === 'Dispensed'
      ? 'Pharmacy Dispensation Completed'
      : updateData.appointment_status
        ? `Status Updated to ${updateData.appointment_status}`
        : 'Walk-In Updated';

  const actionDesc = isConsultation
    ? `Consultation completed for ${updatedRecord?.patient_name || name}: Diagnosis '${updateData.diagnosis || 'Recorded'}' (Routing: ${updateData.appointment_status || 'Next Station'})`
    : `Walk-in status updated for ${updatedRecord?.patient_name || name} -> ${updateData.appointment_status || 'Updated'}`;

  recordClientAudit(
    isConsultation ? 'clinical' : 'patient',
    actionTitle,
    actionDesc,
    updatedRecord?.patient_name || name,
    { walkInName: name, ...updateData }
  );

  return updatedRecord;
}

// ========================================================
// ADVANCED PHARMACY LOGIC (MULTI-BATCH & COMPLIANCE)
// ========================================================

// Fetch all medicines, aggregates batch stock, and sets reorder triggers
export async function getMedicines() {
  initLocalStorage();
  const mode = await getDbMode();

  let medsRaw = [];
  let batchesRaw = [];

  if (mode === 'frappe') {
    try {
      const medRes = await fetch('/api/resource/Hospital Medicine?fields=["*"]&limit=1000');
      const batchRes = await fetch('/api/resource/Hospital Medicine Batch?fields=["*"]&limit=1000');
      if (medRes.ok && batchRes.ok) {
        const medsData = await medRes.json();
        const batchesData = await batchRes.json();
        
        const frappeMeds = medsData.data || [];
        const frappeBatches = batchesData.data || [];
        
        const localMedsRaw = JSON.parse(localStorage.getItem('hospital_medicines')) || INITIAL_MOCK_MEDICINES;
        const localMeds = Array.isArray(localMedsRaw) ? localMedsRaw : Object.values(localMedsRaw);
        const localBatches = JSON.parse(localStorage.getItem('hospital_batches')) || INITIAL_MOCK_BATCHES;
        
        const mergedMeds = [...frappeMeds];
        localMeds.forEach(lMed => {
          const fMed = mergedMeds.find(f => (f.medicine_name || f.name || "").toLowerCase().trim() === (lMed.medicine_name || lMed.name || "").toLowerCase().trim());
          if (!fMed) {
            mergedMeds.push(lMed);
          } else {
             if (lMed.stock !== undefined && lMed.stock > (fMed.stock || 0)) {
               fMed.stock = lMed.stock;
             }
          }
        });
        
        const mergedBatches = [...frappeBatches];
        localBatches.forEach(lBatch => {
          const existing = mergedBatches.find(f => f.batch_number === lBatch.batch_number);
          if (!existing) {
            mergedBatches.push(lBatch);
          } else {
            if (lBatch.current_stock !== undefined && lBatch.current_stock !== null) {
              existing.current_stock = lBatch.current_stock;
              existing.total_units = lBatch.total_units || lBatch.current_stock;
            }
          }
        });
        
        medsRaw = mergedMeds;
        batchesRaw = mergedBatches;
      } else {
        throw new Error("Frappe fetch not OK");
      }
    } catch (e) {
      console.warn("Frappe getMedicines failed, using local storage", e);
      const lMeds = JSON.parse(localStorage.getItem('hospital_medicines')) || INITIAL_MOCK_MEDICINES;
      medsRaw = Array.isArray(lMeds) ? lMeds : Object.values(lMeds);
      batchesRaw = JSON.parse(localStorage.getItem('hospital_batches')) || INITIAL_MOCK_BATCHES;
    }
  } else {
    const lMeds = JSON.parse(localStorage.getItem('hospital_medicines')) || INITIAL_MOCK_MEDICINES;
    medsRaw = Array.isArray(lMeds) ? lMeds : Object.values(lMeds);
    batchesRaw = JSON.parse(localStorage.getItem('hospital_batches')) || INITIAL_MOCK_BATCHES;
  }

  // Aggregate batch current stock into parent medicine items
  const aggregatedMeds = medsRaw.map(med => {
    const medNameLower = (med.medicine_name || med.name || "").toLowerCase().trim();
    const medId = med.name;

    const matchedBatchesFromRaw = batchesRaw.filter(b => {
      const bMed = (b.medicine || "").toLowerCase().trim();
      const bMedName = (b.medicine_name || "").toLowerCase().trim();
      return (bMed && bMed === medNameLower) || (bMedName && bMedName === medNameLower) || b.medicine === medId;
    });

    const allBatchesForMed = (matchedBatchesFromRaw.length > 0)
      ? matchedBatchesFromRaw
      : (med.batches && med.batches.length > 0 ? med.batches : []);

    const medBatches = allBatchesForMed.map(b => {
      const pSize = parseInt(b.pack_size) || parseInt(med.pack_size) || 10;
      const cStock = (b.current_stock !== undefined && b.current_stock !== null) 
        ? Number(b.current_stock) 
        : ((b.total_units !== undefined && b.total_units !== null) ? Number(b.total_units) : Number(med.stock || 0));
      const nPacks = (b.no_of_packs !== undefined && b.no_of_packs !== null) 
        ? Number(b.no_of_packs) 
        : (pSize > 0 ? Math.ceil(cStock / pSize) : 1);
      const tUnits = cStock > 0 ? cStock : (pSize * nPacks);
      return {
        ...b,
        medicine: b.medicine || med.medicine_name || med.name,
        medicine_name: b.medicine_name || med.medicine_name || med.name,
        batch_number: b.batch_number || b.batch || "BATCH-01",
        pack_size: pSize,
        no_of_packs: nPacks,
        total_units: tUnits,
        current_stock: cStock,
        exp_date: b.exp_date || b.expiry_date || b.expiry || med.expiry_date || "12-2028",
        mrp: b.mrp ?? b.selling_price ?? med.selling_price ?? 0.0,
        selling_price: b.selling_price ?? b.mrp ?? med.selling_price ?? 0.0,
        supplier: b.supplier || med.supplier || "Default Supplier",
        rack_location: b.rack_location || med.rack_location || "A-1",
        invoice_number: b.invoice_number || med.invoice_number || ""
      };
    });

    const totalStock = medBatches.reduce((acc, b) => acc + (Number(b.current_stock) || 0), 0);
    const finalStock = medBatches.length > 0 ? totalStock : (Number(med.stock) || 0);
    const primaryBatch = medBatches.length > 0 ? medBatches[0] : null;

    // Check if any batch is expiring or expired
    const todayStr = new Date().toISOString().split("T")[0];
    const alerts = medBatches.map(b => {
      const diffMs = new Date(b.exp_date) - new Date(todayStr);
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return 'Expired';
      if (diffDays <= 7) return '7 Days';
      if (diffDays <= 30) return '30 Days';
      if (diffDays <= 90) return '3 Months';
      if (diffDays <= 180) return '6 Months';
      return 'Stable';
    });

    const isLow = finalStock < (med.min_stock || 50);
    const needReorder = finalStock <= (med.reorder_level || 100);
    return {
      ...med,
      medicine_name: med.medicine_name || med.name,
      stock: finalStock,
      expiry_date: primaryBatch ? primaryBatch.exp_date : (med.expiry_date || "12-2028"),
      rack_location: primaryBatch ? primaryBatch.rack_location : (med.rack_location || "A-1"),
      batch_number: primaryBatch ? primaryBatch.batch_number : (med.batch_number || "N/A"),
      invoice_number: primaryBatch?.invoice_number || med.invoice_number || "",
      invoice_date: primaryBatch?.invoice_date || med.invoice_date || "",
      supplier: primaryBatch?.supplier || med.supplier || "ABC Pharma",
      batches: medBatches,
      alerts: alerts,
      is_low_stock: isLow,
      reorder_required: needReorder,
      suggested_purchase: needReorder ? Math.max(0, (med.max_stock || 500) - finalStock) : 0
    };
  });

  // Sync to local storage
  if (isClient) {
    const medsMap = {};
    aggregatedMeds.forEach(m => { medsMap[m.medicine_name] = m; });
    localStorage.setItem('hospital_medicines', JSON.stringify(medsMap));
  }

  return aggregatedMeds;
}

// Fetch Batches for a specific medicine
export async function getMedicineBatches(medicineName) {
  initLocalStorage();
  const mode = await getDbMode();
  if (mode === 'frappe') {
    try {
      const filterStr = JSON.stringify([["Hospital Medicine Batch", "medicine", "=", medicineName]]);
      const res = await fetch(`/api/resource/Hospital Medicine Batch?filters=${encodeURIComponent(filterStr)}&fields=["*"]`);
      if (res.ok) {
        const raw = await res.json();
        return raw.data || [];
      }
    } catch (e) {
      console.warn("Frappe getMedicineBatches failed", e);
    }
  }
  const batches = JSON.parse(localStorage.getItem('hospital_batches')) || INITIAL_MOCK_BATCHES;
  return batches.filter(b => b.medicine === medicineName);
}

// Fetch compliance logs (Government registers)
export async function getDrugRegister() {
  initLocalStorage();
  const mode = await getDbMode();
  if (mode === 'frappe') {
    try {
      const res = await fetch('/api/resource/Hospital Drug Register?fields=["*"]&limit=1000&order_by=dispensing_date desc');
      if (res.ok) {
        const raw = await res.json();
        return raw.data || [];
      }
    } catch (e) {
      console.warn("Frappe getDrugRegister failed", e);
    }
  }
  return JSON.parse(localStorage.getItem('hospital_drug_register')) || INITIAL_MOCK_REGISTER;
}

// Create single drug register log entry
export async function createDrugRegisterEntry(entryData) {
  initLocalStorage();
  const mode = await getDbMode();
  const enrichedEntry = {
    dispensing_date: new Date().toISOString(),
    pharmacist: entryData.pharmacist || "System Pharmacist, RPh",
    ...entryData
  };
  
  if (mode === 'frappe') {
    try {
      const res = await fetch('/api/resource/Hospital Drug Register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrichedEntry)
      });
      if (res.ok) {
        const raw = await res.json();
        // Sync local
        const reg = JSON.parse(localStorage.getItem('hospital_drug_register')) || INITIAL_MOCK_REGISTER;
        reg.unshift(raw.data);
        localStorage.setItem('hospital_drug_register', JSON.stringify(reg));
        return raw.data;
      }
    } catch (e) {
      console.warn("Frappe createDrugRegisterEntry failed, fallback", e);
    }
  }
  const reg = JSON.parse(localStorage.getItem('hospital_drug_register')) || INITIAL_MOCK_REGISTER;
  const simulatedEntry = { name: `REG-SIM-${Date.now()}`, ...enrichedEntry };
  reg.unshift(simulatedEntry);
  localStorage.setItem('hospital_drug_register', JSON.stringify(reg));
  return simulatedEntry;
}

// Execute FEFO-based dispensing transaction (First Expiry First Out)
export async function dispenseMedicineFEFO(walkInId, items, patientName, patientMobile, doctorName, pharmacistName) {
  initLocalStorage();
  const mode = await getDbMode();
  const todayStr = new Date().toISOString().split("T")[0];
  const invoiceNumber = `INV-PH-${Math.floor(10000 + Math.random() * 90000)}`;

  let allBatches = [];
  if (mode === 'frappe') {
    try {
      const res = await fetch('/api/resource/Hospital Medicine Batch?fields=["*"]&limit=1000');
      if (res.ok) {
        const raw = await res.json();
        allBatches = raw.data || [];
      }
    } catch (e) {
      allBatches = JSON.parse(localStorage.getItem('hospital_batches')) || INITIAL_MOCK_BATCHES;
    }
  } else {
    allBatches = JSON.parse(localStorage.getItem('hospital_batches')) || INITIAL_MOCK_BATCHES;
  }

  const dispensedReceipt = [];

  for (const item of items) {
    const { medicine_name, qty, source, dispense_status, dispensed_qty, remaining_qty, remaining_action } = item;
    
    // Check if it's Outside Purchase
    if (source === "Outside Purchase" || dispense_status === "Outside Purchase") {
      dispensedReceipt.push({
        medicine_name,
        requested_qty: qty,
        dispensed_qty: 0,
        source: "Outside Purchase",
        dispense_status: "Outside Purchase",
        deductions: []
      });
      continue;
    }

    // Determine actual quantity to deduct from hospital stock
    let qtyToDeduct = qty;
    if (dispense_status === "Partially Dispensed") {
      qtyToDeduct = dispensed_qty;
    }

    let qtyRemaining = qtyToDeduct;
    const deductions = [];

    // Filter active batches for this medicine: not expired and stock > 0
    const medNameClean = (medicine_name || "").toLowerCase().trim();
    const activeBatches = allBatches
      .filter(b => ((b.medicine || "").toLowerCase().trim() === medNameClean || (b.medicine_name || "").toLowerCase().trim() === medNameClean) && new Date(b.exp_date) > new Date(todayStr) && b.current_stock > 0)
      .sort((a, b) => new Date(a.exp_date) - new Date(b.exp_date)); // Sort expiry ASC

    for (const batch of activeBatches) {
      if (qtyRemaining <= 0) break;

      const deductQty = Math.min(batch.current_stock, qtyRemaining);
      const prevStock = batch.current_stock;
      batch.current_stock -= deductQty;
      qtyRemaining -= deductQty;

      deductions.push({
        batch_number: batch.batch_number,
        qty: deductQty,
        exp_date: batch.exp_date
      });

      // Update specific batch stock level
      if (mode === 'frappe') {
        try {
          await fetch(`/api/resource/Hospital Medicine Batch/${batch.batch_number}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ current_stock: batch.current_stock })
          });
        } catch (e) {
          console.error(`Frappe batch update failed for ${batch.batch_number}`, e);
        }
      }

      // Log automatically to the Government Drug Register
      const medsLocal = JSON.parse(localStorage.getItem('hospital_medicines')) || INITIAL_MOCK_MEDICINES;
      const category = medsLocal[medicine_name]?.category || "Regular Medicine";

      await createDrugRegisterEntry({
        patient_name: patientName,
        patient_id: patientMobile,
        doctor: doctorName,
        medicine: medicine_name,
        drug_category: category,
        batch_number: batch.batch_number,
        quantity: deductQty,
        invoice_number: invoiceNumber,
        pharmacist: pharmacistName
      });

      // Log to Stock Movement Log (Audit Log)
      await createStockMovementLog({
        medicine: medicine_name,
        batch: batch.batch_number,
        previous_stock: prevStock,
        updated_stock: batch.current_stock,
        adjustment_type: "Sale",
        quantity: deductQty,
        reason: "Patient Prescription Dispensation",
        remarks: `Invoice: ${invoiceNumber} | Patient: ${patientName}`,
        performed_by: pharmacistName
      });
    }

    if (qtyRemaining > 0) {
      console.warn(`Insufficient stock of active batches for ${medicine_name}. Unfulfilled: ${qtyRemaining}`);
    }

    dispensedReceipt.push({
      medicine_name,
      requested_qty: qty,
      dispensed_qty: qtyToDeduct - qtyRemaining,
      source: "Hospital Pharmacy",
      dispense_status: dispense_status || "Dispensed",
      remaining_qty: (dispense_status === "Partially Dispensed") ? (remaining_qty + qtyRemaining) : qtyRemaining,
      remaining_action: remaining_action || "Outside Purchase",
      deductions
    });
  }

  // Save the updated batches back to local storage
  if (isClient) {
    localStorage.setItem('hospital_batches', JSON.stringify(allBatches));
  }

  // Recalculate medicine stock levels
  await getMedicines();

  // Audit Log Dispensation
  recordClientAudit(
    'pharmacy',
    'Prescription Dispensed (FEFO)',
    `Dispensed medicines for ${patientName} by ${pharmacistName || 'Pharmacist'} (Invoice: ${invoiceNumber})`,
    patientName,
    { invoiceNumber, patientMobile, doctor: doctorName, itemsCount: items.length }
  );

  return {
    invoiceNumber,
    dispensingDate: new Date().toISOString(),
    dispensedReceipt
  };
}

// Fetch all purchase orders
export async function getPurchaseOrders() {
  initLocalStorage();
  const mode = await getDbMode();
  if (mode === 'frappe') {
    try {
      const res = await fetch('/api/resource/Hospital Purchase Order?fields=["*"]&limit=100&order_by=date desc');
      if (res.ok) {
        const raw = await res.json();
        return raw.data || [];
      }
    } catch (e) {
      console.warn("Frappe getPurchaseOrders failed", e);
    }
  }
  return JSON.parse(localStorage.getItem('hospital_purchase_orders')) || INITIAL_MOCK_POS;
}

// Create a new purchase order
export async function createPurchaseOrder(poData) {
  initLocalStorage();
  const mode = await getDbMode();

  const totalAmount = poData.items.reduce((acc, item) => acc + (item.quantity * item.purchase_price), 0);
  const enrichedPO = {
    date: new Date().toISOString().split("T")[0],
    total_amount: totalAmount,
    status: "Submitted",
    ...poData
  };

  let createdPO = null;
  if (mode === 'frappe') {
    try {
      const res = await fetch('/api/resource/Hospital Purchase Order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrichedPO)
      });
      if (res.ok) {
        const raw = await res.json();
        const pos = JSON.parse(localStorage.getItem('hospital_purchase_orders')) || INITIAL_MOCK_POS;
        pos.unshift(raw.data);
        localStorage.setItem('hospital_purchase_orders', JSON.stringify(pos));
        createdPO = raw.data;
      }
    } catch (e) {
      console.warn("Frappe createPurchaseOrder failed, fallback", e);
    }
  }

  if (!createdPO) {
    const pos = JSON.parse(localStorage.getItem('hospital_purchase_orders')) || INITIAL_MOCK_POS;
    const simulatedPO = { name: `PO-${Date.now()}`, ...enrichedPO };
    pos.unshift(simulatedPO);
    localStorage.setItem('hospital_purchase_orders', JSON.stringify(pos));
    createdPO = simulatedPO;
  }

  // Audit Log PO
  recordClientAudit(
    'pharmacy',
    'Purchase Order Created',
    `Created PO for ${poData.supplier || 'supplier'} (Total: ₹${totalAmount}, Items: ${poData.items?.length || 0})`,
    poData.supplier || 'Pharmacy Supplier',
    { totalAmount, itemsCount: poData.items?.length }
  );

  return createdPO;
}

// Process Goods Receipt (GRN) and update inventory / create batches
export async function receiveGoods(grnData) {
  initLocalStorage();
  const mode = await getDbMode();

  const enrichedGRN = {
    receipt_date: new Date().toISOString().split("T")[0],
    status: "Completed",
    ...grnData
  };

  // Sync to backend
  if (mode === 'frappe') {
    try {
      // 1. Create Goods Receipt Document
      const res = await fetch('/api/resource/Hospital Goods Receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrichedGRN)
      });
      
      if (res.ok) {
        const raw = await res.json();
        // Update purchase order status to received if linked
        if (grnData.purchase_order) {
          await fetch(`/api/resource/Hospital Purchase Order/${grnData.purchase_order}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: "Received" })
          });
        }
      }
    } catch (e) {
      console.warn("Frappe receiveGoods failed, simulating locally", e);
    }
  }

  // 2. Local/Simulator processing to create medicine batches
  const batches = JSON.parse(localStorage.getItem('hospital_batches')) || INITIAL_MOCK_BATCHES;
  
  for (const item of grnData.items) {
    const pSize = parseInt(item.pack_size) || 10;
    const nPacks = (item.no_of_packs !== undefined && item.no_of_packs !== null) ? Number(item.no_of_packs) : (item.quantity ? item.quantity / pSize : 1);
    const totUnits = item.quantity ? Number(item.quantity) : (pSize * nPacks);
    const existingBatchIdx = batches.findIndex(b => b.batch_number === item.batch_number && b.medicine === item.medicine);
    
    if (existingBatchIdx !== -1) {
      // Increment stock in existing batch
      const prevStock = batches[existingBatchIdx].current_stock || 0;
      batches[existingBatchIdx].current_stock = prevStock + totUnits;
      batches[existingBatchIdx].pack_size = pSize;
      batches[existingBatchIdx].no_of_packs = (batches[existingBatchIdx].no_of_packs || 0) + nPacks;
      batches[existingBatchIdx].total_units = batches[existingBatchIdx].current_stock;
      if (item.mrp || item.selling_price) {
        batches[existingBatchIdx].mrp = item.mrp || item.selling_price;
        batches[existingBatchIdx].selling_price = item.mrp || item.selling_price;
      }
      if (mode === 'frappe') {
        try {
          await fetch(`/api/resource/Hospital Medicine Batch/${batches[existingBatchIdx].batch_number}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ current_stock: batches[existingBatchIdx].current_stock })
          });
        } catch (e) {
          console.error("Batch stock increment failed", e);
        }
      }
      
      await createStockMovementLog({
        medicine: item.medicine,
        batch: item.batch_number,
        previous_stock: prevStock,
        updated_stock: batches[existingBatchIdx].current_stock,
        adjustment_type: "Purchase",
        quantity: totUnits,
        reason: "Goods Received (Increment)",
        remarks: `GRN: ${enrichedGRN.name || 'NEW-GRN'} | Supplier: ${grnData.supplier}`,
        performed_by: "Store Manager"
      });
    } else {
      // Create new medicine batch
      const newBatch = {
        batch_number: item.batch_number,
        medicine: item.medicine,
        mfg_date: item.mfg_date || null,
        exp_date: item.exp_date,
        pack_size: pSize,
        no_of_packs: nPacks,
        total_units: totUnits,
        current_stock: totUnits,
        purchase_price: item.purchase_price,
        mrp: item.mrp || item.selling_price || (item.purchase_price * 1.2),
        selling_price: item.selling_price || item.mrp || (item.purchase_price * 1.2),
        supplier: grnData.supplier,
        rack_location: item.rack_location || "Rack A-01"
      };
      batches.unshift(newBatch);

      if (mode === 'frappe') {
        try {
          await fetch('/api/resource/Hospital Medicine Batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newBatch)
          });
        } catch (e) {
          console.error("Batch creation failed on Frappe", e);
        }
      }
      
      await createStockMovementLog({
        medicine: item.medicine,
        batch: item.batch_number,
        previous_stock: 0,
        updated_stock: totUnits,
        adjustment_type: "Purchase",
        quantity: totUnits,
        reason: "Goods Received (New Batch)",
        remarks: `GRN: ${enrichedGRN.name || 'NEW-GRN'} | Supplier: ${grnData.supplier}`,
        performed_by: "Store Manager"
      });
    }
  }

  // Save updated batches to local storage
  if (isClient) {
    localStorage.setItem('hospital_batches', JSON.stringify(batches));
    
    // Save Goods Receipt records locally
    const grns = JSON.parse(localStorage.getItem('hospital_goods_receipts')) || INITIAL_MOCK_GRNS;
    grns.unshift({ name: `GRN-${Date.now()}`, ...enrichedGRN });
    localStorage.setItem('hospital_goods_receipts', JSON.stringify(grns));

    // Update Purchase Order status to Received in local storage
    if (grnData.purchase_order) {
      const pos = JSON.parse(localStorage.getItem('hospital_purchase_orders')) || INITIAL_MOCK_POS;
      const updatedPos = pos.map(po => po.name === grnData.purchase_order ? { ...po, status: "Received" } : po);
      localStorage.setItem('hospital_purchase_orders', JSON.stringify(updatedPos));
    }
  }

  // Recalculate medicine stock levels
  await getMedicines();

  // Audit Log Goods Receipt
  recordClientAudit(
    'pharmacy',
    'Goods Receipt (GRN) Processed',
    `Processed GRN for ${grnData.supplier || 'supplier'} (Items: ${grnData.items?.length || 0})`,
    grnData.supplier || 'Pharmacy Supplier',
    { supplier: grnData.supplier, itemsCount: grnData.items?.length }
  );

  return enrichedGRN;
}

// Fetch a medicine's detailed logs (Batches, sales history, purchase history)
export async function getMedicineHistory(medicineName) {
  initLocalStorage();
  const meds = JSON.parse(localStorage.getItem('hospital_medicines')) || INITIAL_MOCK_MEDICINES;
  const currentMed = meds[medicineName];
  if (!currentMed) return null;

  // Retrieve Batches
  const batches = await getMedicineBatches(medicineName);

  // Retrieve Sales (Drug Register Entries)
  const registerLogs = await getDrugRegister();
  const salesHistory = registerLogs
    .filter(log => log.medicine === medicineName)
    .map(log => ({
      date: log.dispensing_date,
      type: "Dispensed",
      reference: log.invoice_number,
      batch_number: log.batch_number,
      quantity: log.quantity,
      details: `Dispensed to ${log.patient_name} by Dr. ${log.doctor.replace("Dr. ", "")}`
    }));

  // Retrieve Purchases (Completed Goods Receipts)
  const grns = JSON.parse(localStorage.getItem('hospital_goods_receipts')) || INITIAL_MOCK_GRNS;
  const purchaseHistory = [];
  grns.forEach(grn => {
    const items = grn.items || [];
    items.forEach(item => {
      if (item.medicine === medicineName) {
        purchaseHistory.push({
          date: grn.receipt_date,
          type: "Purchased",
          reference: grn.name,
          batch_number: item.batch_number,
          quantity: item.quantity,
          details: `Purchased from ${grn.supplier} at ₹${item.purchase_price}`
        });
      }
    });
  });

  // Retrieve Stock Movement Logs
  const movementLogs = await getStockMovementLogs(medicineName);
  const adjustmentHistory = movementLogs.map(log => ({
    date: log.date,
    type: log.adjustment_type,
    reference: log.name,
    batch_number: log.batch,
    quantity: log.quantity,
    details: `${log.adjustment_type} by ${log.performed_by} | Reason: ${log.reason || "N/A"}${log.remarks ? ` (${log.remarks})` : ""}`
  }));

  // Combine and sort chronologically (most recent first)
  const movementHistory = [...salesHistory, ...purchaseHistory, ...adjustmentHistory].sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    batches,
    purchaseHistory,
    salesHistory,
    movementHistory
  };
}

// Add a new medicine
export async function createMedicine(medicineData) {
  initLocalStorage();
  const mode = await getDbMode();
  let createdMed = null;

  if (mode === 'frappe') {
    try {
      const res = await fetch('/api/resource/Hospital Medicine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medicineData)
      });
      if (res.ok) {
        const raw = await res.json();
        const meds = JSON.parse(localStorage.getItem('hospital_medicines')) || INITIAL_MOCK_MEDICINES;
        meds[medicineData.medicine_name] = raw.data;
        localStorage.setItem('hospital_medicines', JSON.stringify(meds));
        createdMed = raw.data;
      }
    } catch (e) {
      console.warn("Frappe createMedicine failed, fallback", e);
    }
  }

  if (!createdMed) {
    const meds = JSON.parse(localStorage.getItem('hospital_medicines')) || INITIAL_MOCK_MEDICINES;
    const newMed = { name: medicineData.medicine_name, ...medicineData };
    meds[newMed.medicine_name] = newMed;
    localStorage.setItem('hospital_medicines', JSON.stringify(meds));
    createdMed = newMed;
  }

  recordClientAudit(
    'pharmacy',
    'New Medicine Added',
    `Added medicine ${medicineData.medicine_name} to pharmacy catalogue`,
    medicineData.medicine_name,
    { category: medicineData.category, strength: medicineData.strength }
  );

  return createdMed;
}

// Update medicine details
export async function updateMedicine(medicineName, medicineData) {
  initLocalStorage();
  const mode = await getDbMode();
  let updatedMed = null;

  if (mode === 'frappe') {
    try {
      const res = await fetch(`/api/resource/Hospital Medicine/${encodeURIComponent(medicineName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medicineData)
      });
      if (res.ok) {
        const raw = await res.json();
        const meds = JSON.parse(localStorage.getItem('hospital_medicines')) || INITIAL_MOCK_MEDICINES;
        meds[medicineName] = { ...meds[medicineName], ...raw.data };
        localStorage.setItem('hospital_medicines', JSON.stringify(meds));
        updatedMed = raw.data;
      }
    } catch (e) {
      console.warn("Frappe updateMedicine failed, fallback", e);
    }
  }

  if (!updatedMed) {
    let meds = JSON.parse(localStorage.getItem('hospital_medicines')) || INITIAL_MOCK_MEDICINES;
    if (Array.isArray(meds)) {
      const medObj = {};
      meds.forEach(m => { medObj[m.name || m.medicine_name] = m; });
      meds = medObj;
    }
    let keyToUpdate = medicineName;
    if (!meds[keyToUpdate]) {
      const foundKey = Object.keys(meds).find(k => meds[k].medicine_name === medicineName);
      if (foundKey) keyToUpdate = foundKey;
      else throw new Error(`Medicine ${medicineName} not found.`);
    }
    meds[keyToUpdate] = { ...meds[keyToUpdate], ...medicineData };
    localStorage.setItem('hospital_medicines', JSON.stringify(meds));
    updatedMed = meds[keyToUpdate];
  }

  recordClientAudit(
    'pharmacy',
    'Medicine Updated',
    `Updated details for medicine ${medicineName}`,
    medicineName,
    { medicineName }
  );

  return updatedMed;
}

// Update medicine stock level directly (deprecated, use FEFO or receiveGoods)
export async function updateMedicineStock(medicineName, qtyChange) {
  initLocalStorage();
  const meds = JSON.parse(localStorage.getItem('hospital_medicines')) || INITIAL_MOCK_MEDICINES;
  const currentMed = meds[medicineName];
  if (!currentMed) throw new Error(`Medicine ${medicineName} not found in inventory.`);
  
  // Find first active batch of medicine and deduct from it
  const batches = JSON.parse(localStorage.getItem('hospital_batches')) || INITIAL_MOCK_BATCHES;
  const medBatches = batches.filter(b => b.medicine === medicineName).sort((a,b) => new Date(a.exp_date) - new Date(b.exp_date));
  
  if (medBatches.length > 0) {
    // Modify the earliest batch
    const targetBatch = medBatches.find(b => b.current_stock + qtyChange >= 0) || medBatches[0];
    targetBatch.current_stock = Math.max(0, targetBatch.current_stock + qtyChange);
    
    const mode = await getDbMode();
    if (mode === 'frappe') {
      try {
        await fetch(`/api/resource/Hospital Medicine Batch/${targetBatch.batch_number}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_stock: targetBatch.current_stock })
        });
      } catch (e) {
        console.warn("Frappe direct batch stock update failed", e);
      }
    }
    localStorage.setItem('hospital_batches', JSON.stringify(batches));
  }

  const updatedMed = await getMedicines().then(res => res.find(m => m.medicine_name === medicineName));
  return updatedMed;
}

export async function updatePatient(mobileNumber, updateData) {
  initLocalStorage();
  const mode = await getDbMode();
  let updatedPatient = null;

  if (mode === 'frappe') {
    try {
      const res = await fetch(`/api/resource/Hospital Patient/${mobileNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (res.ok) {
        const raw = await res.json();
        const patients = JSON.parse(localStorage.getItem('hospital_patients')) || INITIAL_MOCK_PATIENTS;
        patients[mobileNumber] = { ...patients[mobileNumber], ...raw.data };
        localStorage.setItem('hospital_patients', JSON.stringify(patients));
        updatedPatient = raw.data;
      }
    } catch (e) {
      console.warn("Frappe updatePatient failed, fallback", e);
    }
  }

  if (!updatedPatient) {
    const patients = JSON.parse(localStorage.getItem('hospital_patients')) || INITIAL_MOCK_PATIENTS;
    const current = patients[mobileNumber];
    if (!current) throw new Error(`Patient ${mobileNumber} not found.`);
    patients[mobileNumber] = { ...current, ...updateData };
    localStorage.setItem('hospital_patients', JSON.stringify(patients));
    updatedPatient = patients[mobileNumber];
  }

  recordClientAudit(
    'patient',
    'Patient Profile Updated',
    `Updated profile for patient ${updatedPatient?.patient_name || mobileNumber}`,
    updatedPatient?.patient_name || mobileNumber,
    { mobileNumber, ...updateData }
  );

  return updatedPatient;
}

export async function updateDoctor(doctorName, doctorData) {
  initLocalStorage();

  // Sync User Credentials & Mobile Number if email or details are present
  if (doctorData.email || doctorData.doctor_name || doctorData.specialization) {
    try {
      await fetch('/api/users/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: doctorData.email,
          password: doctorData.password || undefined,
          full_name: doctorData.doctor_name || doctorName,
          mobile_no: doctorData.mobile_no || doctorData.mobileNo || doctorData.phone || '',
          roles: ['Doctor'],
          designation: 'Doctor',
          department: doctorData.specialization || 'General Medicine'
        })
      });
    } catch (userErr) {
      console.warn("User credential update sync warning:", userErr);
    }
  }

  const mode = await getDbMode();
  let updatedDoc = null;

  if (mode === 'frappe') {
    try {
      const res = await fetch(`/api/resource/Hospital Doctor/${encodeURIComponent(doctorName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doctorData)
      });
      if (res.ok) {
        const raw = await res.json();
        updatedDoc = raw.data;
      }
    } catch (e) {
      console.warn("Frappe updateDoctor failed, fallback", e);
    }
  }

  try {
    const docs = JSON.parse(localStorage.getItem('hospital_doctors') || '[]');
    const idx = docs.findIndex(d => 
      (d.name && d.name.toLowerCase() === doctorName.toLowerCase()) ||
      (d.doctor_name && d.doctor_name.toLowerCase() === doctorName.toLowerCase())
    );
    if (idx !== -1) {
      docs[idx] = { ...docs[idx], ...doctorData };
      updatedDoc = updatedDoc || docs[idx];
    } else {
      const newEntry = { name: doctorName, doctor_name: doctorName, ...doctorData };
      docs.push(newEntry);
      updatedDoc = updatedDoc || newEntry;
    }
    localStorage.setItem('hospital_doctors', JSON.stringify(docs));
  } catch (e) {}

  // Also sync in local staff users cache
  if (typeof window !== 'undefined') {
    try {
      const localUsers = JSON.parse(localStorage.getItem('hospital_staff_users') || '[]');
      const uIdx = localUsers.findIndex(u =>
        (u.full_name && u.full_name.toLowerCase() === doctorName.toLowerCase()) ||
        (u.name && u.name.toLowerCase() === doctorName.toLowerCase()) ||
        (doctorData.email && u.email && u.email.toLowerCase() === doctorData.email.toLowerCase())
      );
      if (uIdx !== -1) {
        localUsers[uIdx] = {
          ...localUsers[uIdx],
          full_name: doctorData.doctor_name || localUsers[uIdx].full_name,
          department: doctorData.specialization || localUsers[uIdx].department,
          status: doctorData.status || localUsers[uIdx].status
        };
        localStorage.setItem('hospital_staff_users', JSON.stringify(localUsers));
      }
    } catch (e) {}
  }

  recordClientAudit(
    'user_mgmt',
    'Doctor Profile Updated',
    `Updated profile for Dr. ${doctorName}`,
    doctorName,
    { doctorName, ...doctorData }
  );

  return updatedDoc || { name: doctorName, doctor_name: doctorName, ...doctorData };
}

export async function askRAGAssistant(query, context = "", patientMobile = null) {
  try {
    const res = await fetch("/api/rag/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, context, patientMobile })
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("askRAGAssistant failed:", e);
  }
  return { answer: "Unable to reach RAG AI Assistant at the moment.", sources: [] };
}

export function saveInvoiceToProfile(mobile, invoiceData) {
  if (typeof window === 'undefined') return;
  if (!mobile) return;
  const existingInvoicesRaw = localStorage.getItem(`hospital_patient_invoices_${mobile}`);
  const existingInvoices = existingInvoicesRaw ? JSON.parse(existingInvoicesRaw) : [];
  existingInvoices.unshift({
    id: invoiceData.id || `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: invoiceData.name,
    bill_amount: invoiceData.bill_amount || 0,
    payment_method: invoiceData.payment_method || "UPI",
    date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    type: invoiceData.type || "invoice",
    image: invoiceData.image || null,
    walkinData: invoiceData.walkinData || null
  });
  localStorage.setItem(`hospital_patient_invoices_${mobile}`, JSON.stringify(existingInvoices));
}

// Fetch all stock movement logs
export async function getStockMovementLogs(medicineName = null) {
  initLocalStorage();
  const mode = await getDbMode();
  let logs = [];
  if (mode === 'frappe') {
    try {
      const url = medicineName 
        ? `/api/resource/Hospital Stock Movement Log?fields=["*"]&filters=[["medicine","=","${medicineName}"]]&limit=1000&order_by=date desc`
        : `/api/resource/Hospital Stock Movement Log?fields=["*"]&limit=1000&order_by=date desc`;
      const res = await fetch(url);
      if (res.ok) {
        const raw = await res.json();
        logs = raw.data || [];
      }
    } catch (e) {
      console.warn("Frappe getStockMovementLogs failed, fallback", e);
      logs = JSON.parse(localStorage.getItem('hospital_stock_movements')) || [];
    }
  } else {
    logs = JSON.parse(localStorage.getItem('hospital_stock_movements')) || [];
  }
  if (medicineName) {
    return logs.filter(l => l.medicine === medicineName);
  }
  return logs;
}

// Log a stock mutation
export async function createStockMovementLog(logData) {
  initLocalStorage();
  const mode = await getDbMode();
  const enrichedEntry = {
    date: new Date().toISOString(),
    performed_by: logData.performed_by || "Pharmacist, RPh",
    ...logData
  };
  
  if (mode === 'frappe') {
    try {
      const res = await fetch('/api/resource/Hospital Stock Movement Log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrichedEntry)
      });
      if (res.ok) {
        const raw = await res.json();
        const movements = JSON.parse(localStorage.getItem('hospital_stock_movements')) || [];
        movements.unshift(raw.data);
        localStorage.setItem('hospital_stock_movements', JSON.stringify(movements));
        return raw.data;
      }
    } catch (e) {
      console.warn("Frappe createStockMovementLog failed, fallback", e);
    }
  }
  const movements = JSON.parse(localStorage.getItem('hospital_stock_movements')) || [];
  const simulatedEntry = { name: `STK-MOV-${Date.now()}`, ...enrichedEntry };
  movements.unshift(simulatedEntry);
  localStorage.setItem('hospital_stock_movements', JSON.stringify(movements));
  return simulatedEntry;
}

// Adjust inventory manually
export async function createPharmacyAuditLog(logData) {
  initLocalStorage();
  const mode = await getDbMode();
  const enrichedEntry = {
    date: new Date().toISOString(),
    performed_by: logData.performed_by || "Pharmacist, RPh",
    ...logData
  };
  
  if (mode === 'frappe') {
    try {
      const res = await fetch('/api/resource/Hospital Pharmacy Audit Log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrichedEntry)
      });
      if (res.ok) {
        const raw = await res.json();
        const logs = JSON.parse(localStorage.getItem('hospital_pharmacy_audit_logs')) || [];
        logs.unshift(raw.data);
        localStorage.setItem('hospital_pharmacy_audit_logs', JSON.stringify(logs));
        return raw.data;
      }
    } catch (e) {
      console.warn("Frappe createPharmacyAuditLog failed, fallback", e);
    }
  }
  const logs = JSON.parse(localStorage.getItem('hospital_pharmacy_audit_logs')) || [];
  const simulatedEntry = { name: `PHARM-AUDIT-${Date.now()}`, ...enrichedEntry };
  logs.unshift(simulatedEntry);
  localStorage.setItem('hospital_pharmacy_audit_logs', JSON.stringify(logs));
  return simulatedEntry;
}

export async function getPharmacyAuditLogs() {
  initLocalStorage();
  const mode = await getDbMode();
  let logs = [];
  if (mode === 'frappe') {
    try {
      const res = await fetch('/api/resource/Hospital Pharmacy Audit Log?fields=["*"]&limit_page_length=500&order_by=creation desc');
      if (res.ok) {
        const raw = await res.json();
        logs = raw.data || [];
        localStorage.setItem('hospital_pharmacy_audit_logs', JSON.stringify(logs));
      } else {
        logs = JSON.parse(localStorage.getItem('hospital_pharmacy_audit_logs')) || [];
      }
    } catch (e) {
      logs = JSON.parse(localStorage.getItem('hospital_pharmacy_audit_logs')) || [];
    }
  } else {
    logs = JSON.parse(localStorage.getItem('hospital_pharmacy_audit_logs')) || [];
  }
  return logs;
}

// Adjust inventory manually
export async function adjustStock(adjData) {
  initLocalStorage();
  const mode = await getDbMode();
  const { medicine, batch_number, adjustment_type, quantity, reason, remarks, performed_by, exp_date } = adjData;
  
  let allBatches = [];
  if (mode === 'frappe') {
    try {
      const res = await fetch('/api/resource/Hospital Medicine Batch?fields=["*"]&limit=1000');
      if (res.ok) {
        const raw = await res.json();
        allBatches = raw.data || [];
      }
    } catch (e) {
      allBatches = JSON.parse(localStorage.getItem('hospital_batches')) || [];
    }
  } else {
    allBatches = JSON.parse(localStorage.getItem('hospital_batches')) || [];
  }
  
  let isNewBatch = false;
  let batch = allBatches.find(b => b.batch_number === batch_number && b.medicine === medicine);
  if (!batch) {
    isNewBatch = true;
    let medicinesLocal = {};
    try {
      medicinesLocal = JSON.parse(localStorage.getItem('hospital_medicines')) || {};
    } catch (e) {
      medicinesLocal = {};
    }
    const medInfo = medicinesLocal[medicine] || {};
    batch = {
      batch_number: batch_number,
      medicine: medicine,
      mfg_date: null,
      exp_date: exp_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      current_stock: 0,
      purchase_price: medInfo.purchase_price || 0,
      selling_price: medInfo.selling_price || 0,
      supplier: "",
      rack_location: medInfo.rack_location || "Rack A-01"
    };
    allBatches.unshift(batch);
  }
  
  const prevStock = batch.current_stock;
  let newStock = prevStock;
  const qtyNum = parseInt(quantity) || 0;
  
  if (adjustment_type === "Add Stock" || adjustment_type === "Returned") {
    newStock = prevStock + qtyNum;
  } else if (adjustment_type === "Reduce Stock" || adjustment_type === "Damaged" || adjustment_type === "Expired") {
    newStock = Math.max(0, prevStock - qtyNum);
  } else if (adjustment_type === "Physical Count Correction") {
    newStock = qtyNum;
  }
  
  const netChange = newStock - prevStock;
  batch.current_stock = newStock;
  
  if (mode === 'frappe') {
    try {
      if (isNewBatch) {
        await fetch('/api/resource/Hospital Medicine Batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batch)
        });
      } else {
        await fetch(`/api/resource/Hospital Medicine Batch/${batch_number}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_stock: newStock })
        });
      }
    } catch (e) {
      console.error(`Frappe batch update failed for ${batch_number}`, e);
    }
  }
  
  if (isClient) {
    localStorage.setItem('hospital_batches', JSON.stringify(allBatches));
  }
  
  await createStockMovementLog({
    medicine,
    batch: batch_number,
    previous_stock: prevStock,
    updated_stock: newStock,
    adjustment_type,
    quantity: Math.abs(netChange),
    reason,
    remarks,
    performed_by
  });
  
  await getMedicines();

  recordClientAudit(
    'pharmacy',
    'Pharmacy Stock Adjusted',
    `${adjustment_type} on ${medicine} (${Math.abs(netChange)} units, Batch: ${batch_number}): ${reason || remarks || 'Stock adjusted'}`,
    medicine,
    { medicine, batch: batch_number, adjustmentType: adjustment_type, quantity: Math.abs(netChange) }
  );

  return batch;
}

// Toggle medicine active status (Deactivate)
export async function deactivateMedicine(medicineName, disabledVal) {
  initLocalStorage();
  const mode = await getDbMode();
  
  const medsLocal = JSON.parse(localStorage.getItem('hospital_medicines')) || INITIAL_MOCK_MEDICINES;
  if (medsLocal[medicineName]) {
    medsLocal[medicineName].disabled = disabledVal ? 1 : 0;
    localStorage.setItem('hospital_medicines', JSON.stringify(medsLocal));
  }
  
  if (mode === 'frappe') {
    try {
      const res = await fetch(`/api/resource/Hospital Medicine/${encodeURIComponent(medicineName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disabled: disabledVal ? 1 : 0 })
      });
      if (res.ok) {
        const raw = await res.json();
        recordClientAudit(
          'pharmacy',
          disabledVal ? 'Medicine Deactivated' : 'Medicine Activated',
          `Medicine ${medicineName} status changed to ${disabledVal ? 'Inactive' : 'Active'}`,
          medicineName,
          { medicineName, disabled: disabledVal }
        );
        return raw.data;
      }
    } catch (e) {
      console.warn("Frappe deactivateMedicine failed, fallback", e);
    }
  }

  recordClientAudit(
    'pharmacy',
    disabledVal ? 'Medicine Deactivated' : 'Medicine Activated',
    `Medicine ${medicineName} status changed to ${disabledVal ? 'Inactive' : 'Active'}`,
    medicineName,
    { medicineName, disabled: disabledVal }
  );

  return medsLocal[medicineName];
}

// Process Direct OTC checkout
export async function executeDirectSale(saleDataOrCustomerName, mobileNumber, age, gender, itemsList, paymentMethod, pharmacistName, customerType = "Walk-in") {
  initLocalStorage();
  const mode = await getDbMode();
  const invoiceNumber = `INV-OTC-${Math.floor(10000 + Math.random() * 90000)}`;

  let customer_type = customerType;
  let customer_name = "";
  let mobile_number = "";
  let patientAge = age || "30";
  let patientGender = gender || "Male";
  let items = [];
  let payment_method = "Cash";
  let pharmacist = "Rahul Sharma, RPh";
  let directTotalAmount = 0;

  if (typeof saleDataOrCustomerName === "object" && saleDataOrCustomerName !== null) {
    customer_type = saleDataOrCustomerName.customer_type || "Walk-in";
    customer_name = saleDataOrCustomerName.customer_name || saleDataOrCustomerName.patient_name || "Direct Customer";
    mobile_number = saleDataOrCustomerName.mobile_number || saleDataOrCustomerName.mobile || "N/A";
    patientAge = saleDataOrCustomerName.age || "30";
    patientGender = saleDataOrCustomerName.gender || "Male";
    items = saleDataOrCustomerName.items || [];
    payment_method = saleDataOrCustomerName.payment_method || saleDataOrCustomerName.paymentMethod || "Cash";
    pharmacist = saleDataOrCustomerName.pharmacist || saleDataOrCustomerName.pharmacistName || "Rahul Sharma, RPh";
    directTotalAmount = Number(saleDataOrCustomerName.total_amount) || 0;
  } else {
    customer_name = saleDataOrCustomerName || "Direct Customer";
    mobile_number = mobileNumber || "N/A";
    patientAge = age || "30";
    patientGender = gender || "Male";
    items = itemsList || [];
    payment_method = paymentMethod || "Cash";
    pharmacist = pharmacistName || "Rahul Sharma, RPh";
  }

  let patientName = customer_name;
  let patientMobile = mobile_number || "Walk-in Customer";
  
  if (customer_type === "Registered" && mobile_number && mobile_number !== "N/A") {
    const patients = JSON.parse(localStorage.getItem('hospital_patients')) || INITIAL_MOCK_PATIENTS;
    const pat = patients[mobile_number];
    if (pat) {
      patientName = pat.patient_name;
      const today = new Date().toLocaleDateString("en-IN");
      const itemsStr = items.map(i => `${i.medicine_name} x ${i.qty}`).join(", ");
      pat.medical_history = `OTC Purchase Date: ${today}\nDetails: Purchased ${itemsStr}.\nPayment: ${payment_method}\nInvoice: ${invoiceNumber}\n\n` + (pat.medical_history || "");
      localStorage.setItem('hospital_patients', JSON.stringify(patients));
      
      if (mode === 'frappe') {
        try {
          await fetch(`/api/resource/Hospital Patient/${mobile_number}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ medical_history: pat.medical_history })
          });
        } catch (e) {
          console.warn("Failed syncing patient history on direct sale", e);
        }
      }
    }
  }

  let allBatches = [];
  if (mode === 'frappe') {
    try {
      const res = await fetch('/api/resource/Hospital Medicine Batch?fields=["*"]&limit=1000');
      if (res.ok) {
        const raw = await res.json();
        allBatches = raw.data || [];
      }
    } catch (e) {
      allBatches = JSON.parse(localStorage.getItem('hospital_batches')) || INITIAL_MOCK_BATCHES;
    }
  } else {
    allBatches = JSON.parse(localStorage.getItem('hospital_batches')) || INITIAL_MOCK_BATCHES;
  }

  const medsLocalRaw = JSON.parse(localStorage.getItem('hospital_medicines')) || INITIAL_MOCK_MEDICINES;
  let medsLocal = {};
  if (Array.isArray(medsLocalRaw)) {
    medsLocalRaw.forEach(m => {
      const k = m.medicine_name || m.name;
      if (k) medsLocal[k] = { ...m };
    });
  } else {
    medsLocal = { ...medsLocalRaw };
  }

  const dispensedReceipt = [];
  let calculatedTotal = 0;

  for (const item of items) {
    const { medicine_name, qty, unit_price } = item;
    const medNameClean = (medicine_name || "").toLowerCase().trim();
    let qtyRemaining = Number(qty) || 0;

    // Find parent medicine in catalog for pricing & dosage details
    const parentMedKey = Object.keys(medsLocal).find(k => k.toLowerCase().trim() === medNameClean || (medsLocal[k].medicine_name || "").toLowerCase().trim() === medNameClean);
    const parentMed = parentMedKey ? medsLocal[parentMedKey] : null;
    const itemPrice = unit_price !== undefined ? Number(unit_price) : (parentMed?.selling_price || parentMed?.mrp || 20);
    const category = parentMed?.category || "OTC";
    
    calculatedTotal += (qtyRemaining * itemPrice);

    // Active batches matching medicine (case-insensitive)
    let activeBatches = allBatches
      .filter(b => ((b.medicine || "").toLowerCase().trim() === medNameClean || (b.medicine_name || "").toLowerCase().trim() === medNameClean) && b.current_stock > 0)
      .sort((a, b) => new Date(a.exp_date || "2099-12-31") - new Date(b.exp_date || "2099-12-31"));

    const deductions = [];

    for (const batch of activeBatches) {
      if (qtyRemaining <= 0) break;

      const deductQty = Math.min(batch.current_stock, qtyRemaining);
      const prevStock = batch.current_stock;
      batch.current_stock -= deductQty;
      batch.total_units = (Number(batch.total_units) || prevStock) - deductQty;
      batch.no_of_packs = Math.ceil(batch.current_stock / (batch.pack_size || 10));
      qtyRemaining -= deductQty;

      deductions.push({
        batch_number: batch.batch_number,
        qty: deductQty,
        exp_date: batch.exp_date
      });

      if (mode === 'frappe') {
        try {
          await fetch(`/api/resource/Hospital Medicine Batch/${batch.batch_number}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ current_stock: batch.current_stock })
          });
        } catch (e) {
          console.error(`Frappe batch update failed for ${batch.batch_number}`, e);
        }
      }

      await createDrugRegisterEntry({
        patient_name: patientName,
        patient_id: patientMobile,
        doctor: "Direct Sale (OTC)",
        medicine: medicine_name,
        drug_category: category,
        batch_number: batch.batch_number,
        quantity: deductQty,
        invoice_number: invoiceNumber,
        pharmacist: pharmacist || "System Pharmacist, RPh"
      });

      await createStockMovementLog({
        medicine: medicine_name,
        batch: batch.batch_number,
        previous_stock: prevStock,
        updated_stock: batch.current_stock,
        adjustment_type: "Sale",
        quantity: deductQty,
        reason: "Direct OTC Sale",
        remarks: `Invoice: ${invoiceNumber} | Customer: ${patientName} (${customer_type})`,
        performed_by: pharmacist || "System Pharmacist, RPh"
      });
    }

    // Fallback if stock was in catalog but not partitioned in batches
    if (qtyRemaining > 0) {
      const defaultBatchNo = `BATCH-OTC-${Date.now().toString().slice(-4)}`;
      deductions.push({
        batch_number: defaultBatchNo,
        qty: qtyRemaining,
        exp_date: "12-2028"
      });
      await createDrugRegisterEntry({
        patient_name: patientName,
        patient_id: patientMobile,
        doctor: "Direct Sale (OTC)",
        medicine: medicine_name,
        drug_category: category,
        batch_number: defaultBatchNo,
        quantity: qtyRemaining,
        invoice_number: invoiceNumber,
        pharmacist: pharmacist || "System Pharmacist, RPh"
      });
      await createStockMovementLog({
        medicine: medicine_name,
        batch: defaultBatchNo,
        previous_stock: 0,
        updated_stock: 0,
        adjustment_type: "Sale",
        quantity: qtyRemaining,
        reason: "Direct OTC Sale",
        remarks: `Invoice: ${invoiceNumber} | Customer: ${patientName}`,
        performed_by: pharmacist || "System Pharmacist, RPh"
      });
    }

    // Direct parent medicine stock deduction
    if (parentMedKey && medsLocal[parentMedKey]) {
      medsLocal[parentMedKey].stock = Math.max(0, (Number(medsLocal[parentMedKey].stock) || 0) - (Number(qty) || 0));
    }

    dispensedReceipt.push({
      medicine_name,
      requested_qty: qty,
      dispensed_qty: qty,
      deductions
    });
  }

  if (isClient) {
    localStorage.setItem('hospital_batches', JSON.stringify(allBatches));
    localStorage.setItem('hospital_medicines', JSON.stringify(medsLocal));
  }

  // 4. Record Finance Ledger Transaction for Direct Sale
  const finalBillAmount = directTotalAmount > 0 ? directTotalAmount : calculatedTotal;
  if (isClient && finalBillAmount > 0) {
    const otcTx = {
      id: `tx-otc-${invoiceNumber}`,
      title: `Direct Medicine Sale (OTC) — ${patientName}`,
      type: "Income",
      category: "Pharmacy Income",
      amount: finalBillAmount,
      method: payment_method || "Cash",
      date: new Date().toISOString().split("T")[0],
      notes: `Invoice: ${invoiceNumber} | Customer: ${patientName} (${patientMobile}) | Method: ${payment_method} | Items: ${items.map(i => `${i.medicine_name} (x${i.qty})`).join(", ")}`
    };
    const storedFinance = localStorage.getItem("hospital_custom_finance");
    const financeEntries = storedFinance ? JSON.parse(storedFinance) : [];
    financeEntries.unshift(otcTx);
    localStorage.setItem("hospital_custom_finance", JSON.stringify(financeEntries));
    recordFinanceTransaction(otcTx).catch(() => null);
  }

  await getMedicines();

  recordClientAudit(
    'pharmacy',
    'Direct OTC Sale Completed',
    `OTC direct sale completed for ${patientName} (${invoiceNumber}) - Total items: ${items.length}`,
    patientName,
    { invoiceNumber, paymentMethod: payment_method, customerType: customer_type }
  );

  return {
    invoiceNumber,
    dispensingDate: new Date().toISOString(),
    dispensedReceipt,
    customer: {
      type: customer_type,
      name: patientName,
      mobile: patientMobile,
      age: patientAge,
      gender: patientGender
    }
  };
}

// Process Sold Medicine Return (Sales Return)
export async function executeSalesReturn(returnData) {
  initLocalStorage();
  const mode = await getDbMode();
  const returnId = `RET-${Math.floor(100000 + Math.random() * 900000)}`;
  const {
    invoice_number,
    patient_name,
    patient_id,
    items, // array of { medicine_name, batch_number, return_qty, unit_price, refund_amount, reason }
    total_refund,
    refund_method,
    restock_inventory = true,
    pharmacist = "System Pharmacist, RPh",
    notes = ""
  } = returnData;

  let allBatches = JSON.parse(localStorage.getItem('hospital_batches')) || INITIAL_MOCK_BATCHES;
  let medsRaw = JSON.parse(localStorage.getItem('hospital_medicines')) || INITIAL_MOCK_MEDICINES;

  // Normalize medsLocal into a keyed object
  let medsLocal = {};
  if (Array.isArray(medsRaw)) {
    medsRaw.forEach(m => {
      const k = m.medicine_name || m.name;
      if (k) medsLocal[k] = { ...m };
    });
  } else {
    medsLocal = { ...medsRaw };
  }

  for (const item of (items || [])) {
    const { medicine_name, batch_number, return_qty, sold_qty, reason } = item;
    let qty = Number(return_qty) || 0;
    if (sold_qty !== undefined && sold_qty !== null && Number(sold_qty) > 0) {
      qty = Math.min(qty, Number(sold_qty));
    }
    if (qty <= 0) continue;

    const medNameClean = (medicine_name || "").toLowerCase().trim();

    // 1. Restock to batch & medicine if restock is enabled
    if (restock_inventory) {
      // Find matching batch
      let batch = allBatches.find(b => 
        (b.batch_number === batch_number || b.batch === batch_number) && 
        ((b.medicine || "").toLowerCase().trim() === medNameClean || 
         (b.medicine_name || "").toLowerCase().trim() === medNameClean)
      );

      if (!batch && batch_number && batch_number !== "RETURN" && batch_number !== "N/A") {
        batch = allBatches.find(b => b.batch_number === batch_number || b.batch === batch_number);
      }

      if (!batch) {
        batch = allBatches.find(b => 
          (b.medicine || "").toLowerCase().trim() === medNameClean || 
          (b.medicine_name || "").toLowerCase().trim() === medNameClean
        );
      }

      let prevStock = 0;
      let newStock = qty;

      if (batch) {
        prevStock = Number(batch.current_stock) || 0;
        batch.current_stock = prevStock + qty;
        batch.total_units = (Number(batch.total_units) || prevStock) + qty;
        batch.no_of_packs = Math.ceil(batch.current_stock / (batch.pack_size || 10));
        newStock = batch.current_stock;

        if (mode === 'frappe') {
          try {
            await fetch(`/api/resource/Hospital Medicine Batch/${batch.batch_number}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ current_stock: batch.current_stock })
            });
          } catch (e) {
            console.error(`Frappe batch restock failed for ${batch.batch_number}`, e);
          }
        }
      } else {
        // Find parent medicine to grab dosage form and pack size
        const parentMedKey = Object.keys(medsLocal).find(k => k.toLowerCase().trim() === medNameClean || (medsLocal[k].medicine_name || "").toLowerCase().trim() === medNameClean);
        const parentMed = parentMedKey ? medsLocal[parentMedKey] : null;

        const newBatchObj = {
          name: `BATCH-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          batch_number: (batch_number && batch_number !== "N/A" && batch_number !== "RETURN") ? batch_number : `RET-${Math.floor(1000 + Math.random() * 9000)}`,
          medicine: parentMed?.medicine_name || medicine_name,
          medicine_name: parentMed?.medicine_name || medicine_name,
          current_stock: qty,
          total_units: qty,
          pack_size: parentMed?.pack_size || 10,
          no_of_packs: Math.ceil(qty / (parentMed?.pack_size || 10)),
          exp_date: parentMed?.expiry_date || "12-2028",
          mrp: item.unit_price || parentMed?.selling_price || parentMed?.mrp || 0,
          selling_price: item.unit_price || parentMed?.selling_price || parentMed?.mrp || 0,
          purchase_price: parentMed?.purchase_price || (item.unit_price ? item.unit_price * 0.8 : 0),
          supplier: parentMed?.supplier || "Returned from Patient",
          rack_location: parentMed?.rack_location || "Rack A-01"
        };
        allBatches.unshift(newBatchObj);
        batch = newBatchObj;
      }

      // Also directly update medicine stock in medsLocal
      const medKey = Object.keys(medsLocal).find(k => k.toLowerCase().trim() === medNameClean || (medsLocal[k].medicine_name || "").toLowerCase().trim() === medNameClean);
      if (medKey && medsLocal[medKey]) {
        medsLocal[medKey].stock = (Number(medsLocal[medKey].stock) || 0) + qty;
        if (Array.isArray(medsLocal[medKey].batches)) {
          const mb = medsLocal[medKey].batches.find(b => b.batch_number === (batch_number || batch?.batch_number));
          if (mb) {
            mb.current_stock = (Number(mb.current_stock) || 0) + qty;
            mb.total_units = (Number(mb.total_units) || 0) + qty;
          } else if (batch) {
            medsLocal[medKey].batches.unshift({ ...batch });
          }
        }
      }

      await createStockMovementLog({
        medicine: medicine_name,
        batch: batch_number || batch?.batch_number || "RETURN",
        previous_stock: prevStock,
        updated_stock: newStock,
        adjustment_type: "Return",
        quantity: qty,
        reason: reason || "Sold Medicine Return",
        remarks: `Return ID: ${returnId} | Orig Invoice: ${invoice_number || "Direct Return"} | Patient: ${patient_name || 'Customer'}`,
        performed_by: pharmacist
      });
    }

    // 2. Add negative entry to Drug Register for compliance traceability
    const medKeyForCat = Object.keys(medsLocal).find(k => k.toLowerCase().trim() === medNameClean || (medsLocal[k].medicine_name || "").toLowerCase().trim() === medNameClean);
    const category = medKeyForCat ? (medsLocal[medKeyForCat]?.category || "Regular Medicine") : "Regular Medicine";
    await createDrugRegisterEntry({
      patient_name: patient_name || "Direct Customer",
      patient_id: patient_id || "N/A",
      doctor: "Sales Return",
      medicine: medicine_name,
      drug_category: category,
      batch_number: batch_number || "RETURN",
      quantity: -qty, // negative quantity indicates return in register
      invoice_number: `${returnId} (Ref: ${invoice_number || 'Direct Return'})`,
      pharmacist: pharmacist
    });
  }

  if (isClient) {
    localStorage.setItem('hospital_batches', JSON.stringify(allBatches));
    if (Array.isArray(medsRaw)) {
      localStorage.setItem('hospital_medicines', JSON.stringify(Object.values(medsLocal)));
    } else {
      localStorage.setItem('hospital_medicines', JSON.stringify(medsLocal));
    }
  }

  // Recalculate and sync aggregated medicines
  await getMedicines();

  // 3. Save Sales Return record
  const returnRecord = {
    return_id: returnId,
    invoice_number: invoice_number || "N/A",
    return_date: new Date().toISOString(),
    patient_name: patient_name || "Direct Customer",
    patient_id: patient_id || "N/A",
    items: (items || []).map(i => ({
      ...i,
      return_qty: Number(i.return_qty) || 0,
      refund_amount: Number(i.refund_amount) || 0
    })),
    total_refund: Number(total_refund) || 0,
    refund_method: refund_method || "Cash",
    restock_inventory,
    pharmacist,
    notes
  };

  if (isClient) {
    const returns = JSON.parse(localStorage.getItem('hospital_sales_returns')) || [];
    returns.unshift(returnRecord);
    localStorage.setItem('hospital_sales_returns', JSON.stringify(returns));
  }

  // 3.5. Record Finance Refund entry
  if (isClient && Number(total_refund) > 0) {
    const refundTx = {
      id: `tx-ret-${returnId}`,
      title: `Medicine Return Refund — ${patient_name || "Customer"}`,
      type: "Refund",
      category: "Pharmacy Refund",
      amount: Number(total_refund),
      method: refund_method || "Cash",
      date: new Date().toISOString().split("T")[0],
      notes: `Return ID: ${returnId} | Orig Inv: ${invoice_number || 'N/A'} | Refund: INR ${total_refund} | Pharmacist: ${pharmacist}`
    };
    recordFinanceTransaction(refundTx).catch(() => null);
  }

  // 4. Client audit log
  recordClientAudit(
    'pharmacy',
    'Medicine Sales Return Completed',
    `Sales return processed (${returnId}) for invoice ${invoice_number || 'N/A'}. Refund: INR ${total_refund}`,
    { returnId, invoice_number, total_refund, refund_method }
  );

  return returnRecord;
}

export async function getSalesReturns() {
  initLocalStorage();
  if (isClient) {
    return JSON.parse(localStorage.getItem('hospital_sales_returns')) || [];
  }
  return [];
}

// ========================================================
// STAFF USERS & ROLES/PERMISSIONS MANAGEMENT
// ========================================================

const INITIAL_MOCK_STAFF_USERS = [
  {
    id: "USR-001",
    full_name: "Hospital Admin",
    email: "suryapraks588@gmail.com",
    mobile_no: "8270173588",
    roles: ["Hospital Admin"],
    department: "Hospital Administration",
    designation: "Chief Administrator",
    status: "Active",
    permissions: ["*"]
  },
  {
    id: "USR-002",
    full_name: "Hospital Manager",
    email: "manager@thangamhospital.com",
    mobile_no: "8073788034",
    roles: ["Hospital Admin"],
    department: "Hospital Administration",
    designation: "General Manager",
    status: "Active",
    permissions: ["*"]
  }
];

export async function getStaffUsers() {
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/users/manage', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          localStorage.setItem('hospital_staff_users', JSON.stringify(data.users));
          return data.users;
        }
      }
    } catch (err) {
      console.warn("Cloud staff fetch warning:", err);
    }
    const local = localStorage.getItem('hospital_staff_users');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {}
    }
  }
  return [];
}

export async function createStaffUser(userData) {
  const cleanEmail = (userData.email || '').trim();
  const cleanMobile = (userData.mobile_no || '').trim();
  const cleanPassword = (userData.password || '').trim();

  const empIdCandidate = (userData.employeeId || userData.employee_id || '').trim();
  const validEmpId = (empIdCandidate && !empIdCandidate.startsWith('STAFF-')) ? empIdCandidate : undefined;

  // 1. Sync User credentials directly with Central Cloud Database API
  const manageRes = await fetch('/api/users/manage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: userData.id,
      email: cleanEmail,
      password: cleanPassword,
      full_name: userData.full_name,
      mobile_no: cleanMobile,
      roles: userData.roles || [userData.role || 'Staff Member'],
      permissions: userData.permissions || [],
      department: userData.department,
      designation: userData.designation || userData.role,
      employeeId: validEmpId,
      employee_id: validEmpId
    })
  });

  const manageData = await manageRes.json();
  if (!manageRes.ok || !manageData.success) {
    throw new Error(manageData.error || manageData.message || 'Failed to create staff member in Central Cloud Database');
  }

  const createdUser = manageData.user || {
    id: userData.id || `USR-${Math.floor(100 + Math.random() * 900)}`,
    employeeId: validEmpId || 'TH001',
    full_name: userData.full_name,
    email: cleanEmail,
    mobile_no: cleanMobile,
    roles: userData.roles || [userData.role || 'Staff Member'],
    department: userData.department || 'Clinical',
    designation: userData.designation || userData.role || 'Staff'
  };

  if (typeof window !== 'undefined') {
    try {
      const currentLocal = JSON.parse(localStorage.getItem('hospital_staff_users') || '[]');
      const exists = currentLocal.some(u => (u.employeeId || u.id) === (createdUser.employeeId || createdUser.id));
      if (!exists) {
        localStorage.setItem('hospital_staff_users', JSON.stringify([createdUser, ...currentLocal]));
      }
    } catch (e) {}
  }

  // 2. If role is Doctor, also create/sync Doctor record
  if (userData.role === 'Doctor' || (userData.roles && userData.roles.includes('Doctor'))) {
    try {
      await createDoctor({
        doctor_name: userData.full_name,
        specialization: userData.department || 'General Medicine',
        consultation_fee: userData.consultation_fee ? parseFloat(userData.consultation_fee) : 500,
        qualifications: userData.qualifications || 'MBBS, MD',
        email: cleanEmail,
        password: cleanPassword,
        status: 'Available',
        skipUserSync: true
      });
    } catch (docErr) {
      console.warn("Doctor registry sync warning:", docErr);
    }
  }

  return createdUser;
}

export async function updateUserRolesAndPermissions(email, newRoles, newPermissions) {
  const res = await fetch('/api/users/manage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email,
      roles: newRoles,
      permissions: newPermissions
    })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to update user roles in Central Cloud Database');
  }

  return data.user;
}

export async function deleteStaffUser(identifier) {
  const cleanInput = (identifier || '').trim();
  if (!cleanInput) return false;

  const res = await fetch(`/api/users/manage?identifier=${encodeURIComponent(cleanInput)}`, {
    method: 'DELETE'
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to delete staff member from Central Cloud Database');
  }

  if (typeof window !== 'undefined') {
    try {
      const localUsers = JSON.parse(localStorage.getItem('hospital_staff_users') || '[]');
      const filteredUsers = localUsers.filter(u => {
        const uId = (u.id || '').trim().toLowerCase();
        const uEmpId = (u.employeeId || u.employee_id || u.frappeStaffId || '').trim().toLowerCase();
        const uEmail = (u.email || '').trim().toLowerCase();
        const uName = (u.full_name || u.name || '').trim().toLowerCase();
        const t = cleanInput.toLowerCase();
        return !(uId === t || uEmpId === t || uEmail === t || uName === t);
      });
      localStorage.setItem('hospital_staff_users', JSON.stringify(filteredUsers));
    } catch (e) {}

    try {
      const localDocs = JSON.parse(localStorage.getItem('hospital_doctors') || '[]');
      const filteredDocs = localDocs.filter(d => {
        const dName = (d.doctor_name || d.name || '').trim().toLowerCase();
        const dEmail = (d.email || '').trim().toLowerCase();
        const t = cleanInput.toLowerCase();
        return !(dName === t || dEmail === t);
      });
      localStorage.setItem('hospital_doctors', JSON.stringify(filteredDocs));
    } catch (e) {}
  }

  return true;
}

export async function deleteDoctor(identifier) {
  return deleteStaffUser(identifier);
}

/**
 * Centralized Finance Service Layer
 */
export async function getFinanceTransactions() {
  if (isClient) {
    try {
      const res = await fetch('/api/finance/transactions', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.transactions)) {
          localStorage.setItem('hospital_custom_finance', JSON.stringify(data.transactions));
          return data.transactions;
        }
      }
    } catch (e) {
      console.warn("Central finance API fetch warning:", e.message);
    }
    const local = localStorage.getItem('hospital_custom_finance');
    if (local) {
      try { return JSON.parse(local); } catch (e) {}
    }
  }
  return [];
}

export async function recordFinanceTransaction(tx) {
  if (isClient) {
    try {
      const local = localStorage.getItem('hospital_custom_finance');
      const list = local ? JSON.parse(local) : [];
      const updated = [tx, ...list.filter(t => t.id !== tx.id)];
      localStorage.setItem('hospital_custom_finance', JSON.stringify(updated));

      const res = await fetch('/api/finance/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx)
      });

      recordClientAudit(
        'billing',
        'Financial Entry Recorded',
        `${tx.type || 'Transaction'}: ₹${tx.amount || 0} - ${tx.description || tx.category || 'Ledger Entry'}`,
        tx.id || 'Financial Ledger',
        { amount: tx.amount, type: tx.type, category: tx.category }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.transactions)) {
          localStorage.setItem('hospital_custom_finance', JSON.stringify(data.transactions));
          return data.transactions;
        }
      }
    } catch (e) {
      console.warn("Central finance API post warning:", e.message);
    }
  }
  return [];
}

export async function deleteFinanceTransaction(id) {
  if (isClient) {
    try {
      const local = localStorage.getItem('hospital_custom_finance');
      const list = local ? JSON.parse(local) : [];
      const deletedTx = list.find(t => t.id === id);
      const updated = list.filter(t => t.id !== id);
      localStorage.setItem('hospital_custom_finance', JSON.stringify(updated));

      const res = await fetch(`/api/finance/transactions?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });

      recordClientAudit(
        'billing',
        'Financial Entry Deleted',
        `Deleted financial entry: ${deletedTx?.description || id}`,
        id,
        { id }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.transactions)) {
          localStorage.setItem('hospital_custom_finance', JSON.stringify(data.transactions));
          return data.transactions;
        }
      }
    } catch (e) {
      console.warn("Central finance API delete warning:", e.message);
    }
  }
  return [];
}


