import { createContext, useCallback, useContext, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { toast } from "sonner"
import * as api from "@/lib/api"
import {
  MOCK_APPOINTMENTS,
  MOCK_DOCTORS,
  MOCK_LAB_TESTS,
  MOCK_PATIENTS,
  MOCK_QUEUE,
} from "@/lib/mock"
import type {
  Appointment,
  AuditEntry,
  Doctor,
  LabTest,
  Patient,
  Role,
  WalkIn,
} from "@/lib/types"
import { PHARMACY_FLAT_FEE } from "@/lib/types"

interface Store {
  connected: boolean
  role: Role
  setRole: (r: Role) => void
  patients: Record<string, Patient>
  queue: WalkIn[]
  doctors: Doctor[]
  labTests: LabTest[]
  appointments: Appointment[]
  audit: AuditEntry[]
  selectedName: string | null
  setSelectedName: (n: string | null) => void
  selected: WalkIn | null
  connect: (usr: string, pwd: string) => Promise<void>
  disconnect: () => void
  refresh: () => Promise<void>
  registerWalkIn: (p: Patient, doctor: string) => Promise<void>
  saveConsultation: (
    d: Pick<WalkIn, "diagnosis" | "prescription" | "need_lab_test" | "lab_test_name" | "need_medicines">
  ) => Promise<void>
  saveLabResult: (result: string) => Promise<void>
  dispensePharmacy: () => Promise<void>
  computeBill: (w: WalkIn) => { label: string; amount: number }[]
  recordPayment: (method: "Cash" | "Card" | "UPI") => Promise<void>
  scheduleAppointment: (a: Omit<Appointment, "name" | "status">) => Promise<void>
  cancelAppointment: (name: string) => Promise<void>
  checkInAppointment: (name: string) => Promise<void>
}

const Ctx = createContext<Store | null>(null)

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error("useStore outside provider")
  return s
}

let localSeq = 1
const localId = (prefix: string) =>
  `${prefix}-${new Date().getFullYear()}-${String(++localSeq).padStart(5, "0")}`

