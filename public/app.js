// Doctor Consultation Fees
const DOCTOR_FEES = {
  "Dr. Rajesh": 500,
  "Dr. Priya": 1000,
  "Dr. Vignesh": 600
};

// Initial Mock Data
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

// App State
let patients = JSON.parse(JSON.stringify(INITIAL_MOCK_PATIENTS));
let queue = JSON.parse(JSON.stringify(INITIAL_MOCK_APPOINTMENTS));
let activeStep = "Reception"; // Reception, Doctor, Lab Test, Pharmacy, Billing, Complete
let selectedQueueItem = queue[0] || null;
let useFrappe = false;
let isLoggedIn = false;
let dbTab = "Patients"; // Patients, WalkIns

// Reception Form State
let receptionFormState = {
  patient_name: "",
  mobile_number: "",
  email: "",
  gender: "Male",
  age: "",
  doctor: "Dr. Rajesh",
  is_existing: false,
  medical_history: ""
};

// Toast Notifications Helper
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.style.position = "fixed";
  toast.style.top = "24px";
  toast.style.right = "24px";
  toast.style.padding = "16px 24px";
  toast.style.borderRadius = "12px";
  
  let bg = "var(--accent-indigo)";
  let iconName = "sparkles";
  if (type === "success") {
    bg = "var(--accent-teal)";
    iconName = "check-circle";
  } else if (type === "error") {
    bg = "var(--accent-pink)";
    iconName = "alert-circle";
  }
  
  toast.style.background = bg;
  toast.style.color = "#fff";
  toast.style.boxShadow = "var(--shadow-lg)";
  toast.style.zIndex = "2000";
  toast.style.display = "flex";
  toast.style.alignItems = "center";
  toast.style.gap = "12px";
  toast.style.fontWeight = "600";
  toast.style.animation = "slide-in 0.2s ease-out";

  toast.innerHTML = `<i data-lucide="${iconName}" style="width: 20px; height: 20px;"></i> <span>${message}</span>`;
  container.appendChild(toast);
  
  // Render Lucide icon inside toast
  if (window.lucide) {
    window.lucide.createIcons({ attrs: { class: 'lucide-icon' } });
  }

  // Remove after 4s
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.5s ease";
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 500);
  }, 4000);
}

// Render Header & Connection Section
function renderServerConfig() {
  const serverConfigBar = document.getElementById("server-config-bar");
  const statusDot = document.getElementById("status-dot");
  const statusText = document.getElementById("status-text");
  const btnConnect = document.getElementById("btn-connect-frappe");
  const btnDisconnect = document.getElementById("btn-disconnect-frappe");

  if (useFrappe && isLoggedIn) {
    statusDot.className = "status-dot online";
    statusText.innerText = "Database: Frappe Bench";
    statusText.style.color = "var(--accent-emerald)";
    serverConfigBar.style.background = "rgba(16, 185, 129, 0.08)";
    serverConfigBar.style.borderColor = "rgba(16, 185, 129, 0.2)";
    btnConnect.classList.add("hidden");
    btnDisconnect.classList.remove("hidden");
  } else {
    statusDot.className = "status-dot offline";
    statusText.innerText = "Database: Simulator Mode";
    statusText.style.color = "var(--text-secondary)";
    serverConfigBar.style.background = "rgba(255, 255, 255, 0.03)";
    serverConfigBar.style.borderColor = "var(--card-border)";
    btnConnect.classList.remove("hidden");
    btnDisconnect.classList.add("hidden");
  }
}

// Stepper Progress Nodes
function renderStepper() {
  const steps = ["Reception", "Doctor", "Lab Test", "Pharmacy", "Billing", "Complete"];
  const currentIndex = steps.indexOf(activeStep);

  const stepNodes = document.querySelectorAll(".workflow-stepper .step-node");
  stepNodes.forEach((node, index) => {
    const stepName = node.getAttribute("data-step");
    node.className = "step-node";
    
    if (activeStep === stepName) {
      node.classList.add("active");
    } else if (index < currentIndex) {
      node.classList.add("completed");
    }
  });
}

