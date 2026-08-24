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
  { batch_number: "PM-EXPIRED", medicine: "Paracetamol 650mg", mfg_date: "2024-01-01", exp_date: "2026-01-01", current_stock: 0, purchase_price: 18.0, selling_price: 20.0, supplier: "ABC Pharma", rack_location: "Rack A-02" },
  { batch_number: "PM-EXP30D", medicine: "Paracetamol 650mg", mfg_date: "2024-08-01", exp_date: "2026-08-15", current_stock: 10, purchase_price: 18.0, selling_price: 20.0, supplier: "ABC Pharma", rack_location: "Rack A-02" },
  { batch_number: "PM-EXP6M", medicine: "Paracetamol 650mg", mfg_date: "2024-12-01", exp_date: "2026-11-30", current_stock: 20, purchase_price: 18.0, selling_price: 20.0, supplier: "ABC Pharma", rack_location: "Rack A-02" },
  { batch_number: "PM-STABLE", medicine: "Paracetamol 650mg", mfg_date: "2025-05-01", exp_date: "2027-05-01", current_stock: 60, purchase_price: 18.0, selling_price: 20.0, supplier: "ABC Pharma", rack_location: "Rack A-02" },
  
  { batch_number: "AM-EXP30D", medicine: "Amoxicillin 500mg", mfg_date: "2024-08-01", exp_date: "2026-08-20", current_stock: 15, purchase_price: 80.0, selling_price: 95.0, supplier: "XYZ Distributors", rack_location: "Rack B-04" },
  { batch_number: "AM-EXP3M", medicine: "Amoxicillin 500mg", mfg_date: "2024-10-01", exp_date: "2026-10-15", current_stock: 20, purchase_price: 80.0, selling_price: 95.0, supplier: "XYZ Distributors", rack_location: "Rack B-04" },
  
  { batch_number: "AL-EXP3M", medicine: "Alprazolam 0.5mg", mfg_date: "2024-11-01", exp_date: "2026-10-01", current_stock: 8, purchase_price: 12.0, selling_price: 15.0, supplier: "Pharma Plus", rack_location: "Rack C-01 (Locked)" },
  { batch_number: "AL-STABLE", medicine: "Alprazolam 0.5mg", mfg_date: "2025-01-01", exp_date: "2027-12-31", current_stock: 50, purchase_price: 12.0, selling_price: 15.0, supplier: "Pharma Plus", rack_location: "Rack C-01 (Locked)" },
  
  { batch_number: "FT-EXP6M", medicine: "Fentanyl 50mcg", mfg_date: "2025-01-01", exp_date: "2026-12-31", current_stock: 3, purchase_price: 250.0, selling_price: 300.0, supplier: "Special Drugs Ltd", rack_location: "Double-Locked Safe-01" },
  { batch_number: "FT-STABLE", medicine: "Fentanyl 50mcg", mfg_date: "2025-04-01", exp_date: "2027-10-31", current_stock: 20, purchase_price: 250.0, selling_price: 300.0, supplier: "Special Drugs Ltd", rack_location: "Double-Locked Safe-01" },
 
  { batch_number: "CT-STABLE", medicine: "Cetirizine 10mg", mfg_date: "2025-01-01", exp_date: "2027-01-01", current_stock: 180, purchase_price: 10.0, selling_price: 15.0, supplier: "City Meds", rack_location: "Rack A-01" }
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
    localStorage.setItem('hospital_erp_clean_version', MASTER_RESET_VERSION);
  }
}

