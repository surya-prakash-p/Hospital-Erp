// Data Access Layer for Thangam Hospital ERP
// Handles communication with Frappe API Proxy with automatic fallback to localStorage Simulator Mode

const MOCK_DOCTORS = [
  { name: "Dr. Rajesh", doctor_name: "Dr. Rajesh", specialization: "General Physician", consultation_fee: 500 },
  { name: "Dr. Priya", doctor_name: "Dr. Priya", specialization: "Cardiologist", consultation_fee: 1000 },
  { name: "Dr. Vignesh", doctor_name: "Dr. Vignesh", specialization: "Pediatrician", consultation_fee: 600 }
];

const MOCK_LAB_TESTS = [
  { test_name: "Complete Blood Count (CBC)", fee: 450 },
  { test_name: "Blood Sugar (Fasting)", fee: 250 },
  { test_name: "Lipid Profile", fee: 800 },
  { test_name: "Liver Function Test", fee: 900 },
  { test_name: "Thyroid Profile (T3 T4 TSH)", fee: 700 }
];

const INITIAL_MOCK_MEDICINES = {
  "Paracetamol 650mg": { name: "Paracetamol 650mg", medicine_name: "Paracetamol 650mg", generic_name: "Paracetamol", batch_number: "BATCH001", mfg_date: "2024-01-01", exp_date: "2026-12-31", shelf_life: "36 Months", manufacturer: "Micro Labs", supplier: "ABC Pharma", category: "Tablet", strength: "650 mg", pack_size: "15 Tablets", purchase_price: 18, mrp: 35, price: 20, opening_stock: 500, stock: 100, reorder_level: 150, rack_location: "Rack A-02", storage: "Room Temperature", barcode: "8901234567890", is_recalled: 0 },
  "Pantocid 40mg": { name: "Pantocid 40mg", medicine_name: "Pantocid 40mg", generic_name: "Pantoprazole", batch_number: "BATCH002", mfg_date: "2024-05-20", exp_date: "2027-05-20", shelf_life: "36 Months", manufacturer: "Sun Pharma", supplier: "XYZ Distributors", category: "Tablet", strength: "40 mg", pack_size: "10 Tablets", purchase_price: 100, mrp: 140, price: 120, opening_stock: 300, stock: 150, reorder_level: 50, rack_location: "Rack B-01", storage: "Cool and Dry", barcode: "8901234567891", is_recalled: 0 },
  "Amoxicillin 500mg": { name: "Amoxicillin 500mg", medicine_name: "Amoxicillin 500mg", generic_name: "Amoxicillin", batch_number: "BATCH003", mfg_date: "2024-08-15", exp_date: "2026-08-15", shelf_life: "24 Months", manufacturer: "GSK", supplier: "Pharma Plus", category: "Capsule", strength: "500 mg", pack_size: "10 Capsules", purchase_price: 80, mrp: 110, price: 95, opening_stock: 200, stock: 80, reorder_level: 100, rack_location: "Rack C-03", storage: "Room Temperature", barcode: "8901234567892", is_recalled: 0 },
  "Cetirizine 10mg": { name: "Cetirizine 10mg", medicine_name: "Cetirizine 10mg", generic_name: "Cetirizine", batch_number: "BATCH004", mfg_date: "2024-07-25", exp_date: "2026-07-25", shelf_life: "24 Months", manufacturer: "Cipla", supplier: "City Meds", category: "Tablet", strength: "10 mg", pack_size: "10 Tablets", purchase_price: 10, mrp: 20, price: 15, opening_stock: 400, stock: 200, reorder_level: 50, rack_location: "Rack A-01", storage: "Room Temperature", barcode: "8901234567893", is_recalled: 0 },
  "Ibuprofen 400mg": { name: "Ibuprofen 400mg", medicine_name: "Ibuprofen 400mg", generic_name: "Ibuprofen", batch_number: "BATCH005", mfg_date: "2024-02-10", exp_date: "2026-07-10", shelf_life: "24 Months", manufacturer: "Abbott", supplier: "ABC Pharma", category: "Tablet", strength: "400 mg", pack_size: "10 Tablets", purchase_price: 25, mrp: 40, price: 30, opening_stock: 200, stock: 120, reorder_level: 60, rack_location: "Rack D-02", storage: "Room Temperature", barcode: "8901234567894", is_recalled: 0 },
  "Expired Med Example": { name: "Expired Med Example", medicine_name: "Expired Med Example", generic_name: "Old Pill", batch_number: "BATCH006", mfg_date: "2022-01-01", exp_date: "2024-01-01", shelf_life: "24 Months", manufacturer: "Test Labs", supplier: "Test Supp", category: "Tablet", strength: "10 mg", pack_size: "10 Tablets", purchase_price: 5, mrp: 10, price: 8, opening_stock: 50, stock: 20, reorder_level: 10, rack_location: "Rack E-01", storage: "Room Temperature", barcode: "8901234567895", is_recalled: 0 }
};

