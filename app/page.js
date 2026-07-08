"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Heart, LogIn, LogOut, UserPlus, Stethoscope, FlaskConical, Pill, 
  CreditCard, CheckCircle, Search, UserCheck, ChevronRight, Clock, 
  Activity, Database, RefreshCw, History, ShieldAlert, Plus
} from 'lucide-react';

const DOCTOR_FEES = {
  "Dr. Rajesh": 500,
  "Dr. Priya": 1000,
  "Dr. Vignesh": 600
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
];

export default function Home() {
  // App States
  const [patients, setPatients] = useState(INITIAL_MOCK_PATIENTS);
  const [queue, setQueue] = useState(INITIAL_MOCK_APPOINTMENTS);
  const [activeStep, setActiveStep] = useState("Reception"); // Reception, Doctor, Lab Test, Pharmacy, Billing, Complete
  const [selectedQueueItem, setSelectedQueueItem] = useState(INITIAL_MOCK_APPOINTMENTS[0]);
  const [useFrappe, setUseFrappe] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [dbTab, setDbTab] = useState("Patients"); // Patients, WalkIns
  const [toasts, setToasts] = useState([]);

  // Toast Helper
  const showToast = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  // Form States
  const [searchQuery, setSearchQuery] = useState("");
  const [receptionFormState, setReceptionFormState] = useState({
    patient_name: "",
    mobile_number: "",
    email: "",
    gender: "Male",
    age: "",
    doctor: "Dr. Rajesh",
    is_existing: false,
    medical_history: ""
  });

  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [needLab, setNeedLab] = useState(false);
  const [needMedicines, setNeedMedicines] = useState(false);
  const [labTestName, setLabTestName] = useState("Blood Sugar (Fasting)");

  const [labResult, setLabResult] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");

  // Login Modal
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginUsr, setLoginUsr] = useState("Administrator");
  const [loginPwd, setLoginPwd] = useState("admin");
  const [connecting, setConnecting] = useState(false);

  // Sync Data function
  const fetchFrappeData = useCallback(async () => {
    try {
      const resPatients = await fetch('/api/resource/Hospital Patient?fields=["*"]&limit=100');
      if (resPatients.ok) {
        const rawP = await resPatients.json();
        const patientMap = {};
        (rawP.data || []).forEach(p => {
          patientMap[p.mobile_number] = p;
        });
        setPatients(patientMap);
      }

      const resWalkins = await fetch('/api/resource/Hospital Patient Walk In?fields=["*"]&limit=100&order_by=creation desc');
      if (resWalkins.ok) {
        const rawW = await resWalkins.json();
        const queueList = rawW.data || [];
        setQueue(queueList);
        
        const activeItems = queueList.filter(q => q.appointment_status !== "Completed");
        if (activeItems.length > 0) {
          setSelectedQueueItem(prev => {
            const isStillActive = activeItems.some(q => prev && q.name === prev.name);
            if (!isStillActive) {
              const nextItem = activeItems[0];
              const step = nextItem.appointment_status === "Doctor Consultation" ? "Doctor" : nextItem.appointment_status;
              setActiveStep(step);
              return nextItem;
            }
            return activeItems.find(q => q.name === prev.name) || prev;
          });
        }
      }
    } catch (e) {
      showToast("Failed to refresh records from Frappe server.", "error");
      console.error(e);
    }
  }, [showToast]);

  // Load backend on start
  useEffect(() => {
    if (useFrappe && isLoggedIn) {
      fetchFrappeData();
    }
  }, [useFrappe, isLoggedIn, fetchFrappeData]);

  // Sidebar Queue Select
  const handleSelectQueueItem = (item) => {
    setSelectedQueueItem(item);
    const step = item.appointment_status === "Doctor Consultation" ? "Doctor" : (item.appointment_status === "Completed" ? "Complete" : item.appointment_status);
    setActiveStep(step);
  };

  // Search Patient
  const handleSearchPatient = async (e) => {
    e?.preventDefault();
    if (!searchQuery) {
      showToast("Please enter Name or Mobile Number to search.", "info");
      return;
    }
    showToast(`Searching for patient: "${searchQuery}"...`, "info");

    const foundByMobile = patients[searchQuery];
    const foundByName = Object.values(patients).find(p => p.patient_name.toLowerCase() === searchQuery.toLowerCase());
    const foundPatient = foundByMobile || foundByName;

    if (foundPatient) {
      setReceptionFormState({
        patient_name: foundPatient.patient_name,
        mobile_number: foundPatient.mobile_number,
        email: foundPatient.email || "",
        gender: foundPatient.gender || "Male",
        age: foundPatient.age || "",
        is_existing: true,
        medical_history: foundPatient.medical_history || "",
        doctor: receptionFormState.doctor
      });
      showToast(`Patient Found! Auto-loaded records for ${foundPatient.patient_name}`, "success");
    } else {
      if (useFrappe && isLoggedIn) {
        try {
          const res = await fetch(`/api/resource/Hospital Patient?filters=[["Hospital Patient","mobile_number","=","${searchQuery}"]]&fields=["*"]`);
          if (res.ok) {
            const raw = await res.json();
            if (raw.data && raw.data.length > 0) {
              const p = raw.data[0];
              setReceptionFormState({
                patient_name: p.patient_name,
                mobile_number: p.mobile_number,
                email: p.email || "",
                gender: p.gender || "Male",
                age: p.age || "",
                is_existing: true,
                medical_history: p.medical_history || "",
                doctor: receptionFormState.doctor
              });
              showToast(`Patient Found in Frappe! Auto-loaded ${p.patient_name}`, "success");
              return;
            }
          }
        } catch (err) {
          console.error(err);
        }
      }
      showToast(`No record found for "${searchQuery}". Please register as a new patient.`, "info");
      setReceptionFormState(prev => ({
        ...prev,
        patient_name: isNaN(searchQuery) ? searchQuery : "",
        mobile_number: !isNaN(searchQuery) ? searchQuery : "",
        is_existing: false,
        medical_history: ""
      }));
    }
  };

  // Bookwalkin Appointment
  const handleReceptionSubmit = async (e) => {
    e.preventDefault();
    const { patient_name, mobile_number, email, gender, age, doctor, is_existing, medical_history } = receptionFormState;
    if (!patient_name || !mobile_number) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    const payloadPatient = {
      patient_name,
      mobile_number,
      email,
      gender,
      age: age ? parseInt(age) : null,
      medical_history: medical_history || ""
    };

    if (useFrappe && isLoggedIn) {
      try {
        if (!is_existing) {
          const checkRes = await fetch(`/api/resource/Hospital Patient/${mobile_number}`);
          if (!checkRes.ok) {
            const createPatient = await fetch("/api/resource/Hospital Patient", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payloadPatient)
            });
            if (!createPatient.ok) {
              const err = await createPatient.json();
              throw new Error(err.message || "Failed to create Patient in Frappe.");
            }
            showToast("New Patient Card created on Frappe.", "success");
          }
        }

        const payloadWalkin = {
          patient_name,
          mobile_number,
          patient: mobile_number,
          is_existing: is_existing ? 1 : 0,
          doctor,
          appointment_status: "Doctor Consultation"
        };

        const createWalkin = await fetch("/api/resource/Hospital Patient Walk In", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadWalkin)
        });

        if (!createWalkin.ok) {
          const err = await createWalkin.json();
          throw new Error(err.message || "Failed to book Walkin in Frappe.");
        }

        showToast("Appointment booked successfully!", "success");
        await fetchFrappeData();
        setActiveStep("Doctor");
      } catch (err) {
        showToast(err.message, "error");
        console.error(err);
      }
    } else {
      const updatedPatients = { ...patients };
      if (!is_existing) {
        updatedPatients[mobile_number] = payloadPatient;
        setPatients(updatedPatients);
      }

      const walkinName = `HOSP-WALK-2026-${String(queue.length + 1).padStart(5, '0')}`;
      const newWalkin = {
        name: walkinName,
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
      };

      const updatedQueue = [newWalkin, ...queue];
      setQueue(updatedQueue);
      setSelectedQueueItem(newWalkin);
      showToast("Walk-in Appointment registered in Simulator.", "success");
      setActiveStep("Doctor");
    }
  };

  // Doctor Note Submit
  const handleDoctorSubmit = async (e) => {
    e.preventDefault();
    if (!selectedQueueItem) return;

    const payload = {
      diagnosis,
      prescription,
      need_lab_test: needLab ? 1 : 0,
      lab_test_name: needLab ? labTestName : "",
      need_medicines: needMedicines ? 1 : 0,
      appointment_status: needLab ? "Lab Test" : (needMedicines ? "Pharmacy" : "Billing")
    };

    if (useFrappe && isLoggedIn) {
      try {
        const res = await fetch(`/api/resource/Hospital Patient Walk In/${selectedQueueItem.name}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          showToast("Doctor consultation records submitted.", "success");
          await fetchFrappeData();
          const nextStep = needLab ? "Lab Test" : (needMedicines ? "Pharmacy" : "Billing");
          setActiveStep(nextStep);
        } else {
          const err = await res.json();
          showToast(err.message || "Failed to update record in Frappe.", "error");
        }
      } catch (err) {
        showToast("Error updating Frappe record.", "error");
        console.error(err);
      }
    } else {
      const updatedQueue = queue.map(q => {
        if (q.name === selectedQueueItem.name) {
          return { ...q, ...payload };
        }
        return q;
      });
      setQueue(updatedQueue);
      const nextItem = updatedQueue.find(q => q.name === selectedQueueItem.name);
      setSelectedQueueItem(nextItem);
      showToast("Consultation recorded in Simulator.", "success");
      const nextStep = needLab ? "Lab Test" : (needMedicines ? "Pharmacy" : "Billing");
      setActiveStep(nextStep);
    }
  };

  // Lab submit
  const handleLabSubmit = async (e) => {
    e.preventDefault();
    if (!selectedQueueItem) return;

    const payload = {
      lab_result: labResult,
      lab_test_status: "Completed",
      appointment_status: selectedQueueItem.need_medicines === 1 ? "Pharmacy" : "Billing"
    };

    if (useFrappe && isLoggedIn) {
      try {
        const res = await fetch(`/api/resource/Hospital Patient Walk In/${selectedQueueItem.name}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          showToast("Lab Diagnostic reports recorded.", "success");
          await fetchFrappeData();
          const nextStep = selectedQueueItem.need_medicines === 1 ? "Pharmacy" : "Billing";
          setActiveStep(nextStep);
        } else {
          const err = await res.json();
          showToast(err.message || "Failed to submit lab report.", "error");
        }
      } catch (err) {
        showToast("Error submitting lab report.", "error");
        console.error(err);
      }
    } else {
      const updatedQueue = queue.map(q => {
        if (q.name === selectedQueueItem.name) {
          return { ...q, ...payload };
        }
        return q;
      });
      setQueue(updatedQueue);
      const nextItem = updatedQueue.find(q => q.name === selectedQueueItem.name);
      setSelectedQueueItem(nextItem);
      showToast("Lab results recorded in Simulator.", "success");
      const nextStep = selectedQueueItem.need_medicines === 1 ? "Pharmacy" : "Billing";
      setActiveStep(nextStep);
    }
  };

  // Pharmacy dispense
  const handlePharmacySubmit = async () => {
    if (!selectedQueueItem) return;

    const payload = {
      pharmacy_status: "Completed",
      appointment_status: "Billing"
    };

    if (useFrappe && isLoggedIn) {
      try {
        const res = await fetch(`/api/resource/Hospital Patient Walk In/${selectedQueueItem.name}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          showToast("Medicines package checked off & dispensed.", "success");
          await fetchFrappeData();
          setActiveStep("Billing");
        } else {
          const err = await res.json();
          showToast(err.message || "Failed to dispense medicines.", "error");
        }
      } catch (err) {
        showToast("Error update in Frappe.", "error");
        console.error(err);
      }
    } else {
      const updatedQueue = queue.map(q => {
        if (q.name === selectedQueueItem.name) {
          return { ...q, ...payload };
        }
        return q;
      });
      setQueue(updatedQueue);
      const nextItem = updatedQueue.find(q => q.name === selectedQueueItem.name);
      setSelectedQueueItem(nextItem);
      showToast("Medicines package dispensed in Simulator.", "success");
      setActiveStep("Billing");
    }
  };

  // Settle bill
  const handleBillingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedQueueItem) return;

    const docFee = DOCTOR_FEES[selectedQueueItem.doctor] || 500;
    const labFee = selectedQueueItem.need_lab_test ? 450 : 0;
    const pharmFee = selectedQueueItem.need_medicines ? 250 : 0;
    const grandTotal = docFee + labFee + pharmFee;

    const payload = {
      bill_amount: grandTotal,
      payment_received: 1,
      payment_method: paymentMethod,
      appointment_status: "Completed"
    };

    if (useFrappe && isLoggedIn) {
      try {
        const res = await fetch(`/api/resource/Hospital Patient Walk In/${selectedQueueItem.name}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const historyEntry = `\nVisit Date: ${new Date().toISOString().split('T')[0]}\nDiagnosis: ${selectedQueueItem.diagnosis || 'General Checkup'}\nPrescription: ${selectedQueueItem.prescription || 'None'}\nLab Test: ${selectedQueueItem.need_lab_test === 1 ? selectedQueueItem.lab_test_name + ' (' + selectedQueueItem.lab_result + ')' : 'None'}\nStatus: Completed.\n`;

          const pResponse = await fetch(`/api/resource/Hospital Patient/${selectedQueueItem.mobile_number}`);
          if (pResponse.ok) {
            const rawP = await pResponse.json();
            const currentHistory = rawP.data.medical_history || "";
            const newHistory = currentHistory + "\n" + historyEntry;

            await fetch(`/api/resource/Hospital Patient/${selectedQueueItem.mobile_number}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ medical_history: newHistory })
            });
          }

          showToast("Payment recorded & settled! Database history updated.", "success");
          await fetchFrappeData();
          setActiveStep("Complete");
        } else {
          const err = await res.json();
          showToast(err.message || "Failed to settle payment.", "error");
        }
      } catch (err) {
        showToast("Error updating records.", "error");
        console.error(err);
      }
    } else {
      const updatedQueue = queue.map(q => {
        if (q.name === selectedQueueItem.name) {
          return { ...q, ...payload };
        }
        return q;
      });
      setQueue(updatedQueue);
      
      const historyEntry = `\nVisit Date: ${new Date().toISOString().split('T')[0]}\nDiagnosis: ${selectedQueueItem.diagnosis || 'General Checkup'}\nPrescription: ${selectedQueueItem.prescription || 'None'}\nLab Test: ${selectedQueueItem.need_lab_test === 1 ? selectedQueueItem.lab_test_name + ' (' + selectedQueueItem.lab_result + ')' : 'None'}\nStatus: Completed.\n`;
      
      const currentPatient = patients[selectedQueueItem.mobile_number];
      if (currentPatient) {
        const newHistory = (currentPatient.medical_history || "") + "\n" + historyEntry;
        setPatients({
          ...patients,
          [selectedQueueItem.mobile_number]: {
            ...currentPatient,
            medical_history: newHistory
          }
        });
      }

      const nextItem = updatedQueue.find(q => q.name === selectedQueueItem.name);
      setSelectedQueueItem(nextItem);
      showToast("Payment received! History saved in simulator.", "success");
      setActiveStep("Complete");
    }
  };

  // Login handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setConnecting(true);
    try {
      const res = await fetch("/api/method/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ usr: loginUsr, pwd: loginPwd })
      });

      if (res.ok) {
        setIsLoggedIn(true);
        setUseFrappe(true);
        setShowLoginModal(false);
        showToast("Connected to Frappe Database!", "success");
        await fetchFrappeData();
      } else {
        const err = await res.json();
        showToast(err.message || "Failed to login. Please verify credentials.", "error");
      }
    } catch (err) {
      showToast("Error connecting to Frappe bench. Is it running?", "error");
      console.error(err);
    } finally {
      setConnecting(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUseFrappe(false);
    setPatients(INITIAL_MOCK_PATIENTS);
    setQueue(INITIAL_MOCK_APPOINTMENTS);
    setSelectedQueueItem(INITIAL_MOCK_APPOINTMENTS[0]);
    setActiveStep("Reception");
    showToast("Disconnected. Switched to Mock Local DB.", "info");
  };

  // Register another
  const handleRegisterAnother = () => {
    setActiveStep("Reception");
    setReceptionFormState({
      patient_name: "",
      mobile_number: "",
      email: "",
      gender: "Male",
      age: "",
      is_existing: false,
      medical_history: "",
      doctor: "Dr. Rajesh"
    });
  };

  // Render DB inspector content
  const renderDbContent = () => {
    if (dbTab === 'Patients') {
      const records = Object.values(patients);
      if (records.length === 0) {
        return <div style={{ color: 'var(--text-muted)' }}>No patient records in database.</div>;
      }
      return records.map((p, idx) => (
        <div key={idx} className="json-record">
          <span className="json-tag">"patient_name":</span> "{p.patient_name}", <br />
          <span className="json-tag">"mobile_number":</span> "{p.mobile_number}", <br />
          <span className="json-tag">"email":</span> "{p.email || ''}", <br />
          <span className="json-tag">"gender":</span> "{p.gender || 'Male'}", <br />
          <span className="json-tag">"age":</span> {p.age || 0}, <br />
          <div style={{ whiteSpace: 'pre-wrap' }}>
            <span className="json-tag">"medical_history":</span> "{p.medical_history?.replace(/\n/g, '\\n')}"
          </div>
        </div>
      ));
    } else {
      if (queue.length === 0) {
        return <div style={{ color: 'var(--text-muted)' }}>No walk-in appointment records.</div>;
      }
      return queue.map((item, idx) => (
        <div key={idx} className="json-record">
          <span className="json-tag">"name":</span> "{item.name}", <br />
          <span className="json-tag">"patient_name":</span> "{item.patient_name}", <br />
          <span className="json-tag">"mobile_number":</span> "{item.mobile_number}", <br />
          <span className="json-tag">"doctor":</span> "{item.doctor}", <br />
          <span className="json-tag">"appointment_status":</span> "{item.appointment_status}", <br />
          <span className="json-tag">"diagnosis":</span> "{item.diagnosis || ''}", <br />
          <span className="json-tag">"prescription":</span> "{item.prescription || ''}", <br />
          <span className="json-tag">"need_lab_test":</span> {item.need_lab_test || 0}, <br />
          <span className="json-tag">"lab_test_name":</span> "{item.lab_test_name || ''}", <br />
          <span className="json-tag">"lab_result":</span> "{item.lab_result || ''}", <br />
          <span className="json-tag">"need_medicines":</span> {item.need_medicines || 0}, <br />
          <span className="json-tag">"bill_amount":</span> {item.bill_amount || 0}, <br />
          <span className="json-tag">"payment_received":</span> {item.payment_received || 0}
        </div>
      ));
    }
  };

  const getPatientMetaHtml = (item) => {
    if (!item) return null;
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
    );
  };

  return (
    <>
      {/* Toast Notification Container */}
      <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 2000, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {toasts.map(t => (
          <div key={t.id} className="glass" style={{
            padding: '16px 24px',
            borderRadius: '12px',
            background: t.type === 'success' ? 'var(--accent-emerald)' : t.type === 'error' ? 'var(--accent-pink)' : 'var(--accent-indigo)',
            color: '#fff',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontWeight: 600,
            animation: 'slide-in 0.2s ease-out'
          }}>
            {t.type === 'success' && <CheckCircle size={20} />}
            {t.type === 'error' && <ShieldAlert size={20} />}
            {t.type === 'info' && <Activity size={20} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Frappe Login Connection Modal */}
      {showLoginModal && (
        <div className="login-modal-overlay">
          <form className="login-modal glass" onSubmit={handleLoginSubmit}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Database size={36} style={{ color: 'var(--accent-indigo)', margin: '0 auto' }} />
              <h2 style={{ fontSize: '22px' }}>Connect to Frappe Bench</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Logging in authenticates this portal to write directly to your database.
              </p>
            </div>
            
            <div className="form-group">
              <label htmlFor="login-host">Host URL</label>
              <input type="text" id="login-host" defaultValue="http://localhost:8000" required />
            </div>

            <div className="form-group">
              <label htmlFor="login-usr">Username</label>
              <input type="text" id="login-usr" value={loginUsr} onChange={e => setLoginUsr(e.target.value)} required />
            </div>

            <div className="form-group">
              <label htmlFor="login-pwd">Password</label>
              <input type="password" id="login-pwd" value={loginPwd} onChange={e => setLoginPwd(e.target.value)} required />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowLoginModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn" style={{ flex: 1 }} disabled={connecting}>
                <span>{connecting ? 'Connecting...' : 'Connect'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Header */}
      <header className="app-header glass">
        <div className="brand">
          <div className="brand-icon">
            <Heart size={28} style={{ color: '#fff' }} />
          </div>
          <div className="brand-title">
            <h1 className="text-gradient-cyan">THANGAM HOSPITAL</h1>
            <p>Integrated Hospital ERP Portal</p>
          </div>
        </div>
        
        <div className="server-config" style={{ 
          background: (useFrappe && isLoggedIn) ? 'rgba(16, 185, 129, 0.08)' : 'rgba(15, 23, 42, 0.03)',
          borderColor: (useFrappe && isLoggedIn) ? 'rgba(16, 185, 129, 0.2)' : 'var(--card-border)',
          border: '1px solid'
        }}>
          <div className="server-status">
            <span className={`status-dot ${useFrappe && isLoggedIn ? 'online' : 'offline'}`}></span>
            <span style={{ color: (useFrappe && isLoggedIn) ? 'var(--accent-emerald)' : 'var(--text-secondary)' }}>
              {useFrappe && isLoggedIn ? 'Database: Frappe Bench' : 'Database: Simulator Mode'}
            </span>
          </div>
          {!isLoggedIn ? (
            <button className="btn" style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '20px' }} onClick={() => setShowLoginModal(true)}>
              <LogIn size={12} style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }} /> Connect Frappe
            </button>
          ) : (
            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '20px' }} onClick={handleLogout}>
              <LogOut size={12} style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }} /> Disconnect
            </button>
          )}
        </div>
      </header>

      {/* Workflow Stepper */}
      <section className="workflow-stepper glass">
        {[
          { key: "Reception", icon: <UserPlus size={20} />, label: "Reception" },
          { key: "Doctor", icon: <Stethoscope size={20} />, label: "Consultation" },
          { key: "Lab Test", icon: <FlaskConical size={20} />, label: "Lab Station" },
          { key: "Pharmacy", icon: <Pill size={20} />, label: "Pharmacy" },
          { key: "Billing", icon: <CreditCard size={20} />, label: "Billing & Pay" },
          { key: "Complete", icon: <CheckCircle size={20} />, label: "Complete" }
        ].map(step => {
          let nodeClass = "step-node";
          if (activeStep === step.key) nodeClass += " active";
          
          // Determine if completed
          const stepsOrder = ["Reception", "Doctor", "Lab Test", "Pharmacy", "Billing", "Complete"];
          const activeIndex = stepsOrder.indexOf(activeStep);
          const stepIndex = stepsOrder.indexOf(step.key);
          if (stepIndex < activeIndex) nodeClass += " completed";

          return (
            <div key={step.key} className={nodeClass} onClick={() => setActiveStep(step.key)}>
              <div className="step-circle">
                {step.icon}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
          );
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
                <h2 className="text-gradient-cyan">
                  <UserPlus size={22} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} /> Reception Desk
                </h2>
                <span className="badge badge-reception">Walk-In & Registry</span>
              </div>
              <div className="panel-body">
                {/* Search Record */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(15, 23, 42, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                  <label style={{ fontWeight: 600 }}>Find Existing Patient Records</label>
                  <form style={{ display: 'flex', gap: '12px' }} onSubmit={handleSearchPatient}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        type="text"
                        placeholder="Search by Mobile (e.g. 9876543210) or Name..."
                        style={{ paddingLeft: '44px', width: '100%' }}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn btn-secondary">
                      Check Record
                    </button>
                  </form>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    💡 Tip: Try typing "9876543210" or "Surya Prakash" to demo auto-loading reports!
                  </p>
                </div>

                {/* Patient Record Alert Banner */}
                {receptionFormState.is_existing && (
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
                <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={handleReceptionSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="reception-name">Patient Name *</label>
                      <input 
                        type="text" 
                        id="reception-name" 
                        placeholder="Enter full name" 
                        required 
                        disabled={receptionFormState.is_existing}
                        value={receptionFormState.patient_name}
                        onChange={e => setReceptionFormState({...receptionFormState, patient_name: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="reception-mobile">Mobile Number *</label>
                      <input 
                        type="tel" 
                        id="reception-mobile" 
                        placeholder="Enter 10-digit number" 
                        required 
                        disabled={receptionFormState.is_existing}
                        value={receptionFormState.mobile_number}
                        onChange={e => setReceptionFormState({...receptionFormState, mobile_number: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="reception-age">Age</label>
                      <input 
                        type="number" 
                        id="reception-age" 
                        placeholder="Age in years" 
                        disabled={receptionFormState.is_existing}
                        value={receptionFormState.age}
                        onChange={e => setReceptionFormState({...receptionFormState, age: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="reception-gender">Gender</label>
                      <select 
                        id="reception-gender"
                        disabled={receptionFormState.is_existing}
                        value={receptionFormState.gender}
                        onChange={e => setReceptionFormState({...receptionFormState, gender: e.target.value})}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="reception-email">Email Address</label>
                    <input 
                      type="email" 
                      id="reception-email" 
                      placeholder="patient@example.com" 
                      disabled={receptionFormState.is_existing}
                      value={receptionFormState.email}
                      onChange={e => setReceptionFormState({...receptionFormState, email: e.target.value})}
                    />
                  </div>

                  {receptionFormState.is_existing && (
                    <div className="form-group">
                      <label>Autoloaded Medical History & Past Reports</label>
                      <div className="history-card" style={{ borderColor: 'rgba(20, 184, 166, 0.2)' }}>
                        <div className="history-body">
                          {receptionFormState.medical_history || "No prior history logged."}
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '16px', marginTop: '8px' }} className="form-group">
                    <label style={{ fontWeight: 600 }}>Book Slot & Route Patient</label>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="reception-doctor">Assign Doctor</label>
                        <select 
                          id="reception-doctor"
                          value={receptionFormState.doctor}
                          onChange={e => setReceptionFormState({...receptionFormState, doctor: e.target.value})}
                        >
                          <option value="Dr. Rajesh">Dr. Rajesh (General Physician - Rs. 500)</option>
                          <option value="Dr. Priya">Dr. Priya (Cardiologist - Rs. 1000)</option>
                          <option value="Dr. Vignesh">Dr. Vignesh (Pediatrician - Rs. 600)</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn btn-teal" style={{ width: '100%' }}>
                          Book Walk-in Appointment <ChevronRight size={16} style={{ display: 'inline-block', verticalAlign: 'middle' }} />
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
                <h2 className="text-gradient-purple">
                  <Stethoscope size={22} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} /> Doctor Consultation
                </h2>
                <span className="badge badge-doctor">Clinical Diagnosis</span>
              </div>
              <div className="panel-body">
                {selectedQueueItem && selectedQueueItem.appointment_status === "Doctor Consultation" ? (
                  <div>
                    {getPatientMetaHtml(selectedQueueItem)}

                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label>Automatically Loaded Patient File & Reports</label>
                      <div className="history-card" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        <div className="history-body">
                          {patients[selectedQueueItem.mobile_number]?.medical_history || "No historical reports found."}
                        </div>
                      </div>
                    </div>

                    <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={handleDoctorSubmit}>
                      <div className="form-group">
                        <label>Consulting Doctor</label>
                        <input type="text" value={selectedQueueItem.doctor} disabled />
                      </div>

                      <div className="form-group">
                        <label htmlFor="doctor-diagnosis">Clinical Findings / Diagnosis *</label>
                        <textarea 
                          id="doctor-diagnosis" 
                          placeholder="Describe symptoms, diagnosis findings..." 
                          required
                          value={diagnosis}
                          onChange={e => setDiagnosis(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="doctor-prescription">Prescription (Medicines, dosage)</label>
                        <textarea 
                          id="doctor-prescription" 
                          placeholder="e.g. Paracetamol 650mg - 1-0-1 - 3 days&#10;Amoxicillin 500mg - 1-1-1 - 5 days"
                          value={prescription}
                          onChange={e => setPrescription(e.target.value)}
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="checkbox-label" htmlFor="doctor-need-lab">
                            <input 
                              type="checkbox" 
                              id="doctor-need-lab" 
                              checked={needLab}
                              onChange={e => setNeedLab(e.target.checked)}
                            />
                            Need Lab Diagnostic Test?
                          </label>
                        </div>
                        <div className="form-group">
                          <label className="checkbox-label" htmlFor="doctor-need-medicines">
                            <input 
                              type="checkbox" 
                              id="doctor-need-medicines" 
                              checked={needMedicines}
                              onChange={e => setNeedMedicines(e.target.checked)}
                            />
                            Dispense Medicines (Pharmacy)?
                          </label>
                        </div>
                      </div>

                      {needLab && (
                        <div className="form-group" style={{ animation: 'slide-in 0.2s ease-out' }}>
                          <label htmlFor="doctor-lab-test-name">Request Lab Test Name</label>
                          <select 
                            id="doctor-lab-test-name"
                            value={labTestName}
                            onChange={e => setLabTestName(e.target.value)}
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
                        Submit Consultation Notes <ChevronRight size={16} style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="empty-state">
                    <Clock size={48} style={{ margin: '0 auto 12px' }} />
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
                <h2 className="text-gradient-purple">
                  <FlaskConical size={22} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} /> Lab Diagnostic Station
                </h2>
                <span className="badge badge-lab">Lab Investigations</span>
              </div>
              <div className="panel-body">
                {selectedQueueItem && selectedQueueItem.appointment_status === "Lab Test" ? (
                  <div>
                    {getPatientMetaHtml(selectedQueueItem)}
                    
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid var(--card-border)', marginBottom: '16px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Requested Investigation</span>
                      <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--accent-cyan)', marginTop: '4px' }}>
                        {selectedQueueItem.lab_test_name || "Diagnostic Routine"}
                      </h3>
                    </div>

                    <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={handleLabSubmit}>
                      <div className="form-group">
                        <label htmlFor="lab-result">Enter Investigation Findings / Lab Results *</label>
                        <textarea 
                          id="lab-result" 
                          placeholder="e.g. Fasting blood sugar level: 104 mg/dL (Borderline)&#10;Platelet count: 2.1 Lakhs (Normal range)" 
                          required
                          value={labResult}
                          onChange={e => setLabResult(e.target.value)}
                        />
                      </div>
                      
                      <button type="submit" className="btn btn-teal" style={{ alignSelf: 'flex-end' }}>
                        Submit Lab Findings <ChevronRight size={16} style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="empty-state">
                    <FlaskConical size={48} style={{ margin: '0 auto 12px' }} />
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
                <h2 className="text-gradient-pink">
                  <Pill size={22} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} /> Pharmacy Desk
                </h2>
                <span className="badge badge-pharmacy">Dispense Medicines</span>
              </div>
              <div className="panel-body">
                {selectedQueueItem && selectedQueueItem.appointment_status === "Pharmacy" ? (
                  <div>
                    {getPatientMetaHtml(selectedQueueItem)}
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="form-group">
                        <label>Doctor's Prescribed Regimen</label>
                        <div className="history-card" style={{ background: '#ffffff', borderColor: 'rgba(236, 72, 153, 0.2)' }}>
                          <div className="history-body" style={{ color: 'var(--text-primary)' }}>
                            {selectedQueueItem.prescription || "No medicines listed."}
                          </div>
                        </div>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                        <h4 style={{ fontWeight: 600, marginBottom: '8px' }}>Dispensation Summary</h4>
                        <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)' }}>
                          <span>Pharmacy Package (Includes OTC + Prescribed Drugs)</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Rs. 250.00</span>
                        </div>
                      </div>

                      <button type="button" className="btn btn-teal" style={{ alignSelf: 'flex-end', marginTop: '8px' }} onClick={handlePharmacySubmit}>
                        Dispense & Close Regimen <ChevronRight size={16} style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <Pill size={48} style={{ margin: '0 auto 12px' }} />
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
                <h2 className="text-gradient-teal">
                  <CreditCard size={22} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} /> Billing & Payments
                </h2>
                <span className="badge badge-billing">Generate Invoices</span>
              </div>
              <div className="panel-body">
                {selectedQueueItem && selectedQueueItem.appointment_status === "Billing" ? (
                  <div>
                    {getPatientMetaHtml(selectedQueueItem)}
                    
                    <form onSubmit={handleBillingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="bill-summary">
                        <h4 style={{ fontWeight: 600, borderBottom: '1px solid var(--card-border)', paddingBottom: '8px', marginBottom: '8px' }}>Itemized Medical Receipt</h4>
                        
                        <div className="bill-item">
                          <span>Consultation Charge ({selectedQueueItem.doctor})</span>
                          <span>Rs. {DOCTOR_FEES[selectedQueueItem.doctor] || 500}.00</span>
                        </div>
                        
                        {selectedQueueItem.need_lab_test === 1 && (
                          <div className="bill-item">
                            <span>Lab Diagnostic Fee ({selectedQueueItem.lab_test_name})</span>
                            <span>Rs. 450.00</span>
                          </div>
                        )}

                        {selectedQueueItem.need_medicines === 1 && (
                          <div className="bill-item">
                            <span>Pharmacy Prescription Charge</span>
                            <span>Rs. 250.00</span>
                          </div>
                        )}

                        <div className="bill-item total">
                          <span>Grand Total Due</span>
                          <span style={{ color: '#000000' }}>
                            Rs. {(DOCTOR_FEES[selectedQueueItem.doctor] || 500) + (selectedQueueItem.need_lab_test ? 450 : 0) + (selectedQueueItem.need_medicines ? 250 : 0)}.00
                          </span>
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="billing-payment-method">Select Payment Mode</label>
                        <select 
                          id="billing-payment-method"
                          value={paymentMethod}
                          onChange={e => setPaymentMethod(e.target.value)}
                        >
                          <option value="UPI">UPI / QR Code Scan</option>
                          <option value="Card">Credit/Debit Card Terminal</option>
                          <option value="Cash">Cash Counter Payment</option>
                        </select>
                      </div>

                      <button type="submit" className="btn btn-teal" style={{ marginTop: '8px' }}>
                        Record Payment & Close Appointment <CheckCircle size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '4px' }} />
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="empty-state">
                    <CreditCard size={48} style={{ margin: '0 auto 12px' }} />
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
                
                {/* Success checkmark */}
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
                  <div className="glass" style={{ background: '#f8fafc', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '20px', maxWidth: '480px', margin: '0 auto', textAlign: 'left' }}>
                    <h4 style={{ fontWeight: 600, borderBottom: '1px dashed var(--card-border)', paddingBottom: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <History size={16} /> permanent File Updates
                    </h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      <strong>Patient Name:</strong> {selectedQueueItem.patient_name} <br />
                      <strong>Mobile:</strong> {selectedQueueItem.mobile_number} <br />
                      <strong>Assigned Doctor:</strong> {selectedQueueItem.doctor}
                    </p>
                    <div style={{ padding: '8px 12px', background: '#f1f5f9', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#000000' }}>
                      ✔ app.db.update("medical_history") <br />
                      ✔ Saved diagnosis: "{selectedQueueItem.diagnosis}"
                      {selectedQueueItem.need_lab_test === 1 && (
                        <> <br />✔ Saved lab report: "{selectedQueueItem.lab_result}" </>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '8px' }}>
                  <button className="btn" onClick={handleRegisterAnother}>
                    <Plus size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Register Another Patient
                  </button>
                  {selectedQueueItem && (
                    <a 
                      href={`http://localhost:8000/printview?doctype=Hospital Patient Walk In&name=${selectedQueueItem.name}&format=Standard`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-secondary"
                    >
                      <CreditCard size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Print Invoice (Frappe)
                    </a>
                  )}
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
              <h2 style={{ fontSize: '16px' }}>
                <Activity size={18} style={{ color: '#000000', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} /> Active Patient Board
              </h2>
              <span className="badge badge-reception" style={{ fontSize: '10px' }}>Live Queue</span>
            </div>
            
            <div className="panel-body" style={{ padding: '16px', maxHeight: '350px', overflowY: 'auto' }}>
              <div className="queue-list">
                {queue.filter(q => q.appointment_status !== 'Completed').map((item, idx) => {
                  const isActive = selectedQueueItem && selectedQueueItem.name === item.name;
                  let badgeClass = "badge badge-reception";
                  if (item.appointment_status === "Doctor Consultation") badgeClass = "badge badge-doctor";
                  else if (item.appointment_status === "Lab Test") badgeClass = "badge badge-lab";
                  else if (item.appointment_status === "Pharmacy") badgeClass = "badge badge-pharmacy";
                  else if (item.appointment_status === "Billing") badgeClass = "badge badge-billing";

                  return (
                    <div 
                      key={idx} 
                      className={`queue-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleSelectQueueItem(item)}
                    >
                      <div>
                        <div className="queue-item-name">{item.patient_name}</div>
                        <div className="queue-item-meta">{item.mobile_number} | {item.doctor}</div>
                      </div>
                      <span className={badgeClass}>{item.appointment_status === "Doctor Consultation" ? "Consultation" : item.appointment_status}</span>
                    </div>
                  );
                })}
              </div>
              {queue.filter(q => q.appointment_status !== 'Completed').length === 0 && (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <UserCheck size={36} style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '14px' }}>No active patients currently in queue.</p>
                </div>
              )}
            </div>
          </div>

          {/* QUICK DATABASE METRICS */}
          <div className="glass">
            <div className="panel-header">
              <h2 style={{ fontSize: '16px' }}>
                <Database size={18} style={{ color: '#000000', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} /> Patient Registry Summary
              </h2>
            </div>
            <div className="panel-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--card-border)', textAlign: 'center' }}>
                  <div id="metric-registered-patients" style={{ fontSize: '24px', fontWeight: 700, color: '#000000' }}>
                    {Object.keys(patients).length}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Registered Patients</div>
                </div>
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--card-border)', textAlign: 'center' }}>
                  <div id="metric-total-visits" style={{ fontSize: '24px', fontWeight: 700, color: '#000000' }}>
                    {queue.filter(q => q.appointment_status === 'Completed').length}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Visits Recorded</div>
                </div>
              </div>

              {/* Connected details */}
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px dashed var(--card-border)' }}>
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
            <Database size={18} style={{ color: '#000000' }} /> 
            Database Record Inspector (Live State)
          </h2>
          <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px' }} onClick={fetchFrappeData}>
            <RefreshCw size={10} style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }} /> Refresh Live state
          </button>
        </div>

        <div className="db-tabs">
          <div 
            className={`db-tab ${dbTab === 'Patients' ? 'active' : ''}`}
            onClick={() => setDbTab('Patients')}
          >
            Doctype: Hospital Patient ({Object.keys(patients).length} records)
          </div>
          <div 
            className={`db-tab ${dbTab === 'WalkIns' ? 'active' : ''}`}
            onClick={() => setDbTab('WalkIns')}
          >
            Doctype: Hospital Patient Walk In ({queue.length} records)
          </div>
        </div>

        <div className="db-content">
          {renderDbContent()}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: '24px', padding: '16px 0', borderTop: '1px solid var(--border)', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
        Hospital ERP Workflow Demo &copy; 2026. Made with Google Gemini Antigravity Agent.
      </footer>
    </>
  );
}
