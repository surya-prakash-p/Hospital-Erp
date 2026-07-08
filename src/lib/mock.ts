import type { Appointment, Doctor, LabTest, Patient, WalkIn } from "./types"

export const MOCK_DOCTORS: Doctor[] = [
  { doctor_name: "Dr. Rajesh", specialization: "General Physician", consultation_fee: 500 },
  { doctor_name: "Dr. Priya", specialization: "Cardiologist", consultation_fee: 1000 },
  { doctor_name: "Dr. Vignesh", specialization: "Pediatrician", consultation_fee: 600 },
]

export const MOCK_LAB_TESTS: LabTest[] = [
  { test_name: "Complete Blood Count (CBC)", fee: 450 },
  { test_name: "Blood Sugar (Fasting)", fee: 250 },
  { test_name: "Lipid Profile", fee: 800 },
  { test_name: "Liver Function Test", fee: 900 },
  { test_name: "Thyroid Profile (T3 T4 TSH)", fee: 700 },
]

export const MOCK_PATIENTS: Record<string, Patient> = {
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
Status: Completed.`,
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
Status: Completed.`,
  },
}

export const MOCK_QUEUE: WalkIn[] = [
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
    payment_method: "",
    creation: new Date().toISOString(),
  },
]

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    name: "HOSP-APPT-2026-00001",
    patient_name: "Yokesh Raj",
    mobile_number: "9876501234",
    doctor: "Dr. Priya",
    appointment_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    appointment_time: "10:30",
    notes: "Follow-up ECG review",
    status: "Scheduled",
  },
]