const INITIAL_MOCK_PATIENTS = {
  "9876543210": {
    patient_name: "Surya Prakash",
    mobile_number: "9876543210",
    email: "surya@example.com",
    gender: "Male",
    age: 24,
    medical_history: `Visit Date: 2026-05-10
Diagnosis: Mild Seasonal Influenza
Prescription: Paracetamol 650mg twice daily for 3 days.
Lab Report: None.
Status: Completed.

Visit Date: 2026-02-15
Diagnosis: Dry Cough
Prescription: Cough Syrup 10ml thrice daily for 5 days.
Lab Report: None.
Status: Completed.`
  },
  "9876501234": {
    patient_name: "Yokesh Raj",
    mobile_number: "9876501234",
    email: "yokesh@example.com",
    gender: "Male",
    age: 28,
    medical_history: `Visit Date: 2026-06-01
Diagnosis: Acute Gastritis
Prescription: Pantoprazole 40mg before breakfast for 5 days.
Lab Report: Hemoglobin & CBC (Normal).
Status: Completed.`
  }
};

const INITIAL_MOCK_QUEUE = [
  {
    name: "HOSP-WALK-2026-00001",
    patient_name: "Surya Prakash",
    mobile_number: "9876543210",
    patient: "9876543210",
    is_existing: 1,
    doctor: "Dr. Rajesh",
    appointment_status: "Doctor Consultation",
    diagnosis: "",
    prescription: "",
    need_lab_test: 0,
    lab_test_name: "",
    lab_test_status: "Pending",
    lab_result: "",
    need_medicines: 0,
    pharmacy_status: "Pending",
    bill_amount: 0,
    payment_received: 0,
    payment_method: ""
  }
];

// Helper to check if we are in client browser environment
const isClient = typeof window !== 'undefined';

// Local storage init
function initLocalStorage() {
  if (!isClient) return;
  if (!localStorage.getItem('hospital_patients')) {
    localStorage.setItem('hospital_patients', JSON.stringify(INITIAL_MOCK_PATIENTS));
  }
  if (!localStorage.getItem('hospital_queue')) {
    localStorage.setItem('hospital_queue', JSON.stringify(INITIAL_MOCK_QUEUE));
  }
  if (!localStorage.getItem('hospital_doctors')) {
    localStorage.setItem('hospital_doctors', JSON.stringify(MOCK_DOCTORS));
  }
  if (!localStorage.getItem('hospital_lab_tests')) {
    localStorage.setItem('hospital_lab_tests', JSON.stringify(MOCK_LAB_TESTS));
  }
  if (!localStorage.getItem('hospital_medicines')) {
    localStorage.setItem('hospital_medicines', JSON.stringify(INITIAL_MOCK_MEDICINES));
  }
}