// Render live registry statistics and sidebar lists
function renderSidebar() {
  // Render metrics
  document.getElementById("metric-registered-patients").innerText = Object.keys(patients).length;
  document.getElementById("metric-total-visits").innerText = queue.length;

  // Render queue monitor list
  const activeQueueList = document.getElementById("active-queue-list");
  const activeQueueEmpty = document.getElementById("active-queue-empty");
  activeQueueList.innerHTML = "";

  const activeWalkins = queue.filter(q => q.appointment_status !== "Completed");

  if (activeWalkins.length > 0) {
    activeQueueEmpty.classList.add("hidden");
    activeWalkins.forEach(item => {
      const isActive = selectedQueueItem && selectedQueueItem.name === item.name;
      
      const badgeClass = `badge-${item.appointment_status.toLowerCase().replace(/\s+/g, '')}`;
      
      const itemEl = document.createElement("div");
      itemEl.className = `queue-item ${isActive ? 'active' : ''}`;
      itemEl.innerHTML = `
        <div>
          <div class="queue-item-name">${item.patient_name}</div>
          <div class="queue-item-meta">
            ${item.mobile_number} | ${item.doctor}
          </div>
        </div>
        <span class="badge ${badgeClass}">
          ${item.appointment_status}
        </span>
      `;

      itemEl.addEventListener("click", () => {
        selectedQueueItem = item;
        activeStep = item.appointment_status;
        renderApp();
      });

      activeQueueList.appendChild(itemEl);
    });
  } else {
    activeQueueEmpty.classList.remove("hidden");
  }
}

// Render Database live JSON state inspector
function renderInspector() {
  const tabPatients = document.getElementById("tab-db-patients");
  const tabWalkins = document.getElementById("tab-db-walkins");
  const contentEl = document.getElementById("inspector-db-content");
  
  document.getElementById("inspector-patients-count").innerText = Object.keys(patients).length;
  document.getElementById("inspector-walkins-count").innerText = queue.length;

  if (dbTab === "Patients") {
    tabPatients.classList.add("active");
    tabWalkins.classList.remove("active");
    
    if (Object.keys(patients).length > 0) {
      contentEl.innerHTML = Object.values(patients).map(p => `
        <div class="json-record">
          <div><span class="json-tag">"name":</span> "${p.mobile_number}",</div>
          <div><span class="json-tag">"patient_name":</span> "${p.patient_name}",</div>
          <div><span class="json-tag">"mobile_number":</span> "${p.mobile_number}",</div>
          <div><span class="json-tag">"email":</span> "${p.email || ""}",</div>
          <div><span class="json-tag">"gender":</span> "${p.gender}",</div>
          <div><span class="json-tag">"age":</span> ${p.age || 0},</div>
          <div style="white-space: pre-wrap;"><span class="json-tag">"medical_history":</span> "${(p.medical_history || "").replace(/\n/g, '\\n')}"</div>
        </div>
      `).join("");
    } else {
      contentEl.innerHTML = `<div style="color: var(--text-muted);">No patient records in database.</div>`;
    }
  } else {
    tabPatients.classList.remove("active");
    tabWalkins.classList.add("active");

    if (queue.length > 0) {
      contentEl.innerHTML = queue.map(q => `
        <div class="json-record">
          <div><span class="json-tag">"name":</span> "${q.name}",</div>
          <div><span class="json-tag">"patient_name":</span> "${q.patient_name}",</div>
          <div><span class="json-tag">"mobile_number":</span> "${q.mobile_number}",</div>
          <div><span class="json-tag">"doctor":</span> "${q.doctor}",</div>
          <div><span class="json-tag">"appointment_status":</span> "${q.appointment_status}",</div>
          <div><span class="json-tag">"diagnosis":</span> "${q.diagnosis || ""}",</div>
          <div><span class="json-tag">"prescription":</span> "${q.prescription || ""}",</div>
          <div><span class="json-tag">"need_lab_test":</span> ${q.need_lab_test || 0},</div>
          <div><span class="json-tag">"lab_test_name":</span> "${q.lab_test_name || ""}",</div>
          <div><span class="json-tag">"lab_result":</span> "${q.lab_result || ""}",</div>
          <div><span class="json-tag">"bill_amount":</span> ${q.bill_amount || 0},</div>
          <div><span class="json-tag">"payment_received":</span> ${q.payment_received || 0}</div>
        </div>
      `).join("");
    } else {
      contentEl.innerHTML = `<div style="color: var(--text-muted);">No walk-in appointment records.</div>`;
    }
  }
}