export async function checkConnection() {
  if (!isClient) return false;
  try {
    const res = await fetch('/api/method/ping');
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
  const isUp = await checkConnection();
  return isUp ? 'frappe' : 'simulator';
}

export async function getDoctors() {
  initLocalStorage();
  const mode = await getDbMode();
  if (mode === 'frappe') {
    try {
      const res = await fetch('/api/resource/Hospital Doctor?fields=["*"]');
      if (res.ok) {
        const raw = await res.json();
        return raw.data || MOCK_DOCTORS;
      }
    } catch (e) {
      console.warn("Frappe getDoctors failed, fallback to simulator", e);
    }
  }
  return JSON.parse(localStorage.getItem('hospital_doctors')) || MOCK_DOCTORS;
}

export async function createDoctor(doctorData) {
  initLocalStorage();
  
  // 1. Sync User Credentials (email, password, roles) to backend
  if (doctorData.email) {
    try {
      await fetch('/api/users/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: doctorData.email,
          password: doctorData.password,
          full_name: doctorData.doctor_name,
          mobile_no: doctorData.email,
          roles: ['Doctor'],
          designation: 'Doctor',
          department: doctorData.specialization || 'Consultation'
        })
      });
    } catch (userErr) {
      console.warn("User credential sync warning:", userErr);
    }
  }

  // 2. Sync Doctor Record to Frappe resource / Hospital Doctor
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

  const docs = JSON.parse(localStorage.getItem('hospital_doctors')) || MOCK_DOCTORS;
  const newDoc = createdRecord || { name: doctorData.doctor_name, ...doctorData };
  
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
  if (mode === 'frappe') {
    try {
      const checkRes = await fetch(`/api/resource/Hospital Patient/${patientData.mobile_number}`);
      if (checkRes.ok) {
        const rawCheck = await checkRes.json();
        return rawCheck.data;
      }
      const res = await fetch('/api/resource/Hospital Patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData)
      });
      if (res.ok) {
        const raw = await res.json();
        const patients = JSON.parse(localStorage.getItem('hospital_patients')) || INITIAL_MOCK_PATIENTS;
        patients[patientData.mobile_number] = raw.data;
        localStorage.setItem('hospital_patients', JSON.stringify(patients));
        return raw.data;
      }
    } catch (e) {
      console.warn("Frappe createPatient failed, fallback", e);
    }
  }
  const patients = JSON.parse(localStorage.getItem('hospital_patients')) || INITIAL_MOCK_PATIENTS;
  if (patients[patientData.mobile_number]) return patients[patientData.mobile_number];
  patients[patientData.mobile_number] = patientData;
  localStorage.setItem('hospital_patients', JSON.stringify(patients));
  return patientData;
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
    return patients[mobileNumber];
  }
  return null;
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
              next_checkup_date: lItem.next_checkup_date || fItem.next_checkup_date,
              pharmacy_bill_amount: lItem.pharmacy_bill_amount || fItem.pharmacy_bill_amount,
              dispensed_medicines: lItem.dispensed_medicines || fItem.dispensed_medicines
            };
          }
          return fItem;
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

  const recordConsultationPayment = (walkIn) => {
    if (walkIn.appointment_status === "Doctor Consultation") {
      const DOCTOR_FEES = { "Dr. Rajesh": 500, "Dr. Priya": 1000, "Dr. Vignesh": 600 };
      const docFee = DOCTOR_FEES[walkIn.doctor] || 500;
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
      financeEntries.unshift({
        id: `tx-consult-${now}`,
        title: `OPD Consultation — ${walkIn.patient_name}`,
        type: "Income",
        category: "Clinical Services",
        amount: docFee,
        method: "UPI",
        date: new Date().toISOString().split("T")[0],
        notes: `Payment received at booking. Doctor: ${walkIn.doctor}. Walk-in: ${walkIn.name}`
      });
      localStorage.setItem("hospital_custom_finance", JSON.stringify(financeEntries));

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
        recordConsultationPayment(raw.data);
        return raw.data;
      }
    } catch (e) {
      console.warn("Frappe createWalkIn failed, fallback", e);
    }
  }
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
  recordConsultationPayment(newWalkIn);
  return newWalkIn;
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
        return raw.data;
      }
    } catch (e) {
      console.warn("Frappe updateWalkIn failed, fallback", e);
    }
  }
  const queue = JSON.parse(localStorage.getItem('hospital_queue')) || INITIAL_MOCK_QUEUE;
  const updatedQueue = queue.map(q => q.name === name ? { ...q, ...updateData } : q);
  localStorage.setItem('hospital_queue', JSON.stringify(updatedQueue));
  return updatedQueue.find(q => q.name === name) || null;
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
        
        const localMeds = Object.values(JSON.parse(localStorage.getItem('hospital_medicines')) || {});
        const localBatches = JSON.parse(localStorage.getItem('hospital_batches')) || [];
        
        const mergedMeds = [...frappeMeds];
        localMeds.forEach(lMed => {
          if (!mergedMeds.find(f => (f.medicine_name || "").toLowerCase() === (lMed.medicine_name || "").toLowerCase())) {
            mergedMeds.push(lMed);
          } else {
             // If it exists in both, prefer local stock updates if they were modified by AI import
             const fMed = mergedMeds.find(f => (f.medicine_name || "").toLowerCase() === (lMed.medicine_name || "").toLowerCase());
             if (lMed.stock > (fMed.stock || 0)) {
               fMed.stock = lMed.stock;
             }
          }
        });
        
        const mergedBatches = [...frappeBatches];
        localBatches.forEach(lBatch => {
          if (!mergedBatches.find(f => f.batch_number === lBatch.batch_number)) {
            mergedBatches.push(lBatch);
          }
        });
        
        medsRaw = mergedMeds;
        batchesRaw = mergedBatches;
      } else {
        throw new Error("Frappe fetch not OK");
      }
    } catch (e) {
      console.warn("Frappe getMedicines failed, using local storage", e);
      medsRaw = Object.values(JSON.parse(localStorage.getItem('hospital_medicines')) || {});
      batchesRaw = JSON.parse(localStorage.getItem('hospital_batches')) || [];
    }
  } else {
    medsRaw = Object.values(JSON.parse(localStorage.getItem('hospital_medicines')) || {});
    batchesRaw = JSON.parse(localStorage.getItem('hospital_batches')) || [];
  }

  // Aggregate batch current stock into parent medicine items
  const aggregatedMeds = medsRaw.map(med => {
    // Find all batches for this medicine
    const medBatches = batchesRaw.filter(b => b.medicine === med.medicine_name);
    // Sum active (non-expired) stock, or even expired ones to show physical stock but flag them
    const totalStock = medBatches.reduce((acc, b) => acc + (b.current_stock || 0), 0);
    
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

    const isLow = totalStock < (med.min_stock || 50);
    const needReorder = totalStock <= (med.reorder_level || 100);

    return {
      ...med,
      stock: totalStock,
      batches: medBatches,
      alerts: alerts,
      is_low_stock: isLow,
      reorder_required: needReorder,
      suggested_purchase: needReorder ? Math.max(0, (med.max_stock || 500) - totalStock) : 0
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
      allBatches = JSON.parse(localStorage.getItem('hospital_batches')) || [];
    }
  } else {
    allBatches = JSON.parse(localStorage.getItem('hospital_batches')) || [];
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
    const activeBatches = allBatches
      .filter(b => b.medicine === medicine_name && new Date(b.exp_date) > new Date(todayStr) && b.current_stock > 0)
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
        return raw.data;
      }
    } catch (e) {
      console.warn("Frappe createPurchaseOrder failed, fallback", e);
    }
  }
  const pos = JSON.parse(localStorage.getItem('hospital_purchase_orders')) || INITIAL_MOCK_POS;
  const simulatedPO = { name: `PO-${Date.now()}`, ...enrichedPO };
  pos.unshift(simulatedPO);
  localStorage.setItem('hospital_purchase_orders', JSON.stringify(pos));
  return simulatedPO;
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
    const existingBatchIdx = batches.findIndex(b => b.batch_number === item.batch_number && b.medicine === item.medicine);
    
    if (existingBatchIdx !== -1) {
      // Increment stock in existing batch
      const prevStock = batches[existingBatchIdx].current_stock;
      batches[existingBatchIdx].current_stock += item.quantity;
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
        quantity: item.quantity,
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
        current_stock: item.quantity,
        purchase_price: item.purchase_price,
        selling_price: item.selling_price || (item.purchase_price * 1.2),
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
        updated_stock: item.quantity,
        adjustment_type: "Purchase",
        quantity: item.quantity,
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
        return raw.data;
      }
    } catch (e) {
      console.warn("Frappe createMedicine failed, fallback", e);
    }
  }
  const meds = JSON.parse(localStorage.getItem('hospital_medicines')) || INITIAL_MOCK_MEDICINES;
  const newMed = { name: medicineData.medicine_name, ...medicineData };
  meds[newMed.medicine_name] = newMed;
  localStorage.setItem('hospital_medicines', JSON.stringify(meds));
  return newMed;
}