// Check database mode. Returns true if Frappe server is responding, false otherwise
export async function checkConnection() {
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

// Get Database Mode from session/localStorage if saved, or dynamic check
export async function getDbMode() {
  return 'frappe';
}

export function setDbMode(mode) {
  // Disallowed connection changes for production stability
}

// Fetch all doctors
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

// Add a new doctor
export async function createDoctor(doctorData) {
  initLocalStorage();
  const mode = await getDbMode();
  if (mode === 'frappe') {
    try {
      const res = await fetch('/api/resource/Hospital Doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doctorData)
      });
      if (res.ok) {
        const raw = await res.json();
        // Sync local storage copy
        const docs = JSON.parse(localStorage.getItem('hospital_doctors')) || MOCK_DOCTORS;
        docs.push(raw.data);
        localStorage.setItem('hospital_doctors', JSON.stringify(docs));
        return raw.data;
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create doctor in Frappe.');
      }
    } catch (e) {
      console.warn("Frappe createDoctor failed, fallback to simulator", e);
      if (e.message && e.message.includes('Failed to create')) throw e;
    }
  }

  const docs = JSON.parse(localStorage.getItem('hospital_doctors')) || MOCK_DOCTORS;
  const newDoc = {
    name: doctorData.doctor_name,
    ...doctorData
  };
  docs.push(newDoc);
  localStorage.setItem('hospital_doctors', JSON.stringify(docs));
  return newDoc;
}

// Fetch all lab tests catalog
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
      console.warn("Frappe getLabTests failed, fallback to simulator", e);
    }
  }
  return JSON.parse(localStorage.getItem('hospital_lab_tests')) || MOCK_LAB_TESTS;
}

// Fetch all patients
export async function getPatients() {
  initLocalStorage();
  const mode = await getDbMode();
  if (mode === 'frappe') {
    try {
      const res = await fetch('/api/resource/Hospital Patient?fields=["*"]&limit=100');
      if (res.ok) {
        const raw = await res.json();
        const patientMap = {};
        (raw.data || []).forEach(p => {
          patientMap[p.mobile_number] = p;
        });
        return patientMap;
      }
    } catch (e) {
      console.warn("Frappe getPatients failed, fallback to simulator", e);
    }
  }
  return JSON.parse(localStorage.getItem('hospital_patients')) || INITIAL_MOCK_PATIENTS;
}

// Fetch a single patient by mobile number
export async function getPatient(mobileNumber) {
  initLocalStorage();
  const mode = await getDbMode();
  if (mode === 'frappe') {
    try {
      const res = await fetch(`/api/resource/Hospital Patient/${mobileNumber}`);
      if (res.ok) {
        const raw = await res.json();
        return raw.data;
      }
    } catch (e) {
      console.warn(`Frappe getPatient ${mobileNumber} failed, fallback to simulator`, e);
    }
  }
  const patients = JSON.parse(localStorage.getItem('hospital_patients')) || INITIAL_MOCK_PATIENTS;
  return patients[mobileNumber] || null;
}

// Search patient by mobile number or name
export async function searchPatient(query) {
  initLocalStorage();
  if (!query) return null;
  const mode = await getDbMode();
  if (mode === 'frappe') {
    try {
      // Direct query by Mobile Number
      const resById = await fetch(`/api/resource/Hospital Patient/${query}`);
      if (resById.ok) {
        const raw = await resById.json();
        return raw.data;
      }
      
      // Or Search by Name
      const filterStr = JSON.stringify([["Hospital Patient", "patient_name", "like", `%${query}%`]]);
      const resByName = await fetch(`/api/resource/Hospital Patient?filters=${encodeURIComponent(filterStr)}&fields=["*"]`);
      if (resByName.ok) {
        const raw = await resByName.json();
        if (raw.data && raw.data.length > 0) {
          return raw.data[0];
        }
      }
    } catch (e) {
      console.warn("Frappe searchPatient failed, fallback to simulator", e);
    }
  }

  const patients = JSON.parse(localStorage.getItem('hospital_patients')) || INITIAL_MOCK_PATIENTS;
  const foundByMobile = patients[query];
  if (foundByMobile) return foundByMobile;

  const foundByName = Object.values(patients).find(p => p.patient_name.toLowerCase().includes(query.toLowerCase()));
  return foundByName || null;
}