// Generate metadata snippet for patient headers
function getPatientMetaHtml(item) {
  if (!item) return "";
  return `
    <div class="patient-found-alert" style="background: rgba(99, 102, 241, 0.1); border-color: rgba(99, 102, 241, 0.2); margin-bottom: 16px;">
      <div class="icon-wrapper" style="background: rgba(99, 102, 241, 0.2); color: var(--accent-indigo);">
        <i data-lucide="user-check" style="width: 18px; height: 18px;"></i>
      </div>
      <div>
        <h4 style="font-weight: 600;">${item.patient_name} (${item.mobile_number})</h4>
        <p style="font-size: 13px; color: var(--text-secondary);">
          Assigned Doctor: ${item.doctor} | ID: ${item.name}
        </p>
      </div>
    </div>
  `;
}

// Sync function with Frappe Server API
async function fetchFrappeData() {
  try {
    // 1. Fetch Patients
    const resPatients = await fetch('/api/resource/Hospital Patient?fields=["*"]&limit=100');
    if (resPatients.ok) {
      const rawP = await resPatients.json();
      const patientMap = {};
      (rawP.data || []).forEach(p => {
        patientMap[p.mobile_number] = p;
      });
      patients = patientMap;
    }

    // 2. Fetch Walk-ins
    const resWalkins = await fetch('/api/resource/Hospital Patient Walk In?fields=["*"]&limit=100&order_by=creation desc');
    if (resWalkins.ok) {
      const rawW = await resWalkins.json();
      queue = rawW.data || [];
      
      // Auto-select first active item in queue if none selected
      const activeItems = queue.filter(q => q.appointment_status !== "Completed");
      if (activeItems.length > 0) {
        // Find if current selected item is still in active queue, if not, select the first
        const isStillActive = activeItems.some(q => selectedQueueItem && q.name === selectedQueueItem.name);
        if (!isStillActive) {
          selectedQueueItem = activeItems[0];
          activeStep = selectedQueueItem.appointment_status;
        }
      }
    }
    renderApp();
  } catch (e) {
    showToast("Failed to refresh records from Frappe server.", "error");
    console.error(e);
  }
}

