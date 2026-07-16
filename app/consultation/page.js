"use client";

import { useState, useEffect } from "react";
import { Stethoscope, CheckCircle, AlertCircle, Info, Activity, History, Send, FlaskConical } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getQueue, updateWalkIn, getLabTests, getPatient } from "@/lib/hospital-service";

export default function ConsultationPage() {
  const [queue, setQueue] = useState([]);
  const [labTestsList, setLabTestsList] = useState([]);
  const [selectedWalkIn, setSelectedWalkIn] = useState(null);
  const [selectedPatientHistory, setSelectedPatientHistory] = useState("");
  const [toasts, setToasts] = useState([]);

  // Form States
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [needLabTest, setNeedLabTest] = useState(false);
  const [labTestName, setLabTestName] = useState("");
  const [needMedicines, setNeedMedicines] = useState(false);

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

        const tests = await getLabTests();
        setLabTestsList(tests);
        if (tests.length > 0) {
          setLabTestName(tests[0].test_name);
        }
      } catch (err) {
        showToast("Error loading consultation data", "error");
        console.error(err);
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

    try {
      await updateWalkIn(targetWalkInName, {
        diagnosis: diagnosis.trim(),
        prescription: prescription.trim(),
        need_lab_test: needLabTest ? 1 : 0,
        lab_test_name: needLabTest ? labTestName : "",
        need_medicines: needMedicines ? 1 : 0,
        appointment_status: nextStatus
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live queue list */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="flex flex-col h-[500px]">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Active Queue</span>
                <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                  {activeConsultations.length} Pending
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1">
              <div className="divide-y">
                {activeConsultations.map((item) => {
                  const isActive = selectedWalkIn && selectedWalkIn.name === item.name;
                  return (
                    <div
                      key={item.name}
                      onClick={() => handleSelectWalkIn(item)}
                      className={`p-4 border-b hover:bg-slate-50 cursor-pointer transition-colors border-l-4 
                        ${isActive ? "border-l-indigo-600 bg-indigo-50/30" : "border-l-transparent bg-white"}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-slate-950 text-sm">{item.patient_name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.mobile_number} | Assigned: {item.doctor}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {activeConsultations.length === 0 && (
                  <div className="text-center text-muted-foreground py-20 text-sm">
                    No pending patients in consultation queue.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Diagnosis & Prescription Panel */}
        <div className="lg:col-span-2 space-y-6">
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
                  <div className="space-y-2">
                    <Label htmlFor="prescription">Prescription / Medication Regimen</Label>
                    <textarea
                      id="prescription"
                      className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-950"
                      placeholder="Enter prescription instructions, e.g. Paracetamol 650mg twice daily..."
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
    </div>
  );
}