export function StoreProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false)
  const [role, setRole] = useState<Role>("Admin")
  const [patients, setPatients] = useState<Record<string, Patient>>(structuredClone(MOCK_PATIENTS))
  const [queue, setQueue] = useState<WalkIn[]>(structuredClone(MOCK_QUEUE))
  const [doctors, setDoctors] = useState<Doctor[]>(MOCK_DOCTORS)
  const [labTests, setLabTests] = useState<LabTest[]>(MOCK_LAB_TESTS)
  const [appointments, setAppointments] = useState<Appointment[]>(structuredClone(MOCK_APPOINTMENTS))
  const [audit, setAudit] = useState<AuditEntry[]>([])
  const [selectedName, setSelectedName] = useState<string | null>(MOCK_QUEUE[0]?.name ?? null)

  const selected = useMemo(
    () => queue.find((q) => q.name === selectedName) ?? null,
    [queue, selectedName]
  )

  const log = useCallback(
    (action: string, entity_type: string, entity_name: string, details: string) => {
      const entry: AuditEntry = {
        name: localId("AUD"),
        timestamp: new Date().toISOString(),
        role,
        action,
        entity_type,
        entity_name,
        details,
      }
      setAudit((a) => [entry, ...a])
      if (connected) {
        // Fire-and-forget: audit write failure must not block clinical workflow
        api
          .insertDoc("Hospital Audit Log", {
            role,
            action,
            entity_type,
            entity_name,
            details,
          })
          .catch(() => {})
      }
    },
    [connected, role]
  )

  const refresh = useCallback(async () => {
    if (!connected) return
    const [pats, walkins, docs, tests, appts, auditRows] = await Promise.all([
      api.getList<Patient>("Hospital Patient"),
      api.getList<WalkIn>("Hospital Patient Walk In"),
      api.getList<Doctor>("Hospital Doctor", "doctor_name asc"),
      api.getList<LabTest>("Hospital Lab Test", "test_name asc").catch(() => MOCK_LAB_TESTS),
      api.getList<Appointment>("Hospital Appointment").catch(() => [] as Appointment[]),
      api.getList<AuditEntry>("Hospital Audit Log").catch(() => [] as AuditEntry[]),
    ])
    setPatients(Object.fromEntries(pats.map((p) => [p.mobile_number, p])))
    setQueue(walkins)
    if (docs.length) setDoctors(docs)
    setLabTests(tests)
    setAppointments(appts)
    if (auditRows.length) setAudit(auditRows)
  }, [connected])

  const connect = useCallback(
    async (usr: string, pwd: string) => {
      await api.login(usr, pwd)
      setConnected(true)
      const [pats, walkins, docs] = await Promise.all([
        api.getList<Patient>("Hospital Patient"),
        api.getList<WalkIn>("Hospital Patient Walk In"),
        api.getList<Doctor>("Hospital Doctor", "doctor_name asc"),
      ])
      setPatients(Object.fromEntries(pats.map((p) => [p.mobile_number, p])))
      setQueue(walkins)
      if (docs.length) setDoctors(docs)
      api.getList<LabTest>("Hospital Lab Test", "test_name asc").then(setLabTests).catch(() => {})
      api.getList<Appointment>("Hospital Appointment").then(setAppointments).catch(() => {})
      api.getList<AuditEntry>("Hospital Audit Log").then((r) => r.length && setAudit(r)).catch(() => {})
      toast.success("Connected to Frappe Bench")
    },
    []
  )

  const disconnect = useCallback(() => {
    setConnected(false)
    toast.info("Switched to offline simulator database")
  }, [])

  const upsertWalkIn = useCallback(
    async (name: string, patch: Partial<WalkIn>) => {
      if (connected) {
        const updated = await api.updateDoc<WalkIn>("Hospital Patient Walk In", name, patch)
        setQueue((q) => q.map((w) => (w.name === name ? { ...w, ...updated } : w)))
      } else {
        setQueue((q) => q.map((w) => (w.name === name ? { ...w, ...patch } : w)))
      }
    },
    [connected]
  )

  const registerWalkIn = useCallback(
    async (p: Patient, doctor: string) => {
      const isExisting = Boolean(patients[p.mobile_number])
      // Upsert patient
      if (connected) {
        if (isExisting) {
          await api.updateDoc("Hospital Patient", p.mobile_number, p)
        } else {
          await api.insertDoc("Hospital Patient", p)
        }
      }
      setPatients((ps) => ({ ...ps, [p.mobile_number]: { ...ps[p.mobile_number], ...p } }))

      const walkin: Omit<WalkIn, "name"> = {
        patient_name: p.patient_name,
        mobile_number: p.mobile_number,
        patient: p.mobile_number,
        is_existing: isExisting ? 1 : 0,
        doctor,
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
      }
      let created: WalkIn
      if (connected) {
        created = await api.insertDoc<WalkIn>("Hospital Patient Walk In", walkin)
      } else {
        created = { ...walkin, name: localId("HOSP-WALK") }
      }
      setQueue((q) => [created, ...q])
      setSelectedName(created.name)
      log("Register", "Walk In", created.name, `${p.patient_name} → ${doctor}`)
      toast.success(`${p.patient_name} registered and queued for ${doctor}`)
    },
    [connected, patients, log]
  )

  const saveConsultation: Store["saveConsultation"] = useCallback(
    async (d) => {
      if (!selected) return
      const next = d.need_lab_test ? "Lab Test" : d.need_medicines ? "Pharmacy" : "Billing"
      await upsertWalkIn(selected.name, { ...d, appointment_status: next })
      log("Consultation", "Walk In", selected.name, `Diagnosis: ${d.diagnosis}`)
      toast.success(`Consultation saved — routed to ${next}`)
    },
    [selected, upsertWalkIn, log]
  )

  const saveLabResult = useCallback(
    async (result: string) => {
      if (!selected) return
      const next = selected.need_medicines ? "Pharmacy" : "Billing"
      await upsertWalkIn(selected.name, {
        lab_result: result,
        lab_test_status: "Completed",
        appointment_status: next,
      })
      log("Lab Result", "Walk In", selected.name, selected.lab_test_name)
      toast.success(`Lab result recorded — routed to ${next}`)
    },
    [selected, upsertWalkIn, log]
  )

  const dispensePharmacy = useCallback(async () => {
    if (!selected) return
    await upsertWalkIn(selected.name, {
      pharmacy_status: "Completed",
      appointment_status: "Billing",
    })
    log("Dispense", "Walk In", selected.name, "Medicines dispensed")
    toast.success("Medicines dispensed — routed to Billing")
  }, [selected, upsertWalkIn, log])

  const computeBill = useCallback(
    (w: WalkIn) => {
      const items: { label: string; amount: number }[] = []
      const doc = doctors.find((d) => d.doctor_name === w.doctor)
      items.push({ label: `Consultation — ${w.doctor}`, amount: doc?.consultation_fee ?? 0 })
      if (w.need_lab_test) {
        const t = labTests.find((t) => t.test_name === w.lab_test_name)
        items.push({ label: `Lab — ${w.lab_test_name}`, amount: t?.fee ?? 0 })
      }
      if (w.need_medicines) {
        items.push({ label: "Pharmacy — dispensed medicines", amount: PHARMACY_FLAT_FEE })
      }
      return items
    },
    [doctors, labTests]
  )

  const recordPayment = useCallback(
    async (method: "Cash" | "Card" | "UPI") => {
      if (!selected) return
      const total = computeBill(selected).reduce((s, i) => s + i.amount, 0)
      await upsertWalkIn(selected.name, {
        bill_amount: total,
        payment_received: 1,
        payment_method: method,
        appointment_status: "Completed",
      })
      // Append visit summary to patient's medical history
      const patient = patients[selected.mobile_number]
      if (patient) {
        const summary = `Visit Date: ${new Date().toISOString().slice(0, 10)}
Diagnosis: ${selected.diagnosis || "N/A"}
Prescription: ${selected.prescription || "None"}
Lab Report: ${selected.need_lab_test ? `${selected.lab_test_name} — ${selected.lab_result}` : "None"}
Status: Completed.`
        const medical_history = summary + (patient.medical_history ? `\n\n${patient.medical_history}` : "")
        if (connected) {
          await api.updateDoc("Hospital Patient", patient.mobile_number, { medical_history })
        }
        setPatients((ps) => ({
          ...ps,
          [patient.mobile_number]: { ...ps[patient.mobile_number], medical_history },
        }))
      }
      log("Payment", "Walk In", selected.name, `₹${total} via ${method}`)
      toast.success(`Payment of ₹${total} recorded via ${method}`)
    },
    [selected, computeBill, upsertWalkIn, patients, connected, log]
  )

  const scheduleAppointment = useCallback(
    async (a: Omit<Appointment, "name" | "status">) => {
      let created: Appointment
      if (connected) {
        created = await api.insertDoc<Appointment>("Hospital Appointment", {
          ...a,
          status: "Scheduled",
        })
      } else {
        created = { ...a, name: localId("HOSP-APPT"), status: "Scheduled" }
      }
      setAppointments((list) => [created, ...list])
      log("Schedule", "Appointment", created.name, `${a.patient_name} — ${a.appointment_date} ${a.appointment_time}`)
      toast.success(`Appointment booked for ${a.patient_name} on ${a.appointment_date}`)
    },
    [connected, log]
  )

  const setApptStatus = useCallback(
    async (name: string, status: Appointment["status"]) => {
      if (connected) await api.updateDoc("Hospital Appointment", name, { status })
      setAppointments((list) => list.map((x) => (x.name === name ? { ...x, status } : x)))
    },
    [connected]
  )

  const cancelAppointment = useCallback(
    async (name: string) => {
      await setApptStatus(name, "Cancelled")
      log("Cancel", "Appointment", name, "Appointment cancelled")
      toast.info("Appointment cancelled")
    },
    [setApptStatus, log]
  )

  const checkInAppointment = useCallback(
    async (name: string) => {
      const appt = appointments.find((a) => a.name === name)
      if (!appt) return
      const patient: Patient = patients[appt.mobile_number] ?? {
        patient_name: appt.patient_name,
        mobile_number: appt.mobile_number,
        email: "",
        gender: "Male",
        age: "",
        medical_history: "",
      }
      await registerWalkIn(patient, appt.doctor)
      await setApptStatus(name, "Checked In")
    },
    [appointments, patients, registerWalkIn, setApptStatus]
  )

  const value: Store = {
    connected,
    role,
    setRole,
    patients,
    queue,
    doctors,
    labTests,
    appointments,
    audit,
    selectedName,
    setSelectedName,
    selected,
    connect,
    disconnect,
    refresh,
    registerWalkIn,
    saveConsultation,
    saveLabResult,
    dispensePharmacy,
    computeBill,
    recordPayment,
    scheduleAppointment,
    cancelAppointment,
    checkInAppointment,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