// Core app render routine
function renderApp() {
  renderServerConfig();
  renderStepper();
  renderSidebar();
  renderInspector();

  // Hide all panels
  document.querySelectorAll(".panel-container").forEach(el => el.classList.add("hidden"));

  // Show panel and render its specific content based on activeStep
  if (activeStep === "Reception") {
    document.getElementById("panel-reception").classList.remove("hidden");
    
    const banner = document.getElementById("reception-alert-banner");
    const historyGroup = document.getElementById("reception-history-group");
    const historyContent = document.getElementById("reception-history-content");
    const mobileInput = document.getElementById("reception-mobile");
    const nameInput = document.getElementById("reception-name");
    const ageInput = document.getElementById("reception-age");
    const genderSelect = document.getElementById("reception-gender");
    const emailInput = document.getElementById("reception-email");

    if (receptionFormState.is_existing) {
      banner.classList.remove("hidden");
      historyGroup.classList.remove("hidden");
      historyContent.innerText = receptionFormState.medical_history || "No prior history logged.";
      mobileInput.disabled = true;
      nameInput.disabled = true;
      ageInput.disabled = true;
      genderSelect.disabled = true;
      emailInput.disabled = true;
    } else {
      banner.classList.add("hidden");
      historyGroup.classList.add("hidden");
      mobileInput.disabled = false;
      nameInput.disabled = false;
      ageInput.disabled = false;
      genderSelect.disabled = false;
      emailInput.disabled = false;
    }

    // Set input values
    nameInput.value = receptionFormState.patient_name;
    mobileInput.value = receptionFormState.mobile_number;
    ageInput.value = receptionFormState.age;
    genderSelect.value = receptionFormState.gender;
    emailInput.value = receptionFormState.email;
    document.getElementById("reception-doctor").value = receptionFormState.doctor;

  } else if (activeStep === "Doctor") {
    document.getElementById("panel-doctor").classList.remove("hidden");
    const activeView = document.getElementById("doctor-active-view");
    const emptyView = document.getElementById("doctor-empty-view");

    if (selectedQueueItem && selectedQueueItem.appointment_status === "Doctor Consultation") {
      activeView.classList.remove("hidden");
      emptyView.classList.add("hidden");

      document.getElementById("doctor-patient-meta").innerHTML = getPatientMetaHtml(selectedQueueItem);
      document.getElementById("doctor-assigned-name").value = selectedQueueItem.doctor;

      // History lookup
      const patientFile = patients[selectedQueueItem.mobile_number];
      document.getElementById("doctor-history-content").innerText = (patientFile && patientFile.medical_history) || "No historical reports found.";

      // Reset form controls
      document.getElementById("doctor-diagnosis").value = "";
      document.getElementById("doctor-prescription").value = "";
      document.getElementById("doctor-need-lab").checked = false;
      document.getElementById("doctor-need-medicines").checked = false;
      document.getElementById("doctor-lab-test-group").classList.add("hidden");
    } else {
      activeView.classList.add("hidden");
      emptyView.classList.remove("hidden");
    }

  } else if (activeStep === "Lab Test") {
    document.getElementById("panel-lab").classList.remove("hidden");
    const activeView = document.getElementById("lab-active-view");
    const emptyView = document.getElementById("lab-empty-view");

    if (selectedQueueItem && selectedQueueItem.appointment_status === "Lab Test") {
      activeView.classList.remove("hidden");
      emptyView.classList.add("hidden");

      document.getElementById("lab-patient-meta").innerHTML = getPatientMetaHtml(selectedQueueItem);
      document.getElementById("lab-test-title").innerText = selectedQueueItem.lab_test_name || "Diagnostic Routine";
      document.getElementById("lab-result").value = "";
    } else {
      activeView.classList.add("hidden");
      emptyView.classList.remove("hidden");
    }

  } else if (activeStep === "Pharmacy") {
    document.getElementById("panel-pharmacy").classList.remove("hidden");
    const activeView = document.getElementById("pharmacy-active-view");
    const emptyView = document.getElementById("pharmacy-empty-view");

    if (selectedQueueItem && selectedQueueItem.appointment_status === "Pharmacy") {
      activeView.classList.remove("hidden");
      emptyView.classList.add("hidden");

      document.getElementById("pharmacy-patient-meta").innerHTML = getPatientMetaHtml(selectedQueueItem);
      document.getElementById("pharmacy-regimen-content").innerText = selectedQueueItem.prescription || "No medicines listed.";
    } else {
      activeView.classList.add("hidden");
      emptyView.classList.remove("hidden");
    }

  } else if (activeStep === "Billing") {
    document.getElementById("panel-billing").classList.remove("hidden");
    const activeView = document.getElementById("billing-active-view");
    const emptyView = document.getElementById("billing-empty-view");

    if (selectedQueueItem && selectedQueueItem.appointment_status === "Billing") {
      activeView.classList.remove("hidden");
      emptyView.classList.add("hidden");

      document.getElementById("billing-patient-meta").innerHTML = getPatientMetaHtml(selectedQueueItem);

      // Calculations
      const docFee = DOCTOR_FEES[selectedQueueItem.doctor] || 500;
      const labFee = selectedQueueItem.need_lab_test ? 450 : 0;
      const pharmFee = selectedQueueItem.need_medicines ? 250 : 0;
      const grandTotal = docFee + labFee + pharmFee;

      document.getElementById("bill-doc-label").innerText = `Consultation Charge (${selectedQueueItem.doctor})`;
      document.getElementById("bill-doc-fee").innerText = `Rs. ${docFee}.00`;
      
      const labRow = document.getElementById("bill-lab-row");
      if (selectedQueueItem.need_lab_test === 1) {
        labRow.classList.remove("hidden");
        document.getElementById("bill-lab-label").innerText = `Lab Diagnostic Fee (${selectedQueueItem.lab_test_name})`;
        document.getElementById("bill-lab-fee").innerText = `Rs. ${labFee}.00`;
      } else {
        labRow.classList.add("hidden");
      }

      const pharmRow = document.getElementById("bill-pharmacy-row");
      if (selectedQueueItem.need_medicines === 1) {
        pharmRow.classList.remove("hidden");
      } else {
        pharmRow.classList.add("hidden");
      }

      document.getElementById("bill-grand-total").innerText = `Rs. ${grandTotal}.00`;
    } else {
      activeView.classList.add("hidden");
      emptyView.classList.remove("hidden");
    }

  } else if (activeStep === "Complete") {
    document.getElementById("panel-complete").classList.remove("hidden");
    
    const summaryCard = document.getElementById("complete-summary-card");
    if (selectedQueueItem) {
      summaryCard.classList.remove("hidden");
      document.getElementById("complete-patient-name").innerText = selectedQueueItem.patient_name;
      document.getElementById("complete-patient-mobile").innerText = selectedQueueItem.mobile_number;
      document.getElementById("complete-patient-doctor").innerText = selectedQueueItem.doctor;

      let labText = selectedQueueItem.need_lab_test === 1 ? `<br>✔ Saved lab report: "${selectedQueueItem.lab_result}"` : "";
      document.getElementById("complete-db-logs").innerHTML = `
        ✔ app.db.update("medical_history") <br>
        ✔ Saved diagnosis: "${selectedQueueItem.diagnosis}"
        ${labText}
      `;
    } else {
      summaryCard.classList.add("hidden");
    }
  }

  // Create Lucide vectors
  if (window.lucide) {
    window.lucide.createIcons({ attrs: { class: 'lucide-icon' } });
  }
}