// Update medicine details
export async function updateMedicine(medicineName, medicineData) {
  initLocalStorage();
  const mode = await getDbMode();
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
        return raw.data;
      }
    } catch (e) {
      console.warn("Frappe updateMedicine failed, fallback", e);
    }
  }
  let meds = JSON.parse(localStorage.getItem('hospital_medicines')) || INITIAL_MOCK_MEDICINES;
  if (Array.isArray(meds)) {
    const medObj = {};
    meds.forEach(m => { medObj[m.name || m.medicine_name] = m; });
    meds = medObj;
  }
  let keyToUpdate = medicineName;
  if (!meds[keyToUpdate]) {
    // try finding by medicine_name just in case
    const foundKey = Object.keys(meds).find(k => meds[k].medicine_name === medicineName);
    if (foundKey) keyToUpdate = foundKey;
    else throw new Error(`Medicine ${medicineName} not found.`);
  }
  meds[keyToUpdate] = { ...meds[keyToUpdate], ...medicineData };
  localStorage.setItem('hospital_medicines', JSON.stringify(meds));
  return meds[medicineName];
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
        return raw.data;
      }
    } catch (e) {
      console.warn("Frappe updatePatient failed, fallback", e);
    }
  }
  const patients = JSON.parse(localStorage.getItem('hospital_patients')) || INITIAL_MOCK_PATIENTS;
  const current = patients[mobileNumber];
  if (!current) throw new Error(`Patient ${mobileNumber} not found.`);
  patients[mobileNumber] = { ...current, ...updateData };
  localStorage.setItem('hospital_patients', JSON.stringify(patients));
  return patients[mobileNumber];
}

