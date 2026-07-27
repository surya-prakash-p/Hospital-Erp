"use client";

import { useState, useEffect } from "react";
import { Stethoscope, CheckCircle, AlertCircle, Info, Activity, History, Send, FlaskConical, Printer, BadgeCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getQueue, updateWalkIn, getLabTests, getPatient, getMedicines, getDoctors } from "@/lib/hospital-service";
import { jsPDF } from "jspdf";

export default function ConsultationPage() {
  const [queue, setQueue] = useState([]);
  const [doctorsList, setDoctorsList] = useState([
    { name: "Dr. Rajesh", doctor_name: "Dr. Rajesh", specialization: "General Physician" },
    { name: "Dr. Priya", doctor_name: "Dr. Priya", specialization: "Cardiologist" },
    { name: "Dr. Vignesh", doctor_name: "Dr. Vignesh", specialization: "Pediatrician" }
  ]);
  const [labTestsList, setLabTestsList] = useState([]);
  const [selectedWalkIn, setSelectedWalkIn] = useState(null);
  const [selectedPatientHistory, setSelectedPatientHistory] = useState("");
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Form States
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [needLabTest, setNeedLabTest] = useState(false);
  const [labTestName, setLabTestName] = useState("");
  const [needMedicines, setNeedMedicines] = useState(false);
  const [nextCheckupDate, setNextCheckupDate] = useState("");
  
  // Autocomplete Inventory Medicine States
  const [searchMedQuery, setSearchMedQuery] = useState("");
  const [inventoryMeds, setInventoryMeds] = useState([]);
  const [matchingMeds, setMatchingMeds] = useState([]);

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
        const q = await getQueue();
        setQueue(q);

        const docs = await getDoctors();
        if (docs && docs.length > 0) {
          setDoctorsList(docs);
        }

        const tests = await getLabTests();
        setLabTestsList(tests);
        if (tests.length > 0) {
          setLabTestName(tests[0].test_name);
        }

        // Load inventory medicines list
        const meds = await getMedicines();
        setInventoryMeds(meds);
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
    setNeedLabTest(item.need_lab_test === 1);
    if (item.lab_test_name) {
      setLabTestName(item.lab_test_name);
    } else {
      setLabTestName("");
    }
    setNeedMedicines(item.need_medicines === 1);
    setNextCheckupDate(item.next_checkup_date || "");
    setSearchMedQuery("");
    setMatchingMeds([]);
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

  const handleAddMedToPrescription = (med) => {
    const newLine = `${med.medicine_name} - 10 tabs (Dosage: 1-0-1 daily after food)`;
    setPrescription(prev => prev ? `${prev}\n${newLine}` : newLine);
    setSearchMedQuery("");
    setMatchingMeds([]);
    showToast(`Added ${med.medicine_name} to prescription list!`, "success");
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

    // Determine next queue status
    let nextStatus = "Billing";
    if (needLabTest) {
      nextStatus = "Lab Test";
    } else if (needMedicines) {
      nextStatus = "Pharmacy";
    }

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
    setNeedLabTest(false);
    setNeedMedicines(false);
    setNextCheckupDate("");

    try {
      await updateWalkIn(targetWalkInName, {
        diagnosis: savedDiagnosis,
        prescription: savedPrescription,
        need_lab_test: needLabTest ? 1 : 0,
        lab_test_name: needLabTest ? labTestName : "",
        need_medicines: needMedicines ? 1 : 0,
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
  
  const handlePrintConsultationInvoice = () => {
    if (!selectedWalkIn) return;
    
    try {
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
      doc.text(selectedWalkIn.doctor || "", 55, posY);
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
      doc.text(`Doctor OPD Consultation Fee (${selectedWalkIn.doctor})`, 22, posY);
      doc.text("1", 120, posY, { align: "center" });
      doc.text(`INR ${docFee.toFixed(2)}`, 145, posY, { align: "right" });
      doc.text(`INR ${docFee.toFixed(2)}`, 185, posY, { align: "right" });
      posY += 7;

      // Totals Area
      posY += 3;
      doc.line(20, posY, 190, posY);
      posY += 8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("GRAND TOTAL (CONSULTATION):", 110, posY);
      doc.text(`INR ${docFee.toFixed(2)}`, 185, posY, { align: "right" });
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

      // Open PDF in new tab for viewing and printing
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);

      showToast("Consultation invoice opened for printing!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to print invoice", "error");
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

    // Also record in finance ledger
    const storedFinance = localStorage.getItem("hospital_custom_finance");
    const financeEntries = storedFinance ? JSON.parse(storedFinance) : [];
    financeEntries.unshift({
      id: `tx-consult-${now}`,
      title: `OPD Consultation — ${selectedWalkIn.patient_name}`,
      type: "Income",
      category: "Clinical Services",
      amount: docFee,
      method: "UPI",
      date: new Date().toISOString().split("T")[0],
      notes: `Payment received at Consultation desk. Doctor: ${selectedWalkIn.doctor}. Walk-in: ${selectedWalkIn.name}`
    });
    localStorage.setItem("hospital_custom_finance", JSON.stringify(financeEntries));

    showToast(`Payment of ₹${docFee} received & recorded!`, "success");
  };

  const activeConsultations = queue.filter(
    (q) => q.appointment_status === "Doctor Consultation"
  );

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

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Consultation</h2>
          <p className="text-muted-foreground mt-1">Doctor's diagnosis and prescription</p>
        </div>
      </div>

      {/* 3 Doctor Columns Queue */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-indigo-600" />
          Doctor Consultation Queues ({activeConsultations.length} Pending Total)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {doctorsList.map((doc) => {
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
                        className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors border-l-4 flex gap-3 items-center
                          ${isActive ? "border-l-indigo-600 bg-indigo-50/40" : "border-l-transparent bg-white"}`}
                      >
                        <div className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${isActive ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-600"}`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 text-xs truncate">{item.patient_name}</h4>
                          <p className="text-[10px] text-muted-foreground truncate">{item.mobile_number} | ID: {item.name}</p>
                        </div>
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
      </div>

        {/* Diagnosis & Prescription Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-indigo-500" />
                Diagnosis & Vitals
              </CardTitle>
              <CardDescription>Enter consultation details for the selected patient.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {selectedWalkIn ? (
                <form onSubmit={handleSaveConsultation} className="space-y-4">
                  {/* Selected Patient Banner */}
                  <div className="bg-slate-100 p-3 rounded-lg flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-slate-900">Patient: </span>
                      {selectedWalkIn.patient_name} ({selectedWalkIn.mobile_number})
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900">ID: </span>
                      {selectedWalkIn.name}
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
                  <div className="space-y-2 relative">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="prescription" className="font-semibold">Prescription / Medication Regimen</Label>
                      <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full select-none">
                        Connected to Pharmacy Inventory
                      </span>
                    </div>

                    {/* Autocomplete Input */}
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="🔍 Type to search & add medicine from inventory..."
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
                                onClick={() => handleAddMedToPrescription(med)}
                                className={`px-4 py-2.5 hover:bg-indigo-50/30 cursor-pointer flex justify-between items-center transition-colors ${
                                  isOut ? "bg-rose-50/20 text-slate-400" : ""
                                }`}
                              >
                                <div className="font-semibold text-slate-800">{med.medicine_name}</div>
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
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <textarea
                      id="prescription"
                      className="flex min-h-[90px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-xs shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-950 font-mono"
                      placeholder="Selected medicines will appear here automatically. You can also customize dosage details..."
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
                          id="need-lab"
                          checked={needLabTest}
                          onChange={(e) => setNeedLabTest(e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                        <Label htmlFor="need-lab" className="cursor-pointer select-none">Order Lab Diagnostic Test?</Label>
                      </div>

                      {needLabTest && (
                        <div className="space-y-2 pl-6">
                          <Label className="text-xs font-semibold text-slate-700">Select Lab Tests (Multiple)</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded-lg p-3 bg-slate-50/50">
                            {labTestsList.map((t) => {
                              const selectedArray = labTestName ? labTestName.split(",").map(x => x.trim()).filter(Boolean) : [];
                              const isChecked = selectedArray.includes(t.test_name);
                              return (
                                <label key={t.test_name} className={`flex items-start gap-2 border p-2 rounded-md cursor-pointer transition-all duration-200 ${isChecked ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900 font-medium' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      let updatedArray;
                                      if (isChecked) {
                                        updatedArray = selectedArray.filter(name => name !== t.test_name);
                                      } else {
                                        updatedArray = [...selectedArray, t.test_name];
                                      }
                                      setLabTestName(updatedArray.join(", "));
                                    }}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer mt-0.5"
                                  />
                                  <div className="text-[11px] leading-tight">
                                    <div>{t.test_name}</div>
                                    <div className="text-[9px] text-muted-foreground font-normal mt-0.5">₹{t.fee}</div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="need-med"
                          checked={needMedicines}
                          onChange={(e) => setNeedMedicines(e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                        <Label htmlFor="need-med" className="cursor-pointer select-none">Send to Pharmacy for Medicines?</Label>
                      </div>
                      <p className="text-[11px] text-muted-foreground pl-6">
                        Routes the patient directly to the pharmacy stage before billing.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="next-checkup" className="font-semibold text-slate-700">Next Checkup Date (Optional)</Label>
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
      </div>
    );
  }
