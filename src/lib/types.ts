// Field names mirror Frappe DocTypes (snake_case) so records pass through unmapped.

export interface Patient {
  patient_name: string
  mobile_number: string
  email: string
  gender: "Male" | "Female" | "Other"
  age: number | ""
  medical_history: string
}

export type WorkflowStatus =
  | "Reception"
  | "Doctor Consultation"
  | "Lab Test"
  | "Pharmacy"
  | "Billing"
  | "Completed"

export const WORKFLOW_STEPS: WorkflowStatus[] = [
  "Reception",
  "Doctor Consultation",
  "Lab Test",
  "Pharmacy",
  "Billing",
  "Completed",
]

export interface WalkIn {
  name: string
  patient_name: string
  mobile_number: string
  patient: string
  is_existing: 0 | 1
  doctor: string
  appointment_status: WorkflowStatus
  diagnosis: string
  prescription: string
  need_lab_test: 0 | 1
  lab_test_name: string
  lab_test_status: "Pending" | "Completed"
  lab_result: string
  need_medicines: 0 | 1
  pharmacy_status: "Pending" | "Completed"
  bill_amount: number
  payment_received: 0 | 1
  payment_method: "" | "Cash" | "Card" | "UPI"
  creation?: string
}

export interface Doctor {
  doctor_name: string
  specialization: string
  consultation_fee: number
}

export interface LabTest {
  test_name: string
  fee: number
}

export interface Appointment {
  name: string
  patient_name: string
  mobile_number: string
  doctor: string
  appointment_date: string // YYYY-MM-DD
  appointment_time: string
  notes: string
  status: "Scheduled" | "Checked In" | "Cancelled"
}

export interface AuditEntry {
  name: string
  timestamp: string
  role: string
  action: string
  entity_type: string
  entity_name: string
  details: string
}

export type Role =
  | "Admin"
  | "Receptionist"
  | "Doctor"
  | "Lab Technician"
  | "Pharmacist"
  | "Billing Staff"

export const ROLES: Role[] = [
  "Admin",
  "Receptionist",
  "Doctor",
  "Lab Technician",
  "Pharmacist",
  "Billing Staff",
]

// Which workflow panel each role may edit. Admin edits everything.
// ponytail: client-side gating only — real enforcement belongs in Frappe role permissions.
export const ROLE_EDITS: Record<Role, WorkflowStatus[]> = {
  Admin: WORKFLOW_STEPS,
  Receptionist: ["Reception"],
  Doctor: ["Doctor Consultation"],
  "Lab Technician": ["Lab Test"],
  Pharmacist: ["Pharmacy"],
  "Billing Staff": ["Billing"],
}

export const PHARMACY_FLAT_FEE = 250 // ponytail: flat dispense fee until medicine-level pricing exists
