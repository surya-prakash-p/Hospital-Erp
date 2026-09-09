"use client";

import { useState, useEffect } from "react";
import {
  Stethoscope, CheckCircle, AlertCircle, Info, Activity, History, Send,
  Printer, BadgeCheck, FileText, Sun, Moon, Clock, Utensils, Calendar, Plus, X, Pill
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { getQueue, getDoctors, getMedicines, getPatient, updateWalkIn } from "@/lib/hospital-service";

export default function ConsultationPage() {
  const { user, hasRole } = useAuth();
  const [queue, setQueue] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [selectedWalkIn, setSelectedWalkIn] = useState(null);
  const [selectedPatientHistory, setSelectedPatientHistory] = useState("");
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Form States
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [needMedicines, setNeedMedicines] = useState(false);
  const [nextCheckupDate, setNextCheckupDate] = useState("");
  
  // Autocomplete Inventory Medicine States
  const [searchMedQuery, setSearchMedQuery] = useState("");
  const [inventoryMeds, setInventoryMeds] = useState([]);
  const [matchingMeds, setMatchingMeds] = useState([]);

  // Dosage Builder States (Days, Timings Checkboxes, Food relation)
  const [selectedMedForDose, setSelectedMedForDose] = useState(null);
  const [doseDays, setDoseDays] = useState(5);
  const [doseMorning, setDoseMorning] = useState(true);
  const [doseAfternoon, setDoseAfternoon] = useState(false);
  const [doseNight, setDoseNight] = useState(true);
  const [doseFoodTiming, setDoseFoodTiming] = useState("After Food");

  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [q, docs, meds] = await Promise.all([
          getQueue(),
          getDoctors(),
          getMedicines()
        ]);

        setQueue(q || []);
        if (docs && docs.length > 0) {
          setDoctorsList(docs);
        }
        setInventoryMeds(meds || []);
      } catch (err) {
        showToast("Error loading consultation data", "error");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Fetch patient medical history when selectedWalkIn changes
  useEffect(() => {
    async function loadPatientHistory() {
      if (!selectedWalkIn) {
        setSelectedPatientHistory("");
        return;
      }
      try {
        const p = await getPatient(selectedWalkIn.mobile_number);
        if (p) {
          setSelectedPatientHistory(p.medical_history || "No previous history found.");
        } else {
          setSelectedPatientHistory("No profile found.");
        }
      } catch (err) {
        console.error("Error loading patient profile", err);
      }
    }
    loadPatientHistory();
  }, [selectedWalkIn]);

  const handleSelectWalkIn = (item) => {
    setSelectedWalkIn(item);
    setSymptoms("");
    setDiagnosis(item.diagnosis || "");
    setPrescription(item.prescription || "");
    setNeedMedicines(item.need_medicines === 1 || Boolean(item.prescription));
    setNextCheckupDate(item.next_checkup_date || "");
    setSearchMedQuery("");
    setMatchingMeds([]);
    setSelectedMedForDose(null);
  };

  const handleMedSearchChange = (query) => {
    setSearchMedQuery(query);
    if (!query.trim()) {
      setMatchingMeds([]);
      return;
    }
    const filtered = inventoryMeds.filter(med => 
      med.medicine_name.toLowerCase().includes(query.toLowerCase())
    );
    setMatchingMeds(filtered);
  };

  const handleOpenDoseBuilder = (med) => {
    setSelectedMedForDose(med);
    setDoseDays(5);
    setDoseMorning(true);
    setDoseAfternoon(false);
    setDoseNight(true);
    setDoseFoodTiming("After Food");
    setSearchMedQuery("");
    setMatchingMeds([]);
  };

  const handleConfirmAddDose = () => {
    if (!selectedMedForDose) return;

    const timings = [];
    let dosesPerDay = 0;
    if (doseMorning) { timings.push("Morning (காலை)"); dosesPerDay += 1; }
    if (doseAfternoon) { timings.push("Afternoon (மதியம்)"); dosesPerDay += 1; }
    if (doseNight) { timings.push("Night (இரவு)"); dosesPerDay += 1; }

    if (timings.length === 0) {
      showToast("Please select at least one timing option (Morning, Afternoon, or Night)", "error");
      return;
    }

    const daysCount = parseInt(doseDays) || 1;
    const totalQty = dosesPerDay * daysCount;
    const timingLabels = timings.join(" - ");
    const timingCode = `${doseMorning ? "1" : "0"}-${doseAfternoon ? "1" : "0"}-${doseNight ? "1" : "0"}`;

    const newLine = `${selectedMedForDose.medicine_name} — ${totalQty} units (${daysCount} days: ${timingLabels} [${timingCode}] | ${doseFoodTiming})`;

    setPrescription(prev => prev ? `${prev}\n${newLine}` : newLine);
    setNeedMedicines(true);
    setSelectedMedForDose(null);
    showToast(`Added ${selectedMedForDose.medicine_name} (${totalQty} units for ${daysCount} days) to prescription!`, "success");
  };

  const handleSaveConsultation = async (e) => {
    e?.preventDefault();
    if (!selectedWalkIn) {
      showToast("Please select a patient from the queue", "error");
      return;
    }

    if (!diagnosis.trim()) {
      showToast("Diagnosis is required before saving", "error");
      return;
    }

    const originalQueue = [...queue];
    const targetWalkInName = selectedWalkIn.name;

    // Determine next queue status: Pharmacy if medicines prescribed, otherwise Billing
    const hasMedicines = needMedicines || Boolean(prescription.trim());
    const nextStatus = hasMedicines ? "Pharmacy" : "Billing";

    const savedDiagnosis = diagnosis.trim();
    const savedPrescription = prescription.trim();
    const savedNextCheckupDate = nextCheckupDate;

    // Optimistically update states instantly
    setQueue(prev => prev.filter(q => q.name !== targetWalkInName));
    showToast(`Saving consultation (Routing to ${nextStatus})...`, "info");

    // Reset UI selections immediately
    setSelectedWalkIn(null);
    setSelectedPatientHistory("");
    setSymptoms("");
    setDiagnosis("");
    setPrescription("");
    setNeedMedicines(false);
    setSelectedMedForDose(null);
    setNextCheckupDate("");

    try {
      await updateWalkIn(targetWalkInName, {
        diagnosis: savedDiagnosis,
        prescription: savedPrescription,
        need_lab_test: 0,
        lab_test_name: "",
        need_medicines: hasMedicines ? 1 : 0,
        appointment_status: nextStatus,
        next_checkup_date: savedNextCheckupDate
      });

      showToast(`Consultation saved! Patient routed to ${nextStatus}`, "success");

      // Reload database states in background
      const updatedQueue = await getQueue();
      setQueue(updatedQueue);
    } catch (err) {
      // Rollback on failure
      setQueue(originalQueue);
      showToast(err.message || "Failed to update consultation", "error");
      console.error(err);
    }
  };
  
  const handlePrintConsultationInvoice = async () => {
    if (!selectedWalkIn) return;
    
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      let posY = 20;

      // Header
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("THANGAM HOSPITAL", 105, posY, { align: "center" });
      posY += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text("123 Health City Road, Coimbatore - 641012", 105, posY, { align: "center" });
      posY += 5;
      doc.text("Phone: +91 422 2345678 | Email: billing@thangam.org", 105, posY, { align: "center" });
      posY += 8;

      // Line separator
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(20, posY, 190, posY);
      posY += 8;

      // Invoice Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(79, 70, 229); // indigo-600
      doc.text("CLINICAL CONSULTATION INVOICE", 20, posY);
      posY += 8;

      // Meta Info Table
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text("Visit/Walk-in ID:", 20, posY);
      doc.setFont("helvetica", "normal");
      doc.text(selectedWalkIn.name, 50, posY);

      doc.setFont("helvetica", "bold");
      doc.text("Patient Name:", 115, posY);
      doc.setFont("helvetica", "normal");
      doc.text(selectedWalkIn.patient_name || "", 145, posY);
      posY += 6;

      doc.setFont("helvetica", "bold");
      doc.text("Date & Time:", 20, posY);
      doc.setFont("helvetica", "normal");
      doc.text(new Date().toLocaleString(), 50, posY);

      doc.setFont("helvetica", "bold");
      doc.text("Mobile Number:", 115, posY);
      doc.setFont("helvetica", "normal");
      doc.text(selectedWalkIn.mobile_number || "", 145, posY);
      posY += 8;

      // Line separator
      doc.line(20, posY, 190, posY);
      posY += 8;

      // Doctor & Diagnosis
      doc.setFont("helvetica", "bold");
      doc.text("Consulting Doctor:", 20, posY);
      doc.setFont("helvetica", "normal");
      doc.text(selectedWalkIn.doctor || "General OPD", 55, posY);
      posY += 6;

      if (diagnosis) {
        doc.setFont("helvetica", "bold");
        doc.text("Diagnosis Details:", 20, posY);
        doc.setFont("helvetica", "normal");
        const diagnosisLines = doc.splitTextToSize(diagnosis, 130);
        doc.text(diagnosisLines, 55, posY);
        posY += (diagnosisLines.length * 4) + 2;
      } else {
        posY += 2;
      }

      // Line separator
      doc.line(20, posY, 190, posY);
      posY += 8;

      // Table Headers
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(20, posY - 4, 170, 7, "F");
      doc.text("Description", 22, posY);
      doc.text("Qty", 120, posY, { align: "center" });
      doc.text("Unit Price", 145, posY, { align: "right" });
      doc.text("Amount", 185, posY, { align: "right" });
      posY += 8;

      // Add row for consultation fee
      const selectedDocObj = doctorsList.find(d => d.doctor_name === selectedWalkIn.doctor || d.name === selectedWalkIn.doctor);
      const docFee = selectedDocObj?.consultation_fee || 500;

      doc.setFont("helvetica", "normal");
      doc.text(`Doctor OPD Consultation Fee (${selectedWalkIn.doctor || "General OPD"})`, 22, posY);
      doc.text("1", 120, posY, { align: "center" });
      doc.text(`INR ${Number(docFee).toFixed(2)}`, 145, posY, { align: "right" });
      doc.text(`INR ${Number(docFee).toFixed(2)}`, 185, posY, { align: "right" });
      posY += 7;

      // Totals Area
      posY += 3;
      doc.line(20, posY, 190, posY);
      posY += 8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("GRAND TOTAL (CONSULTATION):", 110, posY);
      doc.text(`INR ${Number(docFee).toFixed(2)}`, 185, posY, { align: "right" });
      posY += 12;

      // Stamp
      doc.setDrawColor(79, 70, 229); // indigo-600
      doc.setLineWidth(0.8);
      doc.rect(75, posY, 60, 12);
      doc.setTextColor(79, 70, 229);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("CONSULTATION INVOICED", 105, posY + 7, { align: "center" });
      posY += 20;

      // Footer
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("Generated digitally via Thangam Hospital OPD Desk. No signature required.", 105, posY + 10, { align: "center" });

      doc.save(`consultation_invoice_${selectedWalkIn.name || "receipt"}.pdf`);
      showToast("Consultation invoice downloaded successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to download invoice", "error");
    }
  };

  const handleMarkConsultationPayment = () => {
    if (!selectedWalkIn) return;
    const DOCTOR_FEES = { "Dr. Rajesh": 500, "Dr. Priya": 1000, "Dr. Vignesh": 600 };
    const docFee = DOCTOR_FEES[selectedWalkIn.doctor] || 500;
    const now = Date.now();

    // Save to dept payments log
    const storedPayments = localStorage.getItem("hospital_dept_payments");
    const deptPayments = storedPayments ? JSON.parse(storedPayments) : [];
    deptPayments.unshift({
      id: `dp-consult-${now}`,
      walkInId: selectedWalkIn.name,
      patientName: selectedWalkIn.patient_name,
      mobile: selectedWalkIn.mobile_number,
      department: "Consultation",
      description: `OPD Fee — ${selectedWalkIn.doctor}`,
      amount: docFee,
      method: "UPI",
      date: new Date().toISOString().split("T")[0],
      status: "Paid"
    });
    localStorage.setItem("hospital_dept_payments", JSON.stringify(deptPayments));

    // Also record in centralized finance ledger
    const storedFinance = localStorage.getItem("hospital_custom_finance");
    const financeEntries = storedFinance ? JSON.parse(storedFinance) : [];
    const consultTx = {
      id: `tx-consult-${now}`,
      title: `OPD Consultation — ${selectedWalkIn.patient_name}`,
      type: "Income",
      category: "Clinical Services",
      amount: docFee,
      method: "UPI",
      date: new Date().toISOString().split("T")[0],
      notes: `Payment received at Consultation desk. Doctor: ${selectedWalkIn.doctor}. Walk-in: ${selectedWalkIn.name}`
    };
    financeEntries.unshift(consultTx);
    localStorage.setItem("hospital_custom_finance", JSON.stringify(financeEntries));
    recordFinanceTransaction(consultTx).catch(() => null);

    showToast(`Payment of ₹${docFee} received & recorded!`, "success");
  };

  const isDoctorUser = hasRole("Doctor") && !hasRole("Hospital Admin") && !hasRole("System Manager");
  const currentDoctorName = user ? (user.doctor_name || user.full_name || user.name || "") : "";
  const currentDoctorClean = currentDoctorName.toLowerCase().replace(/dr\.?\s*/i, "").trim();

  // Helper to test if a walk-in is assigned to the current user (if user is a doctor)
  const isAssignedToCurrentDoctor = (walkIn) => {
    if (!isDoctorUser || !currentDoctorClean) return true;
    if (!walkIn.doctor) return true;
    const walkInDoc = (walkIn.doctor || "").toLowerCase().replace(/dr\.?\s*/i, "").trim();
    const emailPrefix = (user?.email || "").split('@')[0].toLowerCase();
    
    return walkInDoc.includes(currentDoctorClean) || 
           currentDoctorClean.includes(walkInDoc) ||
           (walkInDoc.length > 2 && emailPrefix.includes(walkInDoc)) ||
           (currentDoctorClean.length > 2 && walkInDoc.includes(currentDoctorClean));
  };

  const activeConsultations = queue.filter(
    (q) => q.appointment_status === "Doctor Consultation" && isAssignedToCurrentDoctor(q)
  );

  // If logged in as Doctor, filter doctorsList to only show columns assigned to current doctor
  const effectiveDoctorsList = isDoctorUser
    ? doctorsList.filter(doc => {
        const docName = (doc.name || doc.doctor_name || "").toLowerCase().replace(/dr\.?\s*/i, "").trim();
        return docName.includes(currentDoctorClean) || currentDoctorClean.includes(docName);
      })
    : doctorsList;

  // Fallback: If logged in as Doctor but not matched in doctorsList yet, show 1 focused card for currentDoctorName
  const renderingDoctors = (isDoctorUser && effectiveDoctorsList.length === 0)
    ? [{ name: currentDoctorName || "My Patients", doctor_name: currentDoctorName || "My Patients", specialization: user?.specialization || user?.department || "Consultation" }]
    : (effectiveDoctorsList.length > 0 ? effectiveDoctorsList : doctorsList);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-7xl mx-auto animate-pulse p-6">
        <div className="h-10 w-48 bg-slate-200/80 rounded mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 h-[500px] bg-slate-200/60 rounded-xl" />
          <div className="lg:col-span-2 h-[500px] bg-slate-200/60 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Toast notifications container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg shadow-lg border text-xs font-semibold animate-in slide-in-from-top-2 duration-200
              ${t.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : ""}
              ${t.type === "error" ? "bg-rose-50 text-rose-800 border-rose-200" : ""}
              ${t.type === "info" ? "bg-indigo-50 text-indigo-800 border-indigo-200" : ""}`}
          >
            {t.type === "success" && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
            {t.type === "error" && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
            {t.type === "info" && <Info className="w-4 h-4 text-indigo-500 shrink-0" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Consultation queue and patient details */}
      <Card>
        <CardHeader className="bg-slate-50 border-b py-4">
          <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-indigo-600" />
            {isDoctorUser 
              ? `My Assigned Patient Queue (${activeConsultations.length} Pending)`
              : `Doctor Consultation Queues (${activeConsultations.length} Pending Total)`
            }
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
        <div className={`grid grid-cols-1 ${renderingDoctors.length > 1 ? "md:grid-cols-3" : "md:grid-cols-1 max-w-xl"} gap-4`}>
          {renderingDoctors.map((doc) => {
            const docName = doc.name || doc.doctor_name;
            const docQueue = activeConsultations.filter(
              (q) => (q.doctor || "").toLowerCase().includes(docName.toLowerCase()) || 
                     docName.toLowerCase().includes((q.doctor || "").toLowerCase())
            );
            return (
              <Card key={docName} className="flex flex-col h-[280px] border-slate-200 shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="py-2.5 px-4 bg-slate-50 border-b flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900">{docName}</CardTitle>
                    <CardDescription className="text-[10px] text-slate-500">{doc.specialization || "Doctor"}</CardDescription>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${docQueue.length > 0 ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-400"}`}>
                    {docQueue.length} Patient{docQueue.length !== 1 ? "s" : ""}
                  </span>
                </CardHeader>
                
                <CardContent className="p-0 overflow-y-auto flex-1 divide-y divide-slate-100">
                  {docQueue.map((item, index) => {
                    const isActive = selectedWalkIn && selectedWalkIn.name === item.name;
                    return (
                      <div
                        key={`${item.name}-${index}`}
                        onClick={() => handleSelectWalkIn(item)}
                        className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors border-l-4 flex gap-2 items-center justify-between
                          ${isActive ? "border-l-indigo-600 bg-indigo-50/40" : "border-l-transparent bg-white"}`}
                      >
                        <div className="flex gap-3 items-center min-w-0 flex-1">
                          <div className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${isActive ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-600"}`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900 text-xs truncate">{item.patient_name}</h4>
                            <p className="text-[10px] text-muted-foreground truncate">{item.mobile_number} | ID: {item.name}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/patient/${item.mobile_number}`, '_blank');
                          }}
                          className="h-7 px-2 text-[10px] text-indigo-600 hover:bg-indigo-100/80 font-bold shrink-0 gap-1 border border-indigo-100"
                          title="View patient history, billing, lab tests & profile"
                        >
                          <FileText className="w-3 h-3" />
                          Profile
                        </Button>
                      </div>
                    );
                  })}
                  {docQueue.length === 0 && (
                    <div className="text-center text-slate-400 py-16 text-xs italic">
                      No patients for {docName}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
          {/* Diagnosis & prescription details */}
              {selectedWalkIn ? (
                <form onSubmit={handleSaveConsultation} className="space-y-4">
                  {/* Selected Patient Banner */}
                  <div className="bg-slate-100 p-3 rounded-lg flex justify-between items-center text-xs flex-wrap gap-2">
                    <div>
                      <span className="font-semibold text-slate-900">Patient: </span>
                      {selectedWalkIn.patient_name} ({selectedWalkIn.mobile_number})
                    </div>
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="font-semibold text-slate-900">ID: </span>
                        {selectedWalkIn.name}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/patient/${selectedWalkIn.mobile_number}`, '_blank')}
                        className="h-7 text-xs bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 font-bold gap-1 cursor-pointer shadow-2xs"
                        title="View complete patient profile, medical history, lab results, billing, and documents"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        View Full Patient Profile & Records ↗
                      </Button>
                    </div>
                  </div>

                  {/* Symptoms & Vitals (Local state only, just for demo notes) */}
                  <div className="space-y-2">
                    <Label htmlFor="symptoms">Symptoms & Vitals Notes</Label>
                    <textarea
                      id="symptoms"
                      className="flex min-h-[60px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-950"
                      placeholder="Enter patient symptoms or vital signs (BP, Temp)..."
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                    />
                  </div>

                  {/* Diagnosis */}
                  <div className="space-y-2">
                    <Label htmlFor="diagnosis" className="font-semibold">Diagnosis *</Label>
                    <textarea
                      id="diagnosis"
                      className="flex min-h-[60px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-950"
                      placeholder="Doctor's final diagnosis..."
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      required
                    />
                  </div>

                  {/* Prescription */}
                  <div className="space-y-3 relative">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="prescription" className="font-semibold flex items-center gap-1.5 text-slate-800">
                        <Pill className="w-4 h-4 text-indigo-600" />
                        Prescription / Medication Regimen
                      </Label>
                      <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full select-none">
                        Connected to Pharmacy Inventory
                      </span>
                    </div>

                    {/* Autocomplete Input */}
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="🔍 Type to search & configure medicine dosage (Days, Morning, Afternoon, Night)..."
                        value={searchMedQuery}
                        onChange={(e) => handleMedSearchChange(e.target.value)}
                        className="h-9 text-xs mb-2 border-indigo-100 focus:border-indigo-400"
                      />

                      {/* Dropdown Suggestions */}
                      {matchingMeds.length > 0 && (
                        <div className="absolute top-9 left-0 right-0 z-30 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto divide-y text-xs">
                          {matchingMeds.map((med) => {
                            const isLow = med.stock <= 50;
                            const isOut = med.stock === 0;
                            return (
                              <div
                                key={med.medicine_name}
                                onClick={() => handleOpenDoseBuilder(med)}
                                className={`px-4 py-2.5 hover:bg-indigo-50/40 cursor-pointer flex justify-between items-center transition-colors ${
                                  isOut ? "bg-rose-50/20 text-slate-400" : ""
                                }`}
                              >
                                <div>
                                  <div className="font-semibold text-slate-800">{med.medicine_name}</div>
                                  <div className="text-[10px] text-slate-400">{med.generic_name || med.category}</div>
                                </div>
                                <div className="flex gap-2.5 items-center">
                                  <span className="text-[10px] text-slate-500 font-medium">₹{med.price}/tab</span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                      isOut
                                        ? "bg-rose-100 text-rose-700 border border-rose-200"
                                        : isLow
                                        ? "bg-amber-100 text-amber-700 border border-amber-200"
                                        : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                    }`}
                                  >
                                    {isOut ? "Out of Stock" : `${med.stock} units`}
                                  </span>
                                  <span className="text-[10px] text-indigo-600 font-bold ml-1 bg-indigo-50 px-2 py-0.5 rounded">
                                    + Set Dose
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Interactive Medication Dosage Builder Box */}
                    {selectedMedForDose && (
                      <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3.5 animate-in fade-in zoom-in-95 duration-200 shadow-xs">
                        <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                              💊
                            </span>
                            <div>
                              <h4 className="font-bold text-slate-900 text-xs">{selectedMedForDose.medicine_name}</h4>
                              <p className="text-[10px] text-slate-500">
                                Stock: {selectedMedForDose.stock || 0} units • Rate: ₹{selectedMedForDose.price || 0}/unit
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedMedForDose(null)}
                            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Dosage parameters grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* 1. Duration in Days */}
                          <div className="space-y-1.5 bg-white p-3 rounded-lg border border-slate-200">
                            <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              Duration (Days)
                            </Label>
                            <div className="flex items-center gap-1.5">
                              <Input
                                type="number"
                                min="1"
                                max="180"
                                value={doseDays}
                                onChange={(e) => setDoseDays(Math.max(1, parseInt(e.target.value) || 1))}
                                className="h-8 text-xs font-bold text-slate-800"
                              />
                              <span className="text-xs text-slate-500 font-medium shrink-0">days</span>
                            </div>
                            <div className="flex flex-wrap gap-1 pt-1">
                              {[3, 5, 7, 10, 14, 30].map(d => (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => setDoseDays(d)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                                    doseDays === d
                                      ? "bg-indigo-600 text-white font-bold"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  }`}
                                >
                                  {d}d
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 2. Timing Checkboxes (Morning / Afternoon / Night) */}
                          <div className="space-y-1.5 bg-white p-3 rounded-lg border border-slate-200">
                            <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              When to take (Tick)
                            </Label>
                            <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                              <label className={`flex flex-col items-center justify-center p-1.5 rounded-md border cursor-pointer select-none transition-all ${
                                doseMorning ? "border-indigo-500 bg-indigo-50/80 text-indigo-950 font-bold shadow-2xs" : "border-slate-200 bg-slate-50 text-slate-600"
                              }`}>
                                <input
                                  type="checkbox"
                                  checked={doseMorning}
                                  onChange={(e) => setDoseMorning(e.target.checked)}
                                  className="sr-only"
                                />
                                <Sun className={`w-3.5 h-3.5 mb-0.5 ${doseMorning ? "text-amber-500" : "text-slate-400"}`} />
                                <span className="text-[10px]">Morning</span>
                                <span className="text-[8px] text-slate-400 font-normal">காலை</span>
                              </label>

                              <label className={`flex flex-col items-center justify-center p-1.5 rounded-md border cursor-pointer select-none transition-all ${
                                doseAfternoon ? "border-indigo-500 bg-indigo-50/80 text-indigo-950 font-bold shadow-2xs" : "border-slate-200 bg-slate-50 text-slate-600"
                              }`}>
                                <input
                                  type="checkbox"
                                  checked={doseAfternoon}
                                  onChange={(e) => setDoseAfternoon(e.target.checked)}
                                  className="sr-only"
                                />
                                <Sun className={`w-3.5 h-3.5 mb-0.5 ${doseAfternoon ? "text-orange-500" : "text-slate-400"}`} />
                                <span className="text-[10px]">Afternoon</span>
                                <span className="text-[8px] text-slate-400 font-normal">மதியம்</span>
                              </label>

                              <label className={`flex flex-col items-center justify-center p-1.5 rounded-md border cursor-pointer select-none transition-all ${
                                doseNight ? "border-indigo-500 bg-indigo-50/80 text-indigo-950 font-bold shadow-2xs" : "border-slate-200 bg-slate-50 text-slate-600"
                              }`}>
                                <input
                                  type="checkbox"
                                  checked={doseNight}
                                  onChange={(e) => setDoseNight(e.target.checked)}
                                  className="sr-only"
                                />
                                <Moon className={`w-3.5 h-3.5 mb-0.5 ${doseNight ? "text-indigo-600" : "text-slate-400"}`} />
                                <span className="text-[10px]">Night</span>
                                <span className="text-[8px] text-slate-400 font-normal">இரவு</span>
                              </label>
                            </div>
                          </div>

                          {/* 3. Meal Instruction */}
                          <div className="space-y-1.5 bg-white p-3 rounded-lg border border-slate-200">
                            <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                              <Utensils className="w-3 h-3 text-slate-400" />
                              Meal Instruction
                            </Label>
                            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                              <label className={`flex flex-col items-center justify-center p-1.5 rounded-md border cursor-pointer select-none transition-all ${
                                doseFoodTiming === "After Food" ? "border-emerald-500 bg-emerald-50/80 text-emerald-950 font-bold shadow-2xs" : "border-slate-200 bg-slate-50 text-slate-600"
                              }`}>
                                <input
                                  type="radio"
                                  name="foodTiming"
                                  checked={doseFoodTiming === "After Food"}
                                  onChange={() => setDoseFoodTiming("After Food")}
                                  className="sr-only"
                                />
                                <span className="text-[10px]">After Food</span>
                                <span className="text-[8px] text-slate-400 font-normal">உணவுக்கு பின்</span>
                              </label>

                              <label className={`flex flex-col items-center justify-center p-1.5 rounded-md border cursor-pointer select-none transition-all ${
                                doseFoodTiming === "Before Food" ? "border-emerald-500 bg-emerald-50/80 text-emerald-950 font-bold shadow-2xs" : "border-slate-200 bg-slate-50 text-slate-600"
                              }`}>
                                <input
                                  type="radio"
                                  name="foodTiming"
                                  checked={doseFoodTiming === "Before Food"}
                                  onChange={() => setDoseFoodTiming("Before Food")}
                                  className="sr-only"
                                />
                                <span className="text-[10px]">Before Food</span>
                                <span className="text-[8px] text-slate-400 font-normal">உணவுக்கு முன்</span>
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Summary and Confirmation */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="text-xs text-slate-600">
                            <span>Total Prescription Qty: </span>
                            <strong className="text-indigo-700 font-bold font-mono">
                              {((doseMorning ? 1 : 0) + (doseAfternoon ? 1 : 0) + (doseNight ? 1 : 0)) * (parseInt(doseDays) || 1)} units
                            </strong>
                            <span className="text-slate-400 text-[11px] ml-1">
                              ({(doseMorning ? 1 : 0) + (doseAfternoon ? 1 : 0) + (doseNight ? 1 : 0)}/day × {doseDays} days)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedMedForDose(null)}
                              className="h-8 text-xs border-slate-200 text-slate-600"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleConfirmAddDose}
                              className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1.5 shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add to Prescription
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    <textarea
                      id="prescription"
                      className="flex min-h-[90px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-xs shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-950 font-mono"
                      placeholder="Prescription items configured with days & timing will appear here. You can also customize notes..."
                      value={prescription}
                      onChange={(e) => setPrescription(e.target.value)}
                    />
                  </div>

                  {/* Workflow routing selectors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="need-med"
                          checked={needMedicines}
                          onChange={(e) => setNeedMedicines(e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                        <Label htmlFor="need-med" className="cursor-pointer select-none font-medium">Send to Pharmacy for Dispensing?</Label>
                      </div>
                      <p className="text-[11px] text-muted-foreground pl-6">
                        Routes the patient directly to the pharmacy stage for medicine fulfillment before final billing.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="next-checkup" className="font-semibold text-slate-700">Next Follow-up / Checkup Date (Optional)</Label>
                      <Input
                        type="date"
                        id="next-checkup"
                        value={nextCheckupDate}
                        onChange={(e) => setNextCheckupDate(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  {/* Inline history report display */}
                  {selectedPatientHistory && (
                    <div className="border-t border-slate-100 pt-4 space-y-2">
                      <Label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5" />
                        Patient Clinical History
                      </Label>
                      <pre className="p-3 bg-slate-50 rounded border text-xs text-slate-600 overflow-y-auto max-h-[120px] font-mono whitespace-pre-wrap">
                        {selectedPatientHistory}
                      </pre>
                    </div>
                  )}

                  <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                    <Button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 h-9 text-sm font-semibold flex items-center justify-center"
                    >
                      <Send className="w-4 h-4" />
                      Save & Route to next station
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="text-center text-muted-foreground py-20">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-indigo-300" />
                  Please select a patient from the queue to start consultation.
                </div>
              )}
        </CardContent>
      </Card>
      </div>
    );
  }