// Create a new patient card
export async function createPatient(patientData) {
  initLocalStorage();
  const mode = await getDbMode();
  if (mode === 'frappe') {
    try {
      // First check if the patient already exists in Frappe
      const checkRes = await fetch(`/api/resource/Hospital Patient/${patientData.mobile_number}`);
      if (checkRes.ok) {
        const rawCheck = await checkRes.json();
        // Patient exists, return it
        return rawCheck.data;
      }

      // If not, proceed to create it
      const res = await fetch('/api/resource/Hospital Patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: patientData.patient_name,
          mobile_number: patientData.mobile_number,
          email: patientData.email || '',
          gender: patientData.gender || 'Male',
          age: patientData.age ? parseInt(patientData.age) : null,
          height: patientData.height || '',
          weight: patientData.weight || '',
          blood_group: patientData.blood_group || '',
          temperature: patientData.temperature || '',
          bp: patientData.bp || '',
          pulse: patientData.pulse || '',
          resp_rate: patientData.resp_rate || '',
          spo2: patientData.spo2 || '',
          allergies: patientData.allergies || '',
          emergency_contact: patientData.emergency_contact || '',
          medical_history: patientData.medical_history || ''
        })
      });
      if (res.ok) {
        const raw = await res.json();
        // Sync local storage copy too
        const patients = JSON.parse(localStorage.getItem('hospital_patients')) || INITIAL_MOCK_PATIENTS;
        patients[patientData.mobile_number] = raw.data;
        localStorage.setItem('hospital_patients', JSON.stringify(patients));
        return raw.data;
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create patient in Frappe.');
      }
    } catch (e) {
      console.warn("Frappe createPatient failed, fallback to simulator", e);
      if (e.message && e.message.includes('Failed to create')) throw e;
    }
  }

  const patients = JSON.parse(localStorage.getItem('hospital_patients')) || INITIAL_MOCK_PATIENTS;
  if (patients[patientData.mobile_number]) {
    return patients[patientData.mobile_number];
  }

  const newPatient = {
    patient_name: patientData.patient_name,
    mobile_number: patientData.mobile_number,
    email: patientData.email || '',
    gender: patientData.gender || 'Male',
    age: patientData.age ? parseInt(patientData.age) : null,
    height: patientData.height || '',
    weight: patientData.weight || '',
    blood_group: patientData.blood_group || '',
    temperature: patientData.temperature || '',
    bp: patientData.bp || '',
    pulse: patientData.pulse || '',
    resp_rate: patientData.resp_rate || '',
    spo2: patientData.spo2 || '',
    allergies: patientData.allergies || '',
    emergency_contact: patientData.emergency_contact || '',
    medical_history: patientData.medical_history || ''
  };
  patients[patientData.mobile_number] = newPatient;
  localStorage.setItem('hospital_patients', JSON.stringify(patients));
  return newPatient;
}

// Update a patient history
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
        // Sync local copy
        const patients = JSON.parse(localStorage.getItem('hospital_patients')) || INITIAL_MOCK_PATIENTS;
        if (patients[mobileNumber]) {
          patients[mobileNumber].medical_history = medicalHistory;
          localStorage.setItem('hospital_patients', JSON.stringify(patients));
        }
        return raw.data;
      }
    } catch (e) {
      console.warn(`Frappe updatePatientHistory failed for ${mobileNumber}, fallback to simulator`, e);
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

// Get all walk-in queue records
export async function getQueue() {
  initLocalStorage();
  const mode = await getDbMode();
  if (mode === 'frappe') {
    try {
      const res = await fetch('/api/resource/Hospital Patient Walk In?fields=["*"]&limit=100&order_by=creation asc');
      if (res.ok) {
        const raw = await res.json();
        const frappeData = raw.data || [];
        const local = JSON.parse(localStorage.getItem('hospital_queue')) || [];
        // Merge Frappe data with local data to preserve frontend-only fields like dispensed_medicines
        const merged = frappeData.map(fItem => {
          const lItem = local.find(l => l.name === fItem.name);
          if (lItem) {
            return { ...fItem, pharmacy_bill_amount: lItem.pharmacy_bill_amount || fItem.pharmacy_bill_amount, dispensed_medicines: lItem.dispensed_medicines || fItem.dispensed_medicines };
          }
          return fItem;
        });
        return merged.length > 0 ? merged : INITIAL_MOCK_QUEUE;
      }
    } catch (e) {
      console.warn("Frappe getQueue failed, fallback to simulator", e);
    }
  }
  return JSON.parse(localStorage.getItem('hospital_queue')) || INITIAL_MOCK_QUEUE;
}

// Create a new walk-in record
export async function createWalkIn(walkInData) {
  initLocalStorage();
  const mode = await getDbMode();
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
        // Sync local storage copy (append to the end for asc order)
        const local = JSON.parse(localStorage.getItem('hospital_queue')) || INITIAL_MOCK_QUEUE;
        localStorage.setItem('hospital_queue', JSON.stringify([...local, raw.data]));
        return raw.data;
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create walk-in in Frappe.');
      }
    } catch (e) {
      console.warn("Frappe createWalkIn failed, fallback to simulator", e);
      if (e.message && e.message.includes('Failed to create')) throw e;
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
    diagnosis: "",
    prescription: "",
    need_lab_test: 0,
    lab_test_name: "",
    lab_test_status: "Pending",
    lab_result: "",
    need_medicines: 0,
    pharmacy_status: "Pending",
    bill_amount: 0,
    payment_received: 0,
    payment_method: ""
  };
  queue.push(newWalkIn);
  localStorage.setItem('hospital_queue', JSON.stringify(queue));
  return newWalkIn;
}

