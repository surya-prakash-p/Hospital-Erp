import React, { useState, useEffect } from 'react'
import {
  Heart, Search, UserPlus, Stethoscope, FlaskConical, Pill,
  CreditCard, CheckCircle, RefreshCw, Database, UserCheck,
  History, Plus, Server, ChevronRight, AlertCircle, LogIn, LogOut,
  Clock, Activity, Sparkles
} from 'lucide-react'

// Constants for Doctor Consultation Fees
const DOCTOR_FEES = {
  "Dr. Rajesh": 500,
  "Dr. Priya": 1000,
  "Dr. Vignesh": 600
}

// Initial Local Mock Data (for out-of-the-box offline mode)
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
}

const INITIAL_MOCK_APPOINTMENTS = [
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
]

function App() {
  // Navigation & UI State
  const [activeStep, setActiveStep] = useState("Reception") // Reception, Doctor, Lab, Pharmacy, Billing, Complete
  const [selectedQueueItem, setSelectedQueueItem] = useState(null)
  const [notification, setNotification] = useState(null)
  
  // Connection State
  const [useFrappe, setUseFrappe] = useState(false)
  const [frappeUrl, setFrappeUrl] = useState("http://localhost:8000")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [usr, setUsr] = useState("Administrator")
  const [pwd, setPwd] = useState("admin")
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Core Data Lists
  const [patients, setPatients] = useState(INITIAL_MOCK_PATIENTS)
  const [queue, setQueue] = useState(INITIAL_MOCK_APPOINTMENTS)
  
  // Database Visualizer Tab
  const [dbTab, setDbTab] = useState("Patients") // Patients, WalkIns

  // Form States
  // Reception form
  const [searchQuery, setSearchQuery] = useState("")
  const [receptionForm, setReceptionForm] = useState({
    patient_name: "",
    mobile_number: "",
    email: "",
    gender: "Male",
    age: "",
    doctor: "Dr. Rajesh",
    is_existing: false,
    medical_history: ""
  })
  
  // Doctor form
  const [doctorForm, setDoctorForm] = useState({
    doctor: "Dr. Rajesh",
    diagnosis: "",
    prescription: "",
    need_lab_test: false,
    lab_test_name: "Blood Routine",
    need_medicines: false
  })

  // Lab form
  const [labForm, setLabForm] = useState({
    lab_result: ""
  })

  // Pharmacy form
  const [pharmacyCost, setPharmacyCost] = useState(0)

  // Billing form
  const [paymentMethod, setPaymentMethod] = useState("UPI")

  // Auto-clear notification after 4s
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  // Sync data from Frappe if enabled
  useEffect(() => {
    if (useFrappe && isLoggedIn) {
      fetchFrappeData()
    }
  }, [useFrappe, isLoggedIn])

  // Helper to show custom status toast
  const showToast = (message, type = "info") => {
    setNotification({ text: message, type })
  }

  // Frappe API Methods
  const handleLogin = async (e) => {
    e.preventDefault()
    setIsConnecting(true)
    try {
      const res = await fetch("/api/method/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ usr, pwd })
      })

      if (res.ok) {
        setIsLoggedIn(true)
        setUseFrappe(true)
        setShowLoginModal(false)
        showToast("Connected to Frappe Database!", "success")
        // Load data from server
        await fetchFrappeData()
      } else {
        const err = await res.json()
        showToast(err.message || "Failed to login. Please verify password.", "error")
      }
    } catch (error) {
      showToast("Error connecting to Frappe bench. Is it running?", "error")
      console.error(error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUseFrappe(false)
    setPatients(INITIAL_MOCK_PATIENTS)
    setQueue(INITIAL_MOCK_APPOINTMENTS)
    showToast("Disconnected. Switched to Mock Local DB.", "info")
  }

  const fetchFrappeData = async () => {
    try {
      // 1. Fetch permanent Patients
      const resPatients = await fetch("/api/resource/Hospital Patient?fields=[\"*\"]&limit=100")
      if (resPatients.ok) {
        const rawP = await resPatients.json()
        const patientMap = {}
        rawP.data.forEach(p => {
          patientMap[p.mobile_number] = p
        })
        setPatients(patientMap)
      }

      // 2. Fetch Walk-ins
      const resWalkins = await fetch("/api/resource/Hospital Patient Walk In?fields=[\"*\"]&limit=100&order_by=creation desc")
      if (resWalkins.ok) {
        const rawW = await resWalkins.json()
        setQueue(rawW.data)
        
        // Auto-select first active item in queue if none selected
        const activeItems = rawW.data.filter(q => q.appointment_status !== "Completed")
        if (activeItems.length > 0 && !selectedQueueItem) {
          setSelectedQueueItem(activeItems[0])
        }
      }
    } catch (e) {
      showToast("Failed to refresh records from Frappe server.", "error")
      console.error(e)
    }
  }

  // Handle Search for existing Patient
  const handleSearchPatient = async () => {
    if (!searchQuery) {
      showToast("Please enter Name or Mobile Number to search.", "info")
      return
    }

    const query = searchQuery.trim()
    showToast(`Searching for patient: "${query}"...`, "info")

    // Check in State Patients
    const foundByMobile = patients[query]
    const foundByName = Object.values(patients).find(p => p.patient_name.toLowerCase() === query.toLowerCase())
    const foundPatient = foundByMobile || foundByName

    if (foundPatient) {
      setReceptionForm({
        ...receptionForm,
        patient_name: foundPatient.patient_name,
        mobile_number: foundPatient.mobile_number,
        email: foundPatient.email || "",
        gender: foundPatient.gender || "Male",
        age: foundPatient.age || "",
        is_existing: true,
        medical_history: foundPatient.medical_history || ""
      })
      showToast(`Patient Found! Auto-loaded records for ${foundPatient.patient_name}`, "success")
    } else {
      // Not found, check online if Frappe is enabled
      if (useFrappe && isLoggedIn) {
        try {
          const res = await fetch(`/api/resource/Hospital Patient?filters=[["Hospital Patient","mobile_number","=","${query}"]]&fields=["*"]`)
          if (res.ok) {
            const raw = await res.json()
            if (raw.data && raw.data.length > 0) {
              const p = raw.data[0]
              setReceptionForm({
                ...receptionForm,
                patient_name: p.patient_name,
                mobile_number: p.mobile_number,
                email: p.email || "",
                gender: p.gender || "Male",
                age: p.age || "",
                is_existing: true,
                medical_history: p.medical_history || ""
              })
              // Update patients dictionary
              setPatients(prev => ({ ...prev, [p.mobile_number]: p }))
              showToast(`Patient Found in Frappe! Auto-loaded reports.`, "success")
              return
            }
          }
        } catch (err) {
          console.error(err)
        }
      }
      
      // Patient truly not found
      setReceptionForm({
        ...receptionForm,
        patient_name: isNaN(query) ? query : "",
        mobile_number: !isNaN(query) ? query : "",
        email: "",
        gender: "Male",
        age: "",
        is_existing: false,
        medical_history: ""
      })
      showToast("No existing records found. Creating new patient card.", "info")
    }
  }

  // Register & Book Walk-in
  const handleRegisterWalkin = async (e) => {
    e.preventDefault()
    const { patient_name, mobile_number, email, gender, age, doctor, is_existing, medical_history } = receptionForm
    
    if (!patient_name || !mobile_number) {
      showToast("Patient Name and Mobile Number are required.", "error")
      return
    }

    const payloadPatient = {
      patient_name,
      mobile_number,
      email,
      gender,
      age: parseInt(age) || 0,
      medical_history: medical_history || ""
    }

    if (useFrappe && isLoggedIn) {
      try {
        // Step 1: Create Patient if new
        if (!is_existing) {
          const checkRes = await fetch(`/api/resource/Hospital Patient/${mobile_number}`)
          if (!checkRes.ok) {
            // Document doesn't exist, create it
            const createPatient = await fetch("/api/resource/Hospital Patient", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payloadPatient)
            })
            if (!createPatient.ok) {
              const err = await createPatient.json()
              throw new Error(err.message || "Failed to create Patient in Frappe.")
            }
            showToast("New Patient Card created on Frappe.", "success")
          }
        }

        // Step 2: Create Walkin Appointment
        const payloadWalkin = {
          patient_name,
          mobile_number,
          patient: mobile_number,
          is_existing: is_existing ? 1 : 0,
          doctor,
          appointment_status: "Doctor Consultation"
        }

        const createWalkin = await fetch("/api/resource/Hospital Patient Walk In", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadWalkin)
        })

        if (!createWalkin.ok) {
          const err = await createWalkin.json()
          throw new Error(err.message || "Failed to book Walkin in Frappe.")
        }

        showToast("Appointment booked successfully!", "success")
        await fetchFrappeData()
        
        // Auto-navigate to Doctor step
        setActiveStep("Doctor")
      } catch (err) {
        showToast(err.message || "Error saving to Frappe.", "error")
        console.error(err)
      }
    } else {
      // Mock Local Save
      const updatedPatients = { ...patients }
      if (!is_existing) {
        updatedPatients[mobile_number] = payloadPatient
        setPatients(updatedPatients)
      }

      const walkinId = `HOSP-WALK-2026-${String(queue.length + 1).padStart(5, '0')}`
      const newWalkin = {
        name: walkinId,
        patient_name,
        mobile_number,
        patient: mobile_number,
        is_existing: is_existing ? 1 : 0,
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
        payment_method: ""
      }

      const newQueue = [newWalkin, ...queue]
      setQueue(newQueue)
      setSelectedQueueItem(newWalkin)
      showToast("Appointment Booked locally! Redirected to Doctor Desk.", "success")
      
      // Auto-navigate to Doctor step
      setActiveStep("Doctor")
    }

    // Reset Form
    setSearchQuery("")
    setReceptionForm({
      patient_name: "",
      mobile_number: "",
      email: "",
      gender: "Male",
      age: "",
      doctor: "Dr. Rajesh",
      is_existing: false,
      medical_history: ""
    })
  }

  // Doctor Consultation Submission
  const handleDoctorSubmit = async (e) => {
    e.preventDefault()
    if (!selectedQueueItem) {
      showToast("Please select a patient from the queue.", "error")
      return
    }

    const { diagnosis, prescription, need_lab_test, lab_test_name, need_medicines } = doctorForm
    
    if (!diagnosis) {
      showToast("Diagnosis is required for doctor consultation.", "error")
      return
    }

    // Determine next step
    let nextStatus = "Billing"
    if (need_lab_test) {
      nextStatus = "Lab Test"
    } else if (need_medicines) {
      nextStatus = "Pharmacy"
    }

    if (useFrappe && isLoggedIn) {
      try {
        const payload = {
          diagnosis,
          prescription,
          need_lab_test: need_lab_test ? 1 : 0,
          lab_test_name: need_lab_test ? lab_test_name : "",
          need_medicines: need_medicines ? 1 : 0,
          appointment_status: nextStatus
        }

        const res = await fetch(`/api/resource/Hospital Patient Walk In/${selectedQueueItem.name}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })

        if (!res.ok) {
          throw new Error("Failed to update Consultation in Frappe.")
        }

        showToast("Consultation submitted. Patient routed to " + nextStatus, "success")
        await fetchFrappeData()
        
        // Select next step
        setActiveStep(nextStatus)
      } catch (err) {
        showToast(err.message, "error")
        console.error(err)
      }
    } else {
      // Local Update
      const updatedQueue = queue.map(q => {
        if (q.name === selectedQueueItem.name) {
          const updated = {
            ...q,
            diagnosis,
            prescription,
            need_lab_test: need_lab_test ? 1 : 0,
            lab_test_name: need_lab_test ? lab_test_name : "",
            need_medicines: need_medicines ? 1 : 0,
            appointment_status: nextStatus
          }
          setSelectedQueueItem(updated)
          return updated
        }
        return q
      })

      setQueue(updatedQueue)
      showToast("Consultation saved locally! Redirected to " + nextStatus, "success")
      setActiveStep(nextStatus)
    }

    // Reset Doctor Form
    setDoctorForm({
      doctor: doctorForm.doctor,
      diagnosis: "",
      prescription: "",
      need_lab_test: false,
      lab_test_name: "Blood Routine",
      need_medicines: false
    })
  }

  // Lab Result Submission
  const handleLabSubmit = async (e) => {
    e.preventDefault()
    if (!selectedQueueItem) return

    const { lab_result } = labForm
    if (!lab_result) {
      showToast("Please enter the lab result findings.", "error")
      return
    }

    let nextStatus = selectedQueueItem.need_medicines ? "Pharmacy" : "Billing"

    if (useFrappe && isLoggedIn) {
      try {
        const payload = {
          lab_result,
          lab_test_status: "Completed",
          appointment_status: nextStatus
        }

        const res = await fetch(`/api/resource/Hospital Patient Walk In/${selectedQueueItem.name}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })

        if (!res.ok) {
          throw new Error("Failed to save Lab reports in Frappe.")
        }

        showToast("Lab reports submitted. Routed to " + nextStatus, "success")
        await fetchFrappeData()
        setActiveStep(nextStatus)
      } catch (err) {
        showToast(err.message, "error")
        console.error(err)
      }
    } else {
      const updatedQueue = queue.map(q => {
        if (q.name === selectedQueueItem.name) {
          const updated = {
            ...q,
            lab_result,
            lab_test_status: "Completed",
            appointment_status: nextStatus
          }
          setSelectedQueueItem(updated)
          return updated
        }
        return q
      })
      setQueue(updatedQueue)
      showToast("Lab report logged locally! Moving to " + nextStatus, "success")
      setActiveStep(nextStatus)
    }

    // Reset Lab Form
    setLabForm({ lab_result: "" })
  }

  // Pharmacy Dispensation
  const handlePharmacySubmit = async (e) => {
    e.preventDefault()
    if (!selectedQueueItem) return

    let nextStatus = "Billing"

    if (useFrappe && isLoggedIn) {
      try {
        const payload = {
          pharmacy_status: "Completed",
          appointment_status: nextStatus
        }

        const res = await fetch(`/api/resource/Hospital Patient Walk In/${selectedQueueItem.name}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })

        if (!res.ok) {
          throw new Error("Failed to update Pharmacy status in Frappe.")
        }

        showToast("Medicines dispensed. Routed to Billing Desk.", "success")
        await fetchFrappeData()
        setActiveStep(nextStatus)
      } catch (err) {
        showToast(err.message, "error")
        console.error(err)
      }
    } else {
      const updatedQueue = queue.map(q => {
        if (q.name === selectedQueueItem.name) {
          const updated = {
            ...q,
            pharmacy_status: "Completed",
            appointment_status: nextStatus
          }
          setSelectedQueueItem(updated)
          return updated
        }
        return q
      })
      setQueue(updatedQueue)
      showToast("Pharmacy items dispensed locally! Moving to Billing.", "success")
      setActiveStep(nextStatus)
    }
  }

  // Calculate bill item prices
  const getBillBreakdown = (item) => {
    if (!item) return { docFee: 0, labFee: 0, pharmFee: 0, total: 0 }
    
    const docFee = DOCTOR_FEES[item.doctor] || 500
    const labFee = item.need_lab_test ? 450 : 0
    const pharmFee = item.need_medicines ? 250 : 0
    const total = docFee + labFee + pharmFee

    return { docFee, labFee, pharmFee, total }
  }

  // Billing Completion
  const handleBillingSubmit = async (e) => {
    e.preventDefault()
    if (!selectedQueueItem) return

    const { total } = getBillBreakdown(selectedQueueItem)
    const today = new Date().toISOString().split('T')[0]

    // Create a clinical report block for permanent Patient medical history
    const newReportBlock = `Visit Date: ${today}
Doctor: ${selectedQueueItem.doctor}
Diagnosis: ${selectedQueueItem.diagnosis}
Prescription: ${selectedQueueItem.prescription || "None"}
Lab Test: ${selectedQueueItem.need_lab_test ? `${selectedQueueItem.lab_test_name} - Result: ${selectedQueueItem.lab_result}` : "None"}
Pharmacy status: ${selectedQueueItem.need_medicines ? "Medicines Dispensed" : "None"}
Total Bill: Rs. ${total} (Paid via ${paymentMethod})
Status: Completed.
`

    if (useFrappe && isLoggedIn) {
      try {
        // Step 1: Update Walkin status to Completed
        const payloadWalkin = {
          bill_amount: total,
          payment_received: 1,
          payment_method: paymentMethod,
          appointment_status: "Completed"
        }

        const resWalkin = await fetch(`/api/resource/Hospital Patient Walk In/${selectedQueueItem.name}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadWalkin)
        })

        if (!resWalkin.ok) {
          throw new Error("Failed to close Walk-in report in Frappe.")
        }

        // Step 2: Append this visit's report to the permanent Patient DocType
        // First retrieve existing patient record to compile history
        const pResponse = await fetch(`/api/resource/Hospital Patient/${selectedQueueItem.mobile_number}`)
        if (pResponse.ok) {
          const pData = await pResponse.json()
          const oldHistory = pData.data.medical_history || ""
          const newHistory = oldHistory ? `${newReportBlock}\n\n${oldHistory}` : newReportBlock

          // Update patient document with new history
          await fetch(`/api/resource/Hospital Patient/${selectedQueueItem.mobile_number}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ medical_history: newHistory })
          })
        }

        showToast("Payment recorded. Medical records updated!", "success")
        await fetchFrappeData()
        setActiveStep("Complete")
      } catch (err) {
        showToast(err.message, "error")
        console.error(err)
      }
    } else {
      // Local Save
      const updatedQueue = queue.map(q => {
        if (q.name === selectedQueueItem.name) {
          const updated = {
            ...q,
            bill_amount: total,
            payment_received: 1,
            payment_method: paymentMethod,
            appointment_status: "Completed"
          }
          setSelectedQueueItem(updated)
          return updated
        }
        return q
      })
      setQueue(updatedQueue)

      // Append history to local patient record
      const patientMobile = selectedQueueItem.mobile_number
      const existingPatient = patients[patientMobile]
      if (existingPatient) {
        const oldH = existingPatient.medical_history || ""
        const newH = oldH ? `${newReportBlock}\n\n${oldH}` : newReportBlock
        setPatients(prev => ({
          ...prev,
          [patientMobile]: {
            ...existingPatient,
            medical_history: newH
          }
        }))
      }

      showToast("Payment received! History saved in simulator.", "success")
      setActiveStep("Complete")
    }
  }

  // Active Patient info block
  const renderPatientMeta = (item) => {
    if (!item) return null
    return (
      <div className="patient-found-alert" style={{ background: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.2)', marginBottom: '16px' }}>
        <div className="icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.2)', color: 'var(--accent-indigo)' }}>
          <UserCheck size={18} />
        </div>
        <div>
          <h4 style={{ fontWeight: 600 }}>{item.patient_name} ({item.mobile_number})</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Assigned Doctor: {item.doctor} | ID: {item.name}
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          padding: '16px 24px',
          borderRadius: '12px',
          background: notification.type === 'success' ? 'var(--accent-teal)' : notification.type === 'error' ? 'var(--accent-pink)' : 'var(--accent-indigo)',
          color: '#fff',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: 600,
          animation: 'slide-in 0.2s ease-out'
        }}>
          {notification.type === 'success' && <CheckCircle size={20} />}
          {notification.type === 'error' && <AlertCircle size={20} />}
          {notification.type === 'info' && <Sparkles size={20} />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Frappe Login Connection Modal */}
      {showLoginModal && (
        <div className="login-modal-overlay">
          <form className="login-modal glass" onSubmit={handleLogin}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Server size={36} style={{ color: 'var(--accent-indigo)', margin: '0 auto' }} />
              <h2 style={{ fontSize: '22px' }}>Connect to Frappe Bench</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Logging in authenticates this portal to write directly to your database.
              </p>
            </div>
            
            <div className="form-group">
              <label>Host URL</label>
              <input type="text" value={frappeUrl} onChange={e => setFrappeUrl(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Username</label>
              <input type="text" value={usr} onChange={e => setUsr(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} required />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowLoginModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn" style={{ flex: 1 }} disabled={isConnecting}>
                {isConnecting ? <RefreshCw className="animate-spin" size={16} /> : "Connect"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Header */}
      <header className="app-header glass">
        <div className="brand">
          <div className="brand-icon">
            <Heart size={28} color="#fff" />
          </div>
          <div className="brand-title">
            <h1 className="text-gradient-cyan">THANGAM HOSPITAL</h1>
            <p>Integrated Hospital ERP Portal</p>
          </div>
        </div>
        
        <div className="server-config" style={{ background: useFrappe ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)', border: useFrappe ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--card-border)' }}>
          <div className="server-status">
            <span className={`status-dot ${useFrappe ? 'online' : 'offline'}`}></span>
            <span style={{ color: useFrappe ? 'var(--accent-emerald)' : 'var(--text-secondary)' }}>
              {useFrappe ? "Database: Frappe Bench" : "Database: Simulator Mode"}
            </span>
          </div>
          
          {useFrappe ? (
            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '20px' }} onClick={handleLogout}>
              <LogOut size={12} style={{ marginRight: '4px' }} /> Disconnect
            </button>
          ) : (
            <button className="btn" style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '20px' }} onClick={() => setShowLoginModal(true)}>
              <LogIn size={12} style={{ marginRight: '4px' }} /> Connect Frappe
            </button>
          )}
        </div>
      </header>

      {/* Interactive Workflow Progress Stepper */}
      <section className="workflow-stepper glass">
        {[
          { id: "Reception", label: "Reception", icon: UserPlus },
          { id: "Doctor", label: "Consultation", icon: Stethoscope },
          { id: "Lab Test", label: "Lab Station", icon: FlaskConical },
          { id: "Pharmacy", label: "Pharmacy", icon: Pill },
          { id: "Billing", label: "Billing & Pay", icon: CreditCard },
          { id: "Complete", label: "Complete", icon: CheckCircle }
        ].map((step, idx) => {
          const Icon = step.icon
          const isCompleted = idx < ["Reception", "Doctor", "Lab Test", "Pharmacy", "Billing", "Complete"].indexOf(activeStep)
          const isActive = activeStep === step.id

          return (
            <div
              key={step.id}
              className={`step-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              onClick={() => setActiveStep(step.id)}
            >
              <div className="step-circle">
                <Icon size={20} />
              </div>
              <span className="step-label">{step.label}</span>
            </div>
          )
        })}
      </section>

      {/* Main Panel Layout */}
      <main className="dashboard-grid">
        {/* Left Side: Active Workflow Panel */}
        <section className="glass" style={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* STEP 1: RECEPTION DESK */}
          {activeStep === "Reception" && (
            <div className="panel-container">
              <div className="panel-header">
                <h2 className="text-gradient-cyan"><UserPlus size={22} /> Reception Desk</h2>
                <span className="badge badge-reception">Walk-In & Registry</span>
              </div>
              <div className="panel-body">
                {/* Search / Existing Check bar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                  <label style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Find Existing Patient Records</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        placeholder="Search by Mobile (e.g. 9876543210) or Name..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: '44px', width: '100%' }}
                        onKeyDown={e => e.key === 'Enter' && handleSearchPatient()}
                      />
                    </div>
                    <button type="button" className="btn btn-secondary" onClick={handleSearchPatient}>
                      Check Record
                    </button>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    💡 Tip: Try typing "9876543210" or "Surya Prakash" to demo auto-loading reports!
                  </p>
                </div>

                {/* Patient Record Alert Banner */}
                {receptionForm.is_existing && (
                  <div className="patient-found-alert">
                    <div className="icon-wrapper">
                      <UserCheck size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 600 }}>Existing Patient Loaded</h4>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        All historical diagnoses, prescriptions, and lab reports have been synced.
                      </p>
                    </div>
                  </div>
                )}

                {/* Registration & Booking Form */}
                <form onSubmit={handleRegisterWalkin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Patient Name *</label>
                      <input
                        type="text"
                        value={receptionForm.patient_name}
                        onChange={e => setReceptionForm({ ...receptionForm, patient_name: e.target.value })}
                        placeholder="Enter full name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Mobile Number *</label>
                      <input
                        type="tel"
                        value={receptionForm.mobile_number}
                        onChange={e => setReceptionForm({ ...receptionForm, mobile_number: e.target.value })}
                        placeholder="Enter 10-digit number"
                        required
                        disabled={receptionForm.is_existing}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Age</label>
                      <input
                        type="number"
                        value={receptionForm.age}
                        onChange={e => setReceptionForm({ ...receptionForm, age: e.target.value })}
                        placeholder="Age in years"
                        disabled={receptionForm.is_existing}
                      />
                    </div>
                    <div className="form-group">
                      <label>Gender</label>
                      <select
                        value={receptionForm.gender}
                        onChange={e => setReceptionForm({ ...receptionForm, gender: e.target.value })}
                        disabled={receptionForm.is_existing}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={receptionForm.email}
                      onChange={e => setReceptionForm({ ...receptionForm, email: e.target.value })}
                      placeholder="patient@example.com"
                      disabled={receptionForm.is_existing}
                    />
                  </div>

                  {receptionForm.is_existing && (
                    <div className="form-group">
                      <label>Autoloaded Medical History & Past Reports</label>
                      <div className="history-card" style={{ background: '#0e1424', borderColor: 'rgba(20, 184, 166, 0.2)' }}>
                        <div className="history-body">
                          {receptionForm.medical_history || "No prior history logged."}
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '16px', marginTop: '8px' }} className="form-group">
                    <label style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Book Slot & Route Patient</label>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Assign Doctor</label>
                        <select
                          value={receptionForm.doctor}
                          onChange={e => setReceptionForm({ ...receptionForm, doctor: e.target.value })}
                        >
                          <option value="Dr. Rajesh">Dr. Rajesh (General Physician - Rs. 500)</option>
                          <option value="Dr. Priya">Dr. Priya (Cardiologist - Rs. 1000)</option>
                          <option value="Dr. Vignesh">Dr. Vignesh (Pediatrician - Rs. 600)</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn btn-teal" style={{ width: '100%' }}>
                          Book Walk-in Appointment <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* STEP 2: DOCTOR'S DESK */}
          {activeStep === "Doctor" && (
            <div className="panel-container">
              <div className="panel-header">
                <h2 className="text-gradient-purple"><Stethoscope size={22} /> Doctor Consultation</h2>
                <span className="badge badge-doctor">Clinical Diagnosis</span>
              </div>
              <div className="panel-body">
                {selectedQueueItem && selectedQueueItem.appointment_status === "Doctor Consultation" ? (
                  <>
                    {renderPatientMeta(selectedQueueItem)}

                    {/* Pre-loaded reports block inside consultation */}
                    <div className="form-group">
                      <label>Automatically Loaded Patient File & Reports</label>
                      <div className="history-card" style={{ maxHeight: '150px', overflowY: 'auto', background: '#0e1424' }}>
                        <div className="history-body">
                          {patients[selectedQueueItem.mobile_number]?.medical_history || "No historical reports found."}
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleDoctorSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="form-group">
                        <label>Consulting Doctor</label>
                        <input type="text" value={selectedQueueItem.doctor} disabled />
                      </div>

                      <div className="form-group">
                        <label>Clinical Findings / Diagnosis *</label>
                        <textarea
                          placeholder="Describe symptoms, diagnosis findings..."
                          value={doctorForm.diagnosis}
                          onChange={e => setDoctorForm({ ...doctorForm, diagnosis: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Prescription (Medicines, dosage)</label>
                        <textarea
                          placeholder="e.g. Paracetamol 650mg - 1-0-1 - 3 days&#10;Amoxicillin 500mg - 1-1-1 - 5 days"
                          value={doctorForm.prescription}
                          onChange={e => setDoctorForm({ ...doctorForm, prescription: e.target.value })}
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={doctorForm.need_lab_test}
                              onChange={e => setDoctorForm({ ...doctorForm, need_lab_test: e.target.checked })}
                            />
                            Need Lab Diagnostic Test?
                          </label>
                        </div>
                        <div className="form-group">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={doctorForm.need_medicines}
                              onChange={e => setDoctorForm({ ...doctorForm, need_medicines: e.target.checked })}
                            />
                            Dispense Medicines (Pharmacy)?
                          </label>
                        </div>
                      </div>

                      {doctorForm.need_lab_test && (
                        <div className="form-group" style={{ animation: 'slide-in 0.2s ease-out' }}>
                          <label>Request Lab Test Name</label>
                          <select
                            value={doctorForm.lab_test_name}
                            onChange={e => setDoctorForm({ ...doctorForm, lab_test_name: e.target.value })}
                          >
                            <option value="Blood Sugar (Fasting)">Blood Sugar (Fasting)</option>
                            <option value="Thyroid Profile (T3, T4, TSH)">Thyroid Profile (T3, T4, TSH)</option>
                            <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
                            <option value="ECG Cardiological Scan">ECG Cardiological Scan</option>
                            <option value="Urine Routine Examination">Urine Routine Examination</option>
                          </select>
                        </div>
                      )}

                      <button type="submit" className="btn btn-teal" style={{ alignSelf: 'flex-end', marginTop: '12px' }}>
                        Submit Consultation Notes <ChevronRight size={16} />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="empty-state">
                    <Clock size={48} />
                    <p>No patient currently selected or active in Doctor Consultation state.</p>
                    <p style={{ fontSize: '13px' }}>Select an eligible patient from the Consultation Queue on the right.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: LAB TEST STATION */}
          {activeStep === "Lab Test" && (
            <div className="panel-container">
              <div className="panel-header">
                <h2 className="text-gradient-purple"><FlaskConical size={22} /> Lab Diagnostic Station</h2>
                <span className="badge badge-lab">Lab Investigations</span>
              </div>
              <div className="panel-body">
                {selectedQueueItem && selectedQueueItem.appointment_status === "Lab Test" ? (
                  <>
                    {renderPatientMeta(selectedQueueItem)}
                    
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--card-border)', marginBottom: '16px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Requested Investigation</span>
                      <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--accent-cyan)', marginTop: '4px' }}>
                        {selectedQueueItem.lab_test_name || "Diagnostic Routine"}
                      </h3>
                    </div>

                    <form onSubmit={handleLabSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="form-group">
                        <label>Enter Investigation Findings / Lab Results *</label>
                        <textarea
                          placeholder="e.g. Fasting blood sugar level: 104 mg/dL (Borderline)&#10;Platelet count: 2.1 Lakhs (Normal range)"
                          value={labForm.lab_result}
                          onChange={e => setLabForm({ ...labForm, lab_result: e.target.value })}
                          required
                        />
                      </div>
                      
                      <button type="submit" className="btn btn-teal" style={{ alignSelf: 'flex-end' }}>
                        Submit Lab Findings <ChevronRight size={16} />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="empty-state">
                    <FlaskConical size={48} />
                    <p>No patient currently pending in the Lab Test phase.</p>
                    <p style={{ fontSize: '13px' }}>Patients will appear here if the Doctor checks the "Need Lab Test?" request.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: PHARMACY DISPENSATION */}
          {activeStep === "Pharmacy" && (
            <div className="panel-container">
              <div className="panel-header">
                <h2 className="text-gradient-pink"><Pill size={22} /> Pharmacy Desk</h2>
                <span className="badge badge-pharmacy">Dispense Medicines</span>
              </div>
              <div className="panel-body">
                {selectedQueueItem && selectedQueueItem.appointment_status === "Pharmacy" ? (
                  <>
                    {renderPatientMeta(selectedQueueItem)}
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="form-group">
                        <label>Doctor's Prescribed Regimen</label>
                        <div className="history-card" style={{ background: '#0e1424', borderColor: 'rgba(236, 72, 153, 0.2)' }}>
                          <div className="history-body" style={{ color: 'var(--text-primary)' }}>
                            {selectedQueueItem.prescription || "No medicines listed."}
                          </div>
                        </div>
                      </div>

                      <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                        <h4 style={{ fontWeight: 600, marginBottom: '8px' }}>Dispensation Summary</h4>
                        <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)' }}>
                          <span>Pharmacy Package (Includes OTC + Prescribed Drugs)</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Rs. 250.00</span>
                        </div>
                      </div>

                      <button type="button" className="btn btn-teal" onClick={handlePharmacySubmit} style={{ alignSelf: 'flex-end', marginTop: '8px' }}>
                        Dispense & Close Regimen <ChevronRight size={16} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="empty-state">
                    <Pill size={48} />
                    <p>No patient currently pending in the Pharmacy phase.</p>
                    <p style={{ fontSize: '13px' }}>Patients are routed here if prescribed medicines during doctor checkups.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: BILLING & PAYMENT */}
          {activeStep === "Billing" && (
            <div className="panel-container">
              <div className="panel-header">
                <h2 className="text-gradient-teal"><CreditCard size={22} /> Billing & Payments</h2>
                <span className="badge badge-billing">Generate Invoices</span>
              </div>
              <div className="panel-body">
                {selectedQueueItem && selectedQueueItem.appointment_status === "Billing" ? (
                  <>
                    {renderPatientMeta(selectedQueueItem)}
                    
                    <form onSubmit={handleBillingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="bill-summary">
                        <h4 style={{ fontWeight: 600, borderBottom: '1px solid var(--card-border)', paddingBottom: '8px', marginBottom: '8px' }}>Itemized Medical Receipt</h4>
                        
                        <div className="bill-item">
                          <span>Consultation Charge ({selectedQueueItem.doctor})</span>
                          <span>Rs. {getBillBreakdown(selectedQueueItem).docFee}.00</span>
                        </div>
                        
                        {selectedQueueItem.need_lab_test === 1 && (
                          <div className="bill-item">
                            <span>Lab Diagnostic Fee ({selectedQueueItem.lab_test_name})</span>
                            <span>Rs. {getBillBreakdown(selectedQueueItem).labFee}.00</span>
                          </div>
                        )}

                        {selectedQueueItem.need_medicines === 1 && (
                          <div className="bill-item">
                            <span>Pharmacy Prescription Charge</span>
                            <span>Rs. {getBillBreakdown(selectedQueueItem).pharmFee}.00</span>
                          </div>
                        )}

                        <div className="bill-item total">
                          <span>Grand Total Due</span>
                          <span style={{ color: 'var(--accent-teal)' }}>Rs. {getBillBreakdown(selectedQueueItem).total}.00</span>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Select Payment Mode</label>
                        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                          <option value="UPI">UPI / QR Code Scan</option>
                          <option value="Card">Credit/Debit Card Terminal</option>
                          <option value="Cash">Cash Counter Payment</option>
                        </select>
                      </div>

                      <button type="submit" className="btn btn-teal" style={{ marginTop: '8px' }}>
                        Record Payment & Close Appointment <CheckCircle size={16} style={{ marginLeft: '4px' }} />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="empty-state">
                    <CreditCard size={48} />
                    <p>No patient currently pending in the Billing / Invoicing phase.</p>
                    <p style={{ fontSize: '13px' }}>Select an eligible patient from the Billing queue on the right.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 6: APPOINTMENT COMPLETED */}
          {activeStep === "Complete" && (
            <div className="panel-container">
              <div className="panel-header" style={{ border: 'none', paddingBottom: 0 }}>
                <span className="badge badge-completed" style={{ margin: '0 auto' }}>Appointment Settled</span>
              </div>
              <div className="panel-body" style={{ textAlign: 'center', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Success checkmark animation placeholder */}
                <div className="success-checkmark">
                  <div className="check-icon">
                    <div className="check-icon-circle"></div>
                    <div className="check-icon-line line-tip"></div>
                    <div className="check-icon-line line-long"></div>
                  </div>
                </div>

                <div>
                  <h2 className="text-gradient-teal" style={{ fontSize: '26px', fontWeight: 700 }}>Appointment Completed!</h2>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '15px' }}>
                    The checkup report has been successfully recorded. All updates have been written to the permanent patient database.
                  </p>
                </div>

                {selectedQueueItem && (
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '20px', maxWidth: '480px', margin: '0 auto', textAlign: 'left' }}>
                    <h4 style={{ fontWeight: 600, borderBottom: '1px dashed var(--card-border)', paddingBottom: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><History size={16} /> permanent File Updates</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      <strong>Patient Name:</strong> {selectedQueueItem.patient_name} <br />
                      <strong>Mobile:</strong> {selectedQueueItem.mobile_number} <br />
                      <strong>Assigned Doctor:</strong> {selectedQueueItem.doctor}
                    </p>
                    <div style={{ padding: '8px 12px', background: '#080b14', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-teal)' }}>
                      ✔ app.db.update("medical_history") <br />
                      ✔ Saved diagnosis: "{selectedQueueItem.diagnosis}" <br />
                      {selectedQueueItem.need_lab_test === 1 && `✔ Saved lab report: "${selectedQueueItem.lab_result}"`}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '8px' }}>
                  <button className="btn" onClick={() => setActiveStep("Reception")}>
                    <Plus size={16} /> Register Another Patient
                  </button>
                </div>
              </div>
            </div>
          )}

        </section>

        {/* Right Side: Consultation Queues & Historical Reports */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* QUEUE MONITOR PANEL */}
          <div className="glass">
            <div className="panel-header">
              <h2 style={{ fontSize: '16px' }}><Activity size={18} style={{ color: 'var(--accent-cyan)' }} /> Active Patient Board</h2>
              <span className="badge badge-reception" style={{ fontSize: '10px' }}>Live Queue</span>
            </div>
            
            <div className="panel-body" style={{ padding: '16px', maxHeight: '350px', overflowY: 'auto' }}>
              {queue.filter(q => q.appointment_status !== "Completed").length > 0 ? (
                <div className="queue-list">
                  {queue
                    .filter(q => q.appointment_status !== "Completed")
                    .map(item => {
                      const isActive = selectedQueueItem && selectedQueueItem.name === item.name
                      const badgeClass = `badge-${item.appointment_status.toLowerCase().replace(' ', '')}`
                      
                      return (
                        <div
                          key={item.name}
                          className={`queue-item ${isActive ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedQueueItem(item)
                            setActiveStep(item.appointment_status)
                          }}
                        >
                          <div>
                            <div className="queue-item-name">{item.patient_name}</div>
                            <div className="queue-item-meta">
                              {item.mobile_number} | {item.doctor}
                            </div>
                          </div>
                          <span className={`badge ${badgeClass}`}>
                            {item.appointment_status}
                          </span>
                        </div>
                      )
                    })}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <UserCheck size={36} />
                  <p style={{ fontSize: '14px' }}>No active patients currently in queue.</p>
                </div>
              )}
            </div>
          </div>

          {/* QUICK DATABASE METRICS */}
          <div className="glass">
            <div className="panel-header">
              <h2 style={{ fontSize: '16px' }}><Database size={18} style={{ color: 'var(--accent-purple)' }} /> Patient Registry Summary</h2>
            </div>
            <div className="panel-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--card-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    {Object.keys(patients).length}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Registered Patients</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--card-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-teal)' }}>
                    {queue.length}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Visits Recorded</div>
                </div>
              </div>

              {/* Connected details */}
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '8px', border: '1px dashed var(--card-border)' }}>
                <strong>How to test Autoloading:</strong>
                <ol style={{ paddingLeft: '20px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Go to <strong>Reception Desk</strong>.</li>
                  <li>Search for <strong>9876543210</strong> (Surya) or <strong>9876501234</strong> (Yokesh).</li>
                  <li>Press Enter or click "Check Record".</li>
                  <li>The app pulls their past diagnosis reports instantly!</li>
                </ol>
              </div>
            </div>
          </div>

        </section>
      </main>

      {/* Database State Inspector (Visual Verification) */}
      <section className="glass db-visualizer" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="panel-header" style={{ padding: '16px 24px' }}>
          <h2 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} style={{ color: 'var(--accent-cyan)' }} /> 
            Database Record Inspector (Live State)
          </h2>
          <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px' }} onClick={useFrappe && isLoggedIn ? fetchFrappeData : () => showToast("Simulator DB Refreshed", "success")}>
            <RefreshCw size={10} style={{ marginRight: '4px' }} /> Refresh Live state
          </button>
        </div>

        <div className="db-tabs">
          <div className={`db-tab ${dbTab === "Patients" ? "active" : ""}`} onClick={() => setDbTab("Patients")}>
            Doctype: Hospital Patient ({Object.keys(patients).length} records)
          </div>
          <div className={`db-tab ${dbTab === "WalkIns" ? "active" : ""}`} onClick={() => setDbTab("WalkIns")}>
            Doctype: Hospital Patient Walk In ({queue.length} records)
          </div>
        </div>

        <div className="db-content">
          {dbTab === "Patients" ? (
            Object.keys(patients).length > 0 ? (
              Object.values(patients).map(p => (
                <div key={p.mobile_number} className="json-record">
                  <div>
                    <span className="json-tag">"name":</span> "{p.mobile_number}",
                  </div>
                  <div>
                    <span className="json-tag">"patient_name":</span> "{p.patient_name}",
                  </div>
                  <div>
                    <span className="json-tag">"mobile_number":</span> "{p.mobile_number}",
                  </div>
                  <div>
                    <span className="json-tag">"email":</span> "{p.email || ""}",
                  </div>
                  <div>
                    <span className="json-tag">"gender":</span> "{p.gender}",
                  </div>
                  <div>
                    <span className="json-tag">"age":</span> {p.age},
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    <span className="json-tag">"medical_history":</span> "{p.medical_history.replace(/\n/g, '\\n')}"
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>No patient records in database.</div>
            )
          ) : (
            queue.length > 0 ? (
              queue.map(q => (
                <div key={q.name} className="json-record">
                  <div>
                    <span className="json-tag">"name":</span> "{q.name}",
                  </div>
                  <div>
                    <span className="json-tag">"patient_name":</span> "{q.patient_name}",
                  </div>
                  <div>
                    <span className="json-tag">"mobile_number":</span> "{q.mobile_number}",
                  </div>
                  <div>
                    <span className="json-tag">"doctor":</span> "{q.doctor}",
                  </div>
                  <div>
                    <span className="json-tag">"appointment_status":</span> "{q.appointment_status}",
                  </div>
                  <div>
                    <span className="json-tag">"diagnosis":</span> "{q.diagnosis || ""}",
                  </div>
                  <div>
                    <span className="json-tag">"prescription":</span> "{q.prescription || ""}",
                  </div>
                  <div>
                    <span className="json-tag">"need_lab_test":</span> {q.need_lab_test},
                  </div>
                  <div>
                    <span className="json-tag">"lab_test_name":</span> "{q.lab_test_name || ""}",
                  </div>
                  <div>
                    <span className="json-tag">"lab_result":</span> "{q.lab_result || ""}",
                  </div>
                  <div>
                    <span className="json-tag">"bill_amount":</span> {q.bill_amount},
                  </div>
                  <div>
                    <span className="json-tag">"payment_received":</span> {q.payment_received}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>No walk-in appointment records.</div>
            )
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: '24px', padding: '16px 0', borderTop: '1px solid var(--border)', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
        Hospital ERP Workflow Demo &copy; 2026. Made with Google Gemini Antigravity Agent.
      </footer>
    </>
  )
}

export default App
