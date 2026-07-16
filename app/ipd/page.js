"use client";

import { useState, useEffect } from "react";
import { Heart, Activity, UserPlus, FileText, ClipboardList, CheckCircle, AlertCircle, Info, RefreshCw, UserCheck, Plus, ListCollapse } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getQueue } from "@/lib/hospital-service";

// Mock static admissions data for high fidelity
const INITIAL_ADMISSIONS = [
  { id: "IPD-1021", patient_name: "Surya Prakash", mobile: "9876543210", ward: "ICU", bed: "ICU-01", doctor: "Dr. Rajesh Kumar", admittedDate: "2026-07-15", reason: "Acute Chest Pain", diet: "Low sodium fluid diet", bp: "120/80", hr: "76 bpm", temp: "98.6 F" },
  { id: "IPD-1022", patient_name: "Rajesh Kumar", mobile: "9876543211", ward: "General Male", bed: "GEN-01", doctor: "Dr. Anita Roy", admittedDate: "2026-07-16", reason: "Post-op appendectomy recovery", diet: "Soft solid diet", bp: "115/75", hr: "82 bpm", temp: "99.1 F" },
];

export default function InpatientPortalPage() {
  const [admissions, setAdmissions] = useState(INITIAL_ADMISSIONS);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [activeTab, setActiveTab] = useState("registry");

  // Admit form state
  const [admitPatient, setAdmitPatient] = useState("");
  const [admitWard, setAdmitWard] = useState("ICU");
  const [admitBed, setAdmitBed] = useState("");
  const [admitDoc, setAdmitDoc] = useState("");
  const [admitReason, setAdmitReason] = useState("");
  const [admitDiet, setAdmitDiet] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  // Nursing Notes state
  const [selectedIpdId, setSelectedIpdId] = useState("");
  const [nursingNote, setNursingNote] = useState("");
  const [bp, setBp] = useState("");
  const [hr, setHr] = useState("");
  const [temp, setTemp] = useState("");
  const [nursingLogs, setNursingLogs] = useState([
    { id: 1, ipdId: "IPD-1021", date: "2026-07-16 10:00 AM", note: "Patient stable. Administered IV saline. Vitals within normal limits.", bp: "120/80", hr: "74", temp: "98.4" },
    { id: 2, ipdId: "IPD-1021", date: "2026-07-16 04:00 PM", note: "BP checked, minor chest discomfort reported, doctor notified.", bp: "135/85", hr: "80", temp: "98.9" },
  ]);

  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  async function loadQueue() {
    setLoading(true);
    try {
      const q = await getQueue();
      setQueue(q);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueue();
  }, []);

  const handleAdmitSubmit = (e) => {
    e.preventDefault();
    if (!admitPatient || !admitDoc || !admitBed) {
      showToast("Patient, Assigned Doctor, and Bed ID are required", "error");
      return;
    }

    const newAdmit = {
      id: `IPD-${Math.floor(1000 + Math.random() * 9000)}`,
      patient_name: admitPatient,
      mobile: "9876543210",
      ward: admitWard,
      bed: admitBed,
      doctor: admitDoc,
      admittedDate: new Date().toISOString().split("T")[0],
      reason: admitReason,
      diet: admitDiet || "Regular diet",
      bp: "120/80",
      hr: "75 bpm",
      temp: "98.6 F"
    };

    setAdmissions(prev => [newAdmit, ...prev]);
    showToast(`${admitPatient} successfully admitted to ${admitWard} Bed ${admitBed}!`, "success");
    setActiveTab("registry");

    // Reset Form
    setAdmitPatient("");
    setAdmitBed("");
    setAdmitDoc("");
    setAdmitReason("");
    setAdmitDiet("");
    setEmergencyContact("");
  };

  const handleAddNursingNote = (e) => {
    e.preventDefault();
    if (!selectedIpdId || !nursingNote) {
      showToast("Patient selection and nursing note are required", "error");
      return;
    }

    const newLog = {
      id: Date.now(),
      ipdId: selectedIpdId,
      date: new Date().toLocaleString(),
      note: nursingNote,
      bp: bp || "120/80",
      hr: hr || "72",
      temp: temp || "98.6"
    };

    setNursingLogs(prev => [newLog, ...prev]);
    showToast("Nursing progress notes logged!", "success");

    // Update vitals on the main patient record in UI state
    setAdmissions(prev => 
      prev.map(a => a.id === selectedIpdId ? { ...a, bp: bp || a.bp, hr: hr ? `${hr} bpm` : a.hr, temp: temp ? `${temp} F` : a.temp } : a)
    );

    setNursingNote("");
    setBp("");
    setHr("");
    setTemp("");
  };

  const handleDischargePatient = (ipdId, name) => {
    setAdmissions(prev => prev.filter(a => a.id !== ipdId));
    showToast(`${name} has been discharged. Summary generated.`, "success");
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Toast notifications */}
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
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Inpatient Portal (IPD)</h2>
          <p className="text-muted-foreground mt-1">Manage ward admissions, bed mappings, nursing logs, and diets</p>
        </div>
        <div className="flex gap-2">
          {["registry", "admit", "nursing"].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "outline"}
              onClick={() => setActiveTab(tab)}
              className={`h-9 text-xs font-semibold uppercase tracking-wider ${
                activeTab === tab ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab === "registry" && "Admitted Registry"}
              {tab === "admit" && "Admit Patient"}
              {tab === "nursing" && "Nursing & Daily Vitals"}
            </Button>
          ))}
        </div>
      </div>

      {activeTab === "registry" && (
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b py-3">
            <CardTitle className="text-base font-serif">Active IPD Patients</CardTitle>
            <CardDescription className="text-xs">Current ward occupancies and admission parameters.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y text-xs">
              <div className="grid grid-cols-6 px-6 py-2.5 font-bold text-slate-500 uppercase bg-slate-50/60 tracking-wider">
                <div>Patient / IPD ID</div>
                <div>Ward Allocation</div>
                <div>Assigned Doctor</div>
                <div>Admitted Date</div>
                <div className="text-center">Current Vitals</div>
                <div className="text-right">Actions</div>
              </div>
              {admissions.map((adm) => (
                <div key={adm.id} className="grid grid-cols-6 px-6 py-4 items-center hover:bg-slate-50/30 transition-colors">
                  <div className="font-semibold text-slate-800">
                    {adm.patient_name}
                    <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{adm.id} | {adm.mobile}</span>
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold border border-teal-100">
                      {adm.ward} - {adm.bed}
                    </span>
                  </div>
                  <div className="text-slate-600 font-medium">{adm.doctor}</div>
                  <div className="text-slate-500 font-medium">{adm.admittedDate}</div>
                  <div className="text-center font-medium text-slate-600">
                    <span className="block text-[10px]">BP: {adm.bp}</span>
                    <span className="block text-[10px] mt-0.5">HR: {adm.hr} | Temp: {adm.temp}</span>
                  </div>
                  <div className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDischargePatient(adm.id, adm.patient_name)}
                      className="h-7 text-[10px] text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50/50 font-bold"
                    >
                      Discharge Summary
                    </Button>
                  </div>
                </div>
              ))}
              {admissions.length === 0 && (
                <div className="text-center py-10 text-muted-foreground italic">
                  No active inpatients admitted.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "admit" && (
        <Card className="max-w-2xl mx-auto border-t-4 border-t-indigo-600 shadow-lg">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-lg flex items-center gap-2 font-serif text-slate-800">
              <UserPlus className="w-5 h-5 text-indigo-500" />
              Inpatient Admission Portal
            </CardTitle>
            <CardDescription>Register a patient visit as an Inpatient (IPD) ward admission.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleAdmitSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="admit-patient" className="text-xs font-semibold text-slate-700">Select Patient *</Label>
                  <select
                    id="admit-patient"
                    value={admitPatient}
                    onChange={(e) => setAdmitPatient(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-950"
                    required
                  >
                    <option value="">Choose Patient...</option>
                    {queue.map(q => (
                      <option key={q.name} value={q.patient_name}>{q.patient_name} ({q.mobile_number})</option>
                    ))}
                    <option value="Demo Admitter">Demo Patient Walk-In</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="admit-doc" className="text-xs font-semibold text-slate-700">Assigned Doctor *</Label>
                  <Input
                    id="admit-doc"
                    placeholder="e.g. Dr. Anita Roy"
                    value={admitDoc}
                    onChange={(e) => setAdmitDoc(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="admit-ward" className="text-xs font-semibold text-slate-700">Ward Allocation</Label>
                  <select
                    id="admit-ward"
                    value={admitWard}
                    onChange={(e) => setAdmitWard(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-950"
                  >
                    <option value="ICU">ICU</option>
                    <option value="General Male">General Male</option>
                    <option value="General Female">General Female</option>
                    <option value="Private Rooms">Private Rooms</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="admit-bed" className="text-xs font-semibold text-slate-700">Assign Bed ID *</Label>
                  <Input
                    id="admit-bed"
                    placeholder="e.g. ICU-02 or GEN-05"
                    value={admitBed}
                    onChange={(e) => setAdmitBed(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="admit-reason" className="text-xs font-semibold text-slate-700">Reason for Admission</Label>
                  <Input
                    id="admit-reason"
                    placeholder="e.g. High fever with severe respiratory fatigue"
                    value={admitReason}
                    onChange={(e) => setAdmitReason(e.target.value)}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="admit-diet" className="text-xs font-semibold text-slate-700">Diet Plan / Meal Instructions</Label>
                  <Input
                    id="admit-diet"
                    placeholder="e.g. Liquid diet only, low glycemic profile"
                    value={admitDiet}
                    onChange={(e) => setAdmitDiet(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("registry")}
                  className="h-9 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-xs font-semibold"
                >
                  Admit Patient
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === "nursing" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Note Logger */}
          <Card className="lg:col-span-1 border-t-4 border-t-indigo-600 shadow-md">
            <CardHeader className="bg-slate-50/50 border-b py-3">
              <CardTitle className="text-base font-serif">Daily Nursing Notes & Progress</CardTitle>
              <CardDescription className="text-xs">Log daily parameters and vitals logs.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleAddNursingNote} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="select-admitted" className="text-xs font-semibold text-slate-700">Choose Admitted Inpatient *</Label>
                  <select
                    id="select-admitted"
                    value={selectedIpdId}
                    onChange={(e) => setSelectedIpdId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-950"
                    required
                  >
                    <option value="">Choose Patient...</option>
                    {admissions.map(a => (
                      <option key={a.id} value={a.id}>{a.patient_name} ({a.id})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="note-bp" className="text-[10px] font-bold text-slate-500">BP (mmHg)</Label>
                    <Input
                      id="note-bp"
                      placeholder="120/80"
                      value={bp}
                      onChange={(e) => setBp(e.target.value)}
                      className="h-8 text-xs px-2"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="note-hr" className="text-[10px] font-bold text-slate-500">Pulse (bpm)</Label>
                    <Input
                      id="note-hr"
                      placeholder="72"
                      value={hr}
                      onChange={(e) => setHr(e.target.value)}
                      className="h-8 text-xs px-2"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="note-temp" className="text-[10px] font-bold text-slate-500">Temp (F)</Label>
                    <Input
                      id="note-temp"
                      placeholder="98.6"
                      value={temp}
                      onChange={(e) => setTemp(e.target.value)}
                      className="h-8 text-xs px-2"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="note-notes" className="text-xs font-semibold text-slate-700">Nursing Log / Progress Description *</Label>
                  <textarea
                    id="note-notes"
                    className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-950"
                    placeholder="Enter observation notes, IV logs, medication times..."
                    value={nursingNote}
                    onChange={(e) => setNursingNote(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-1 h-9 text-xs font-semibold mt-2">
                  <Plus className="w-3.5 h-3.5" /> Save Note Entry
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Timeline list */}
          <Card className="lg:col-span-2 shadow-xs border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b py-3">
              <CardTitle className="text-base font-serif">Observation History Timeline</CardTitle>
              <CardDescription className="text-xs">Clinical progress entries logged by nurses and ward staff.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y text-xs max-h-[420px] overflow-y-auto">
                {nursingLogs.map((log) => {
                  const pat = admissions.find(a => a.id === log.ipdId);
                  return (
                    <div key={log.id} className="p-4 hover:bg-slate-50/20 transition-colors">
                      <div className="flex justify-between items-center text-slate-400 font-medium text-[10px]">
                        <span>Patient ID: {log.ipdId} {pat ? `(${pat.patient_name})` : ""}</span>
                        <span>{log.date}</span>
                      </div>
                      <p className="text-slate-800 mt-2 font-medium leading-relaxed">{log.note}</p>
                      <div className="flex gap-4 mt-2.5 text-[10px] font-bold text-indigo-600 bg-slate-50 border rounded px-2 py-1 max-w-xs">
                        <span>BP: {log.bp} mmHg</span>
                        <span>Pulse: {log.hr} bpm</span>
                        <span>Temp: {log.temp} F</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