// Update a walk-in record (diagnosis, lab results, dispense, settle bill etc.)
export async function updateWalkIn(name, updateData) {
  initLocalStorage();
  const mode = await getDbMode();
  if (mode === 'frappe') {
    try {
      const res = await fetch(`/api/resource/Hospital Patient Walk In/${name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (res.ok) {
        const raw = await res.json();
        // Sync local copy
        const queue = JSON.parse(localStorage.getItem('hospital_queue')) || INITIAL_MOCK_QUEUE;
        const updatedQueue = queue.map(q => {
          if (q.name === name) return { ...q, ...updateData };
          return q;
        });
        localStorage.setItem('hospital_queue', JSON.stringify(updatedQueue));
        return raw.data;
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update walk-in in Frappe.');
      }
    } catch (e) {
      console.warn(`Frappe updateWalkIn failed for ${name}, fallback to simulator`, e);
      if (e.message && e.message.includes('Failed to update')) throw e;
    }
  }

  const queue = JSON.parse(localStorage.getItem('hospital_queue')) || INITIAL_MOCK_QUEUE;
  const updatedQueue = queue.map(q => {
    if (q.name === name) {
      return { ...q, ...updateData };
    }
    return q;
  });
  localStorage.setItem('hospital_queue', JSON.stringify(updatedQueue));
  return updatedQueue.find(q => q.name === name) || null;
}

// Get list of all medicines in inventory
export async function getMedicines() {
  initLocalStorage();
  const mode = await getDbMode();
  if (mode === 'frappe') {
    try {
      const res = await fetch('/api/resource/Hospital Medicine?fields=["*"]&limit=100');
      if (res.ok) {
        const raw = await res.json();
        // Sync local storage copy too
        const localMeds = {};
        raw.data.forEach(med => {
          localMeds[med.medicine_name] = med;
        });
        localStorage.setItem('hospital_medicines', JSON.stringify(localMeds));
        return raw.data;
      }
    } catch (e) {
      console.warn("Frappe getMedicines failed, fallback to simulator", e);
    }
  }
  const meds = JSON.parse(localStorage.getItem('hospital_medicines')) || INITIAL_MOCK_MEDICINES;
  return Object.values(meds);
}

// Add a new medicine to inventory
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
        // Sync local storage copy
        const meds = JSON.parse(localStorage.getItem('hospital_medicines')) || INITIAL_MOCK_MEDICINES;
        meds[medicineData.medicine_name] = raw.data;
        localStorage.setItem('hospital_medicines', JSON.stringify(meds));
        return raw.data;
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create medicine in Frappe.');
      }
    } catch (e) {
      console.warn("Frappe createMedicine failed, fallback to simulator", e);
      if (e.message && e.message.includes('Failed to create')) throw e;
    }
  }

  const meds = JSON.parse(localStorage.getItem('hospital_medicines')) || INITIAL_MOCK_MEDICINES;
  const newMed = {
    name: medicineData.medicine_name,
    ...medicineData
  };
  meds[newMed.medicine_name] = newMed;
  localStorage.setItem('hospital_medicines', JSON.stringify(meds));
  return newMed;
}

// Update medicine stock level
export async function updateMedicineStock(medicineName, qtyChange) {
  initLocalStorage();
  const mode = await getDbMode();
  
  // Find current stock locally first
  const meds = JSON.parse(localStorage.getItem('hospital_medicines')) || INITIAL_MOCK_MEDICINES;
  const currentMed = meds[medicineName];
  if (!currentMed) {
    throw new Error(`Medicine ${medicineName} not found in inventory.`);
  }
  
  const newStock = Math.max(0, currentMed.stock + qtyChange);
  
  if (mode === 'frappe') {
    try {
      const res = await fetch(`/api/resource/Hospital Medicine/${encodeURIComponent(medicineName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock })
      });
      if (res.ok) {
        const raw = await res.json();
        meds[medicineName] = raw.data;
        localStorage.setItem('hospital_medicines', JSON.stringify(meds));
        return raw.data;
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update medicine stock in Frappe.');
      }
    } catch (e) {
      console.warn(`Frappe updateMedicineStock failed for ${medicineName}, fallback to simulator`, e);
      if (e.message && e.message.includes('Failed to update')) throw e;
    }
  }

  meds[medicineName] = { ...currentMed, stock: newStock };
  localStorage.setItem('hospital_medicines', JSON.stringify(meds));
  return meds[medicineName];
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
        // Sync local storage copy
        const meds = JSON.parse(localStorage.getItem('hospital_medicines')) || INITIAL_MOCK_MEDICINES;
        meds[medicineName] = { ...meds[medicineName], ...raw.data };
        localStorage.setItem('hospital_medicines', JSON.stringify(meds));
        return raw.data;
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update medicine details in Frappe.');
      }
    } catch (e) {
      console.warn("Frappe updateMedicine failed, fallback to simulator", e);
      if (e.message && e.message.includes('Failed to update')) throw e;
    }
  }

  const meds = JSON.parse(localStorage.getItem('hospital_medicines')) || INITIAL_MOCK_MEDICINES;
  if (!meds[medicineName]) {
    throw new Error(`Medicine ${medicineName} not found.`);
  }
  meds[medicineName] = { ...meds[medicineName], ...medicineData };
  localStorage.setItem('hospital_medicines', JSON.stringify(meds));
  return meds[medicineName];
}

