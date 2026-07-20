"use client";

import { useState, useEffect } from "react";
import { Stethoscope, CheckCircle, AlertCircle, Info, Activity, History, Send, FlaskConical } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getQueue, updateWalkIn, getLabTests, getPatient, getMedicines, getDoctors } from "@/lib/hospital-service";

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
    } else if (labTestsList.length > 0) {
      setLabTestName(labTestsList[0].test_name);
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
        diagnosis: diagnosis.trim(),
        prescription: prescription.trim(),
        need_lab_test: needLabTest ? 1 : 0,
        lab_test_name: needLabTest ? labTestName : "",
        need_medicines: needMedicines ? 1 : 0,
        appointment_status: nextStatus,
        next_checkup_date: nextCheckupDate
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
                        key={item.name}
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
                        <div className="space-y-1 pl-6">
                          <Label htmlFor="lab-test" className="text-xs">Select Lab Test</Label>
                          <Select value={labTestName} onValueChange={setLabTestName}>
                            <SelectTrigger id="lab-test" className="h-9 text-xs">
                              <SelectValue placeholder="Choose test..." />
                            </SelectTrigger>
                            <SelectContent>
                              {labTestsList.map((t) => (
                                <SelectItem key={t.test_name} value={t.test_name} className="text-xs">
                                  {t.test_name} (₹{t.fee})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                      className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 h-9 text-sm"
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