export async function updateDoctor(doctorName, doctorData) {
  initLocalStorage();
  const mode = await getDbMode();
  if (mode === 'frappe') {
    try {
      const res = await fetch(`/api/resource/Hospital Doctor/${encodeURIComponent(doctorName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doctorData)
      });
      if (res.ok) {
        const raw = await res.json();
        const docs = JSON.parse(localStorage.getItem('hospital_doctors')) || MOCK_DOCTORS;
        const updatedDocs = docs.map(d => d.name === doctorName ? { ...d, ...raw.data } : d);
        localStorage.setItem('hospital_doctors', JSON.stringify(updatedDocs));
        return raw.data;
      }
    } catch (e) {
      console.warn("Frappe updateDoctor failed, fallback", e);
    }
  }
  const docs = JSON.parse(localStorage.getItem('hospital_doctors')) || MOCK_DOCTORS;
  const idx = docs.findIndex(d => d.name === doctorName);
  if (idx === -1) throw new Error(`Doctor ${doctorName} not found.`);
  docs[idx] = { ...docs[idx], ...doctorData };
  localStorage.setItem('hospital_doctors', JSON.stringify(docs));
  return docs[idx];
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
        return raw.data;
      }
    } catch (e) {
      console.warn("Frappe deactivateMedicine failed, fallback", e);
    }
  }
  return medsLocal[medicineName];
}

// Process Direct OTC checkout
export async function executeDirectSale(saleData) {
  initLocalStorage();
  const mode = await getDbMode();
  const invoiceNumber = `INV-OTC-${Math.floor(10000 + Math.random() * 90000)}`;
  const { customer_type, customer_name, mobile_number, age, gender, items, payment_method, pharmacist } = saleData;

  let patientName = customer_name;
  let patientMobile = mobile_number || "Walk-in Customer";
  
  if (customer_type === "Registered" && mobile_number) {
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
      allBatches = JSON.parse(localStorage.getItem('hospital_batches')) || [];
    }
  } else {
    allBatches = JSON.parse(localStorage.getItem('hospital_batches')) || [];
  }

  const dispensedReceipt = [];
  const todayStr = new Date().toISOString().split("T")[0];

  for (const item of items) {
    const { medicine_name, qty } = item;
    let qtyRemaining = qty;

    const activeBatches = allBatches
      .filter(b => b.medicine === medicine_name && new Date(b.exp_date) > new Date(todayStr) && b.current_stock > 0)
      .sort((a, b) => new Date(a.exp_date) - new Date(b.exp_date));

    const deductions = [];

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

      const medsLocal = JSON.parse(localStorage.getItem('hospital_medicines')) || INITIAL_MOCK_MEDICINES;
      const category = medsLocal[medicine_name]?.category || "Regular Medicine";

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

    dispensedReceipt.push({
      medicine_name,
      requested_qty: qty,
      dispensed_qty: qty - qtyRemaining,
      deductions
    });
  }

  if (isClient) {
    localStorage.setItem('hospital_batches', JSON.stringify(allBatches));
  }

  await getMedicines();

  return {
    invoiceNumber,
    dispensingDate: new Date().toISOString(),
    dispensedReceipt,
    customer: {
      type: customer_type,
      name: patientName,
      mobile: patientMobile,
      age,
      gender
    }
  };
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
          return data.users;
        }
      }
    } catch (err) {
      console.warn("Cloud staff fetch warning:", err);
    }
  }
  return [];
}

export async function createStaffUser(userData) {
  const cleanEmail = (userData.email || '').trim();
  const cleanMobile = (userData.mobile_no || '').trim();
  const cleanPassword = (userData.password || '').trim();

  // 1. Sync User credentials directly with Central Cloud Database API
  const manageRes = await fetch('/api/users/manage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: cleanEmail,
      password: cleanPassword,
      full_name: userData.full_name,
      mobile_no: cleanMobile,
      roles: userData.roles || [userData.role || 'Staff Member'],
      permissions: userData.permissions || [],
      department: userData.department,
      designation: userData.designation || userData.role,
      employee_id: userData.id
    })
  });

  const manageData = await manageRes.json();
  if (!manageRes.ok || !manageData.success) {
    throw new Error(manageData.error || manageData.message || 'Failed to create staff member in Central Cloud Database');
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
        status: 'Available'
      });
    } catch (docErr) {
      console.warn("Doctor registry sync warning:", docErr);
    }
  }

  return manageData.user || {
    id: userData.id || `USR-${Math.floor(100 + Math.random() * 900)}`,
    full_name: userData.full_name,
    email: cleanEmail,
    mobile_no: cleanMobile,
    roles: userData.roles || [userData.role || 'Staff Member'],
    department: userData.department || 'Clinical',
    designation: userData.designation || userData.role || 'Staff'
  };
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

  return true;
}