// ----------------------------------------------------
// EVENT LISTENERS & HANDLERS
// ----------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  // Stepper Node Clicks
  document.querySelectorAll(".workflow-stepper .step-node").forEach(node => {
    node.addEventListener("click", () => {
      const step = node.getAttribute("data-step");
      activeStep = step;
      renderApp();
    });
  });

  // DB Tab Clicks
  document.getElementById("tab-db-patients").addEventListener("click", () => {
    dbTab = "Patients";
    renderInspector();
  });
  document.getElementById("tab-db-walkins").addEventListener("click", () => {
    dbTab = "WalkIns";
    renderInspector();
  });

  // Connection triggers
  document.getElementById("btn-connect-frappe").addEventListener("click", () => {
    document.getElementById("login-modal-overlay").classList.remove("hidden");
  });
  document.getElementById("btn-login-cancel").addEventListener("click", () => {
    document.getElementById("login-modal-overlay").classList.add("hidden");
  });

  // Logout Trigger
  document.getElementById("btn-disconnect-frappe").addEventListener("click", () => {
    isLoggedIn = false;
    useFrappe = false;
    // Reset to mock records
    patients = JSON.parse(JSON.stringify(INITIAL_MOCK_PATIENTS));
    queue = JSON.parse(JSON.stringify(INITIAL_MOCK_APPOINTMENTS));
    selectedQueueItem = queue[0] || null;
    activeStep = "Reception";
    showToast("Disconnected. Switched to Mock Local DB.", "info");
    renderApp();
  });

  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const usr = document.getElementById("login-usr").value.trim();
    const pwd = document.getElementById("login-pwd").value;
    const btnSubmit = document.getElementById("btn-login-submit");
    const submitText = document.getElementById("login-submit-text");

    btnSubmit.disabled = true;
    submitText.innerHTML = `<i data-lucide="refresh-cw" class="animate-spin" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle;"></i> Connecting...`;
    if (window.lucide) window.lucide.createIcons();

    try {
      const res = await fetch("/api/method/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ usr, pwd })
      });

      if (res.ok) {
        isLoggedIn = true;
        useFrappe = true;
        document.getElementById("login-modal-overlay").classList.add("hidden");
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
      btnSubmit.disabled = false;
      submitText.innerText = "Connect";
    }
  });

  // DB Inspector Manual Refresh
  document.getElementById("btn-refresh-inspector").addEventListener("click", () => {
    if (useFrappe && isLoggedIn) {
      fetchFrappeData();
    } else {
      showToast("Simulator DB Refreshed", "success");
      renderApp();
    }
  });

  // Search Patient record
  async function searchPatient() {
    const query = document.getElementById("search-query").value.trim();
    if (!query) {
      showToast("Please enter Name or Mobile Number to search.", "info");
      return;
    }

    showToast(`Searching for patient: "${query}"...`, "info");

    const foundByMobile = patients[query];
    const foundByName = Object.values(patients).find(p => p.patient_name.toLowerCase() === query.toLowerCase());
    const foundPatient = foundByMobile || foundByName;

    if (foundPatient) {
      receptionFormState = {
        patient_name: foundPatient.patient_name,
        mobile_number: foundPatient.mobile_number,
        email: foundPatient.email || "",
        gender: foundPatient.gender || "Male",
        age: foundPatient.age || "",
        is_existing: true,
        medical_history: foundPatient.medical_history || "",
        doctor: document.getElementById("reception-doctor").value
      };
      showToast(`Patient Found! Auto-loaded records for ${foundPatient.patient_name}`, "success");
      renderApp();
    } else {
      if (useFrappe && isLoggedIn) {
        try {
          const res = await fetch(`/api/resource/Hospital Patient?filters=[["Hospital Patient","mobile_number","=","${query}"]]&fields=["*"]`);
          if (res.ok) {
            const raw = await res.json();
            if (raw.data && raw.data.length > 0) {
              const p = raw.data[0];
              receptionFormState = {
                patient_name: p.patient_name,
                mobile_number: p.mobile_number,
                email: p.email || "",
                gender: p.gender || "Male",
                age: p.age || "",
                is_existing: true,
                medical_history: p.medical_history || "",
                doctor: document.getElementById("reception-doctor").value
              };
              patients[p.mobile_number] = p;
              showToast(`Patient Found in Frappe! Auto-loaded reports.`, "success");
              renderApp();
              return;
            }
          }
        } catch (err) {
          console.error(err);
        }
      }

      // Truly not found
      const isNum = !isNaN(query);
      receptionFormState = {
        patient_name: isNum ? "" : query,
        mobile_number: isNum ? query : "",
        email: "",
        gender: "Male",
        age: "",
        is_existing: false,
        medical_history: "",
        doctor: document.getElementById("reception-doctor").value
      };
      showToast("No existing records found. Creating new patient card.", "info");
      renderApp();
    }
  }

  document.getElementById("btn-search-patient").addEventListener("click", searchPatient);
  document.getElementById("search-query").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      searchPatient();
    }
  });

  // Registration & Book Slot Walkin
  document.getElementById("reception-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const patient_name = document.getElementById("reception-name").value.trim();
    const mobile_number = document.getElementById("reception-mobile").value.trim();
    const age = parseInt(document.getElementById("reception-age").value) || 0;
    const gender = document.getElementById("reception-gender").value;
    const email = document.getElementById("reception-email").value.trim();
    const doctor = document.getElementById("reception-doctor").value;

    if (!patient_name || !mobile_number) {
      showToast("Patient Name and Mobile Number are required.", "error");
      return;
    }

    const payloadPatient = {
      patient_name,
      mobile_number,
      email,
      gender,
      age,
      medical_history: receptionFormState.medical_history || ""
    };

    if (useFrappe && isLoggedIn) {
      try {
        if (!receptionFormState.is_existing) {
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
          is_existing: receptionFormState.is_existing ? 1 : 0,
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
        activeStep = "Doctor";
        renderApp();
      } catch (err) {
        showToast(err.message || "Error saving to Frappe.", "error");
        console.error(err);
      }
    } else {
      // Local Save
      if (!receptionFormState.is_existing) {
        patients[mobile_number] = payloadPatient;
      }

      const walkinId = `HOSP-WALK-2026-${String(queue.length + 1).padStart(5, '0')}`;
      const newWalkin = {
        name: walkinId,
        patient_name,
        mobile_number,
        patient: mobile_number,
        is_existing: receptionFormState.is_existing ? 1 : 0,
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

      queue.unshift(newWalkin);
      selectedQueueItem = newWalkin;
      showToast("Appointment Booked locally! Redirected to Doctor Desk.", "success");
      activeStep = "Doctor";
      
      // Reset form state
      receptionFormState = {
        patient_name: "",
        mobile_number: "",
        email: "",
        gender: "Male",
        age: "",
        is_existing: false,
        medical_history: "",
        doctor: "Dr. Rajesh"
      };

      renderApp();
    }
  });

  // Doctor diagnosis checkbox handlers
  document.getElementById("doctor-need-lab").addEventListener("change", (e) => {
    const labGroup = document.getElementById("doctor-lab-test-group");
    if (e.target.checked) {
      labGroup.classList.remove("hidden");
    } else {
      labGroup.classList.add("hidden");
    }
  });

  // Doctor Submit Consultation Notes
  document.getElementById("doctor-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!selectedQueueItem) return;

    const diagnosis = document.getElementById("doctor-diagnosis").value.trim();
    const prescription = document.getElementById("doctor-prescription").value.trim();
    const need_lab_test = document.getElementById("doctor-need-lab").checked;
    const lab_test_name = document.getElementById("doctor-lab-test-name").value;
    const need_medicines = document.getElementById("doctor-need-medicines").checked;

    if (!diagnosis) {
      showToast("Diagnosis is required for doctor consultation.", "error");
      return;
    }

    let nextStatus = "Billing";
    if (need_lab_test) {
      nextStatus = "Lab Test";
    } else if (need_medicines) {
      nextStatus = "Pharmacy";
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
        };

        const res = await fetch(`/api/resource/Hospital Patient Walk In/${selectedQueueItem.name}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          throw new Error("Failed to update Consultation in Frappe.");
        }

        showToast("Consultation submitted. Patient routed to " + nextStatus, "success");
        await fetchFrappeData();
        activeStep = nextStatus;
        renderApp();
      } catch (err) {
        showToast(err.message, "error");
        console.error(err);
      }
    } else {
      // Local Save
      queue = queue.map(q => {
        if (q.name === selectedQueueItem.name) {
          const updated = {
            ...q,
            diagnosis,
            prescription,
            need_lab_test: need_lab_test ? 1 : 0,
            lab_test_name: need_lab_test ? lab_test_name : "",
            need_medicines: need_medicines ? 1 : 0,
            appointment_status: nextStatus
          };
          selectedQueueItem = updated;
          return updated;
        }
        return q;
      });

      showToast("Consultation saved locally! Redirected to " + nextStatus, "success");
      activeStep = nextStatus;
      renderApp();
    }
  });

  // Lab Results Submit
  document.getElementById("lab-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!selectedQueueItem) return;

    const lab_result = document.getElementById("lab-result").value.trim();
    if (!lab_result) {
      showToast("Please enter the lab result findings.", "error");
      return;
    }

    let nextStatus = selectedQueueItem.need_medicines ? "Pharmacy" : "Billing";

    if (useFrappe && isLoggedIn) {
      try {
        const payload = {
          lab_result,
          lab_test_status: "Completed",
          appointment_status: nextStatus
        };

        const res = await fetch(`/api/resource/Hospital Patient Walk In/${selectedQueueItem.name}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          throw new Error("Failed to save Lab reports in Frappe.");
        }

        showToast("Lab reports submitted. Routed to " + nextStatus, "success");
        await fetchFrappeData();
        activeStep = nextStatus;
        renderApp();
      } catch (err) {
        showToast(err.message, "error");
        console.error(err);
      }
    } else {
      queue = queue.map(q => {
        if (q.name === selectedQueueItem.name) {
          const updated = {
            ...q,
            lab_result,
            lab_test_status: "Completed",
            appointment_status: nextStatus
          };
          selectedQueueItem = updated;
          return updated;
        }
        return q;
      });

      showToast("Lab report logged locally! Moving to " + nextStatus, "success");
      activeStep = nextStatus;
      renderApp();
    }
  });

  // Pharmacy dispense submit
  document.getElementById("btn-pharmacy-submit").addEventListener("click", async () => {
    if (!selectedQueueItem) return;

    let nextStatus = "Billing";

    if (useFrappe && isLoggedIn) {
      try {
        const payload = {
          pharmacy_status: "Completed",
          appointment_status: nextStatus
        };

        const res = await fetch(`/api/resource/Hospital Patient Walk In/${selectedQueueItem.name}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          throw new Error("Failed to update Pharmacy status in Frappe.");
        }

        showToast("Medicines dispensed. Routed to Billing Desk.", "success");
        await fetchFrappeData();
        activeStep = nextStatus;
        renderApp();
      } catch (err) {
        showToast(err.message, "error");
        console.error(err);
      }
    } else {
      queue = queue.map(q => {
        if (q.name === selectedQueueItem.name) {
          const updated = {
            ...q,
            pharmacy_status: "Completed",
            appointment_status: nextStatus
          };
          selectedQueueItem = updated;
          return updated;
        }
        return q;
      });

      showToast("Pharmacy items dispensed locally! Moving to Billing.", "success");
      activeStep = nextStatus;
      renderApp();
    }
  });

  // Billing submit handler
  document.getElementById("billing-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!selectedQueueItem) return;

    const paymentMethod = document.getElementById("billing-payment-method").value;
    const docFee = DOCTOR_FEES[selectedQueueItem.doctor] || 500;
    const labFee = selectedQueueItem.need_lab_test ? 450 : 0;
    const pharmFee = selectedQueueItem.need_medicines ? 250 : 0;
    const total = docFee + labFee + pharmFee;

    const today = new Date().toISOString().split('T')[0];

    const newReportBlock = `Visit Date: ${today}
Doctor: ${selectedQueueItem.doctor}
Diagnosis: ${selectedQueueItem.diagnosis}
Prescription: ${selectedQueueItem.prescription || "None"}
Lab Test: ${selectedQueueItem.need_lab_test ? `${selectedQueueItem.lab_test_name} - Result: ${selectedQueueItem.lab_result}` : "None"}
Pharmacy status: ${selectedQueueItem.need_medicines ? "Medicines Dispensed" : "None"}
Total Bill: Rs. ${total} (Paid via ${paymentMethod})
Status: Completed.`;

    if (useFrappe && isLoggedIn) {
      try {
        const payloadWalkin = {
          bill_amount: total,
          payment_received: 1,
          payment_method: paymentMethod,
          appointment_status: "Completed"
        };

        const resWalkin = await fetch(`/api/resource/Hospital Patient Walk In/${selectedQueueItem.name}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadWalkin)
        });

        if (!resWalkin.ok) {
          throw new Error("Failed to close Walk-in report in Frappe.");
        }

        const pResponse = await fetch(`/api/resource/Hospital Patient/${selectedQueueItem.mobile_number}`);
        if (pResponse.ok) {
          const pData = await pResponse.json();
          const oldHistory = pData.data.medical_history || "";
          const newHistory = oldHistory ? `${newReportBlock}\n\n${oldHistory}` : newReportBlock;

          await fetch(`/api/resource/Hospital Patient/${selectedQueueItem.mobile_number}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ medical_history: newHistory })
          });
        }

        showToast("Payment recorded. Medical records updated!", "success");
        await fetchFrappeData();
        activeStep = "Complete";
        renderApp();
      } catch (err) {
        showToast(err.message, "error");
        console.error(err);
      }
    } else {
      // Local Save
      queue = queue.map(q => {
        if (q.name === selectedQueueItem.name) {
          const updated = {
            ...q,
            bill_amount: total,
            payment_received: 1,
            payment_method: paymentMethod,
            appointment_status: "Completed"
          };
          selectedQueueItem = updated;
          return updated;
        }
        return q;
      });

      const patientMobile = selectedQueueItem.mobile_number;
      const existingPatient = patients[patientMobile];
      if (existingPatient) {
        const oldH = existingPatient.medical_history || "";
        const newH = oldH ? `${newReportBlock}\n\n${oldH}` : newReportBlock;
        patients[patientMobile] = {
          ...existingPatient,
          medical_history: newH
        };
      }

      showToast("Payment received! History saved in simulator.", "success");
      activeStep = "Complete";
      renderApp();
    }
  });

  // Register another patient trigger
  document.getElementById("btn-register-another").addEventListener("click", () => {
    activeStep = "Reception";
    receptionFormState = {
      patient_name: "",
      mobile_number: "",
      email: "",
      gender: "Male",
      age: "",
      is_existing: false,
      medical_history: "",
      doctor: "Dr. Rajesh"
    };
    renderApp();
  });

  // Initial render on load
  renderApp();
});