// Update patient profile details
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
        // Sync local storage copy
        const patients = JSON.parse(localStorage.getItem('hospital_patients')) || INITIAL_MOCK_PATIENTS;
        patients[mobileNumber] = { ...patients[mobileNumber], ...raw.data };
        localStorage.setItem('hospital_patients', JSON.stringify(patients));
        return raw.data;
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update patient profile in Frappe.');
      }
    } catch (e) {
      console.warn("Frappe updatePatient failed, fallback to simulator", e);
      if (e.message && e.message.includes('Failed to update')) throw e;
    }
  }

  const patients = JSON.parse(localStorage.getItem('hospital_patients')) || INITIAL_MOCK_PATIENTS;
  const current = patients[mobileNumber];
  if (!current) {
    throw new Error(`Patient ${mobileNumber} not found.`);
  }
  patients[mobileNumber] = { ...current, ...updateData };
  localStorage.setItem('hospital_patients', JSON.stringify(patients));
  return patients[mobileNumber];
}

// Update doctor profile details
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
        // Sync local storage copy
        const docs = JSON.parse(localStorage.getItem('hospital_doctors')) || MOCK_DOCTORS;
        const updatedDocs = docs.map(d => d.name === doctorName ? { ...d, ...raw.data } : d);
        localStorage.setItem('hospital_doctors', JSON.stringify(updatedDocs));
        return raw.data;
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update doctor details in Frappe.');
      }
    } catch (e) {
      console.warn("Frappe updateDoctor failed, fallback to simulator", e);
      if (e.message && e.message.includes('Failed to update')) throw e;
    }
  }

  const docs = JSON.parse(localStorage.getItem('hospital_doctors')) || MOCK_DOCTORS;
  const idx = docs.findIndex(d => d.name === doctorName);
  if (idx === -1) {
    throw new Error(`Doctor ${doctorName} not found.`);
  }
  docs[idx] = { ...docs[idx], ...doctorData };
  localStorage.setItem('hospital_doctors', JSON.stringify(docs));
  return docs[idx];
}
