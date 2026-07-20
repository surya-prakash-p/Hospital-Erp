"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search, UserPlus, CheckCircle, AlertTriangle, Info, X,
  Loader2, User, Phone, Mail, Calendar, Stethoscope, Ruler,
  Scale, Droplet, ShieldAlert, Wind, Activity, Thermometer,
  HeartPulse, FlaskConical, Pill, Receipt, RefreshCw,
  ArrowRight, ChevronRight, BedDouble
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  getQueue, getPatients, getDoctors, searchPatient, createPatient, createWalkIn
} from "@/lib/hospital-service";

const WORKFLOW = [
  { key: "Doctor Consultation", short: "Consultation", icon: Stethoscope,  next: "Lab"      },
  { key: "Lab",                 short: "Lab Station",  icon: FlaskConical, next: "Pharmacy" },
  { key: "Pharmacy",            short: "Pharmacy",     icon: Pill,         next: "Billing"  },
  { key: "Billing",             short: "Billing & Pay",icon: Receipt,      next: "Done"     },
  { key: "Done",                short: "Done",         icon: CheckCircle,  next: null       },
];

const STAGE_BADGE = {
  "Doctor Consultation": "text-slate-700 border-slate-300",
  "Lab":                 "text-slate-700 border-slate-300",
  "Pharmacy":            "text-slate-700 border-slate-300",
  "Billing":             "text-slate-700 border-slate-300",
  "Done":                "text-emerald-700 border-emerald-300",
};

const EMPTY_FORM = {
  patient_name: "", mobile_number: "", age: "", gender: "Male",
  email: "", doctor: "", height: "", weight: "", blood_group: "",
  temperature: "", bp: "", pulse: "", resp_rate: "", spo2: "",
  allergies: "", emergency_contact: "", medical_history: ""
};

export default function ReceptionPage() {
  const router = useRouter();

  const [queue, setQueue]               = useState([]);
  const [patientsCount, setPatientsCount] = useState(0);
  const [doctors, setDoctors]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [toasts, setToasts]             = useState([]);
  const [stageFilter, setStageFilter]   = useState("All");

  const [showChoice, setShowChoice]     = useState(false);
  const [existStep, setExistStep]       = useState(false);
  const [existQuery, setExistQuery]     = useState("");
  const [existSearching, setExistSearching] = useState(false);

  const [showReg, setShowReg]           = useState(false);
  const [formState, setFormState]       = useState({ ...EMPTY_FORM });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = (msg, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };

  async function loadData() {
    setLoading(true);
    try {
      const q   = await getQueue();    setQueue(q);
      const pts = await getPatients(); setPatientsCount(Object.keys(pts).length);
      const allDocs = await getDoctors();
      setDoctors(allDocs);
      const availableDocs = allDocs.filter(d => d.status !== "Unavailable");
      if (availableDocs.length > 0) setFormState(p => ({ ...p, doctor: availableDocs[0].name }));
    } catch { toast("Failed to load data", "error"); }
    finally  { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    const h = e => { if (e.key === "Escape") { setShowChoice(false); setShowReg(false); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const handleExistSearch = async e => {
    e?.preventDefault();
    if (existQuery.length !== 10) { toast("Enter exactly 10-digit mobile number", "info"); return; }
    setExistSearching(true);
    try {
      const patient = await searchPatient(existQuery.trim());
      if (patient) {
        setShowChoice(false);
        router.push(`/patient/${patient.mobile_number}`);
      } else {
        toast(`No record found for "${existQuery}"`, "error");
      }
    } catch { toast("Search failed", "error"); }
    finally  { setExistSearching(false); }
  };

  const handleRegister = async (e, type = "Doctor Consultation") => {
    e.preventDefault();
    const { patient_name, mobile_number, doctor } = formState;
    if (!patient_name.trim())     { toast("Patient name is required", "error"); return; }
    if (mobile_number.length < 10){ toast("Enter a valid 10-digit mobile number", "error"); return; }
    if (!doctor)                  { toast("Please assign a doctor", "error"); return; }

    setIsSubmitting(true);
    const temp = {
      name: `TEMP-${Date.now().toString().slice(-4)}`,
      patient_name, mobile_number, doctor,
      appointment_status: type
    };
    setQueue(p => [temp, ...p]);
    setPatientsCount(p => p + 1);
    setShowReg(false);
    toast(type === "IPD" ? "Admitting patient…" : "Booking appointment…", "info");

    try {
      if (!formState.is_existing) {
        await createPatient({ ...formState, age: formState.age ? parseInt(formState.age) : null });
      }
      await createWalkIn({ patient_name, mobile_number, is_existing: formState.is_existing ? 1 : 0, doctor, appointment_status: type });
      toast(type === "IPD" ? "Admitted successfully!" : "Appointment booked!", "success");
      router.push(`/patient/${mobile_number}`);
      const uq = await getQueue(); setQueue(uq);
      const up = await getPatients(); setPatientsCount(Object.keys(up).length);
    } catch (err) { toast(err.message || "Registration failed", "error"); }
    finally       { setIsSubmitting(false); }
  };

  const moveStage = (patName, current) => {
    const wf   = WORKFLOW.find(w => w.key === current);
    if (!wf?.next) return;
    setQueue(p => p.map(pt => pt.name === patName ? { ...pt, appointment_status: wf.next } : pt));
    toast(`Moved to ${wf.next}`, "success");
  };

  const filtered = stageFilter === "All" ? queue : queue.filter(p => p.appointment_status === stageFilter);
  const stageCounts = WORKFLOW.reduce((acc, w) => ({ ...acc, [w.key]: queue.filter(p => p.appointment_status === w.key).length }), {});

  if (loading) {
    return (
      <div className="flex flex-col gap-5 max-w-6xl mx-auto animate-pulse p-6">
        <div className="flex gap-4">
          <div className="h-24 flex-1 bg-slate-200/80 rounded-xl" />
          <div className="h-24 flex-1 bg-slate-200/80 rounded-xl" />
        </div>
        <div className="h-64 w-full bg-slate-200/60 rounded-xl mt-6" />
        <div className="h-64 w-full bg-slate-200/60 rounded-xl mt-4" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-6xl mx-auto">

      {/* ── Toasts ──────────────────────────────────────────────────────── */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-xs w-full pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-md border text-xs font-medium animate-in slide-in-from-top-2 duration-200 pointer-events-auto bg-white
            ${t.type==="success" ? "border-emerald-200 text-emerald-700" : ""}
            ${t.type==="error"   ? "border-red-200    text-red-700"     : ""}
            ${t.type==="info"    ? "border-slate-200   text-slate-600"   : ""}`}>
            {t.type==="success" && <CheckCircle   className="w-3.5 h-3.5 shrink-0"/>}
            {t.type==="error"   && <AlertTriangle className="w-3.5 h-3.5 shrink-0"/>}
            {t.type==="info"    && <Info          className="w-3.5 h-3.5 shrink-0"/>}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>

      {/* ── Choice Modal ──────────────────────────────────────────────────── */}
      {showChoice && (
        <div className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-[2px] flex items-center justify-center"
          onClick={e => { if (e.target === e.currentTarget) { setShowChoice(false); setExistStep(false); setExistQuery(""); } }}>
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm mx-4 animate-in zoom-in-95 duration-200 overflow-hidden">

            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">
                {existStep ? "Find Existing Patient" : "Register Walk-in Patient"}
              </h3>
              <button onClick={() => { setShowChoice(false); setExistStep(false); setExistQuery(""); }}
                className="w-7 h-7 rounded-md hover:bg-slate-100 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {!existStep ? (
              <div className="p-5 space-y-2.5">
                <p className="text-[11px] text-slate-400 mb-3">Select the type of patient to continue.</p>

                <button onClick={() => {
                    setShowChoice(false);
                    setFormState({ ...EMPTY_FORM, doctor: doctors.length > 0 ? doctors[0].name : "" });
                    setShowReg(true);
                  }}
                  className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all duration-150 text-left group">
                  <div className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center shrink-0 group-hover:border-slate-400 transition-colors">
                    <UserPlus className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">New Patient</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">First visit — fill registration &amp; vitals</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </button>

                <button onClick={() => setExistStep(true)}
                  className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all duration-150 text-left group">
                  <div className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center shrink-0 group-hover:border-slate-400 transition-colors">
                    <Search className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">Existing Patient</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Already registered — search &amp; check-in</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </button>
              </div>
            ) : (
              <div className="p-5 space-y-3">
                <p className="text-[11px] text-slate-400">Enter the patient's mobile number (10 digits).</p>
                <form onSubmit={handleExistSearch} className="space-y-2.5">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <Input autoFocus placeholder="Mobile number..." value={existQuery} maxLength={10}
                      onChange={e => setExistQuery(e.target.value.replace(/\D/g, ''))} className="pl-9 h-10 text-sm border-slate-200" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => { setExistStep(false); setExistQuery(""); }}
                      className="flex-1 h-9 text-xs border-slate-200 text-slate-600">← Back</Button>
                    <Button type="submit" disabled={existSearching}
                      className="flex-1 h-9 text-xs bg-slate-900 hover:bg-slate-700 text-white gap-1.5">
                      {existSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Search className="w-3.5 h-3.5"/>}
                      Find Patient
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Registration Modal ──────────────────────────────────────────────── */}
      {showReg && (
        <div className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-[2px] flex items-start justify-center pt-8 pb-8 overflow-y-auto"
          onClick={e => { if (e.target === e.currentTarget) setShowReg(false); }}>
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl mx-4 animate-in slide-in-from-top-4 duration-200">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">New Patient Registration</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Complete all sections and record vitals before the doctor visit</p>
              </div>
              <button onClick={() => setShowReg(false)}
                className="w-7 h-7 rounded-md hover:bg-slate-100 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="overflow-y-auto max-h-[75vh]">

              {/* § 1 Personal */}
              <div className="px-6 pt-5 pb-5">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">1 — Personal Information</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Patient Name *" icon={<User className="w-3 h-3"/>}>
                    <Input placeholder="Full name" value={formState.patient_name} required className="h-9 text-sm border-slate-200"
                      onChange={e => setFormState({...formState, patient_name: e.target.value})}/>
                  </Field>
                  <Field label="Mobile Number *" icon={<Phone className="w-3 h-3"/>}>
                    <Input placeholder="10-digit number" value={formState.mobile_number} maxLength={10} required className="h-9 text-sm border-slate-200"
                      onChange={e => setFormState({...formState, mobile_number: e.target.value.replace(/\D/g,"")})}/>
                    {formState.mobile_number.length > 0 && formState.mobile_number.length < 10 &&
                      <p className="text-[10px] text-red-500 mt-1">{10-formState.mobile_number.length} more digits needed</p>}
                  </Field>
                  <Field label="Age" icon={<Calendar className="w-3 h-3"/>}>
                    <Input placeholder="Age in years" type="number" value={formState.age} className="h-9 text-sm border-slate-200"
                      onChange={e => setFormState({...formState, age: e.target.value})}/>
                  </Field>
                  <Field label="Gender">
                    <select value={formState.gender} onChange={e => setFormState({...formState, gender: e.target.value})}
                      className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400">
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </Field>
                  <Field label="Email" icon={<Mail className="w-3 h-3"/>}>
                    <Input type="email" placeholder="patient@email.com" value={formState.email} className="h-9 text-sm border-slate-200"
                      onChange={e => setFormState({...formState, email: e.target.value})}/>
                  </Field>
                  <Field label="Assign Doctor *" icon={<Stethoscope className="w-3 h-3"/>}>
                    <select value={formState.doctor} onChange={e => setFormState({...formState, doctor: e.target.value})} required
                      className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400">
                      <option value="">Select doctor…</option>
                      {doctors.map(d => <option key={d.name} value={d.name} disabled={d.status === "Unavailable"}>{d.doctor_name} ({d.specialization}) {d.status === "Unavailable" ? "- Unavailable" : ""}</option>)}
                    </select>
                  </Field>
                </div>
              </div>

              <div className="border-t border-slate-100 mx-6"/>

              {/* § 2 Body */}
              <div className="px-6 pt-5 pb-5">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">2 — Body Measurements</p>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Height" icon={<Ruler className="w-3 h-3"/>}>
                    <Input placeholder="e.g. 175 cm" value={formState.height} className="h-9 text-sm border-slate-200"
                      onChange={e => setFormState({...formState, height: e.target.value})}/>
                  </Field>
                  <Field label="Weight" icon={<Scale className="w-3 h-3"/>}>
                    <Input placeholder="e.g. 72 kg" value={formState.weight} className="h-9 text-sm border-slate-200"
                      onChange={e => setFormState({...formState, weight: e.target.value})}/>
                  </Field>
                  <Field label="Blood Group" icon={<Droplet className="w-3 h-3"/>}>
                    <select value={formState.blood_group} onChange={e => setFormState({...formState, blood_group: e.target.value})}
                      className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400">
                      <option value="">Select…</option>
                      {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(bg => <option key={bg}>{bg}</option>)}
                    </select>
                  </Field>
                </div>
              </div>

              <div className="border-t border-slate-100 mx-6"/>

              {/* § 3 Vitals */}
              <div className="px-6 pt-5 pb-5">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">3 — Pre-Consultation Vitals</p>
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { label:"Temp °F",  icon:<Thermometer className="w-3 h-3"/>, key:"temperature", ph:"98.6"   },
                    { label:"BP",       icon:<HeartPulse  className="w-3 h-3"/>, key:"bp",          ph:"120/80" },
                    { label:"Pulse",    icon:<Activity    className="w-3 h-3"/>, key:"pulse",       ph:"72 bpm" },
                    { label:"Resp.",    icon:<Wind        className="w-3 h-3"/>, key:"resp_rate",   ph:"16/min" },
                    { label:"SpO2 %",   icon:null,                               key:"spo2",        ph:"98%"    },
                  ].map(f => (
                    <Field key={f.key} label={f.label} icon={f.icon}>
                      <Input placeholder={f.ph} value={formState[f.key]} className="h-9 text-sm border-slate-200"
                        onChange={e => setFormState({...formState, [f.key]: e.target.value})}/>
                    </Field>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 mx-6"/>

              {/* § 4 Allergy */}
              <div className="px-6 pt-5 pb-5">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">4 — Allergy & Emergency</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Known Allergies" icon={<ShieldAlert className="w-3 h-3"/>}>
                    <Input placeholder="e.g. Penicillin, Dust" value={formState.allergies} className="h-9 text-sm border-slate-200"
                      onChange={e => setFormState({...formState, allergies: e.target.value})}/>
                  </Field>
                  <Field label="Emergency Contact" icon={<Phone className="w-3 h-3"/>}>
                    <Input placeholder="10-digit number" value={formState.emergency_contact} maxLength={10} className="h-9 text-sm border-slate-200"
                      onChange={e => setFormState({...formState, emergency_contact: e.target.value.replace(/\D/g,"")})}/>
                  </Field>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white">
                <Button type="button" variant="outline" onClick={() => setShowReg(false)}
                  className="h-9 text-xs border-slate-200 text-slate-600">Cancel</Button>
                <div className="flex items-center gap-2">
                  <Button type="button" disabled={isSubmitting} onClick={(e) => handleRegister(e, "IPD")}
                    className="h-9 px-4 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                    {isSubmitting
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/>Processing…</>
                      : <><BedDouble className="w-3.5 h-3.5"/>Admit (IPD)</>}
                  </Button>
                  <Button type="button" disabled={isSubmitting} onClick={(e) => handleRegister(e, "Doctor Consultation")}
                    className="h-9 px-4 text-xs bg-slate-900 hover:bg-slate-700 text-white gap-2">
                    {isSubmitting
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/>Processing…</>
                      : <><Calendar className="w-3.5 h-3.5"/>Book Appointment</>}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between pt-1">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Reception Desk</h1>
          <p className="text-xs text-slate-400 mt-0.5">Walk-in registration &amp; patient workflow management</p>
        </div>
        <Button onClick={() => setShowChoice(true)}
          className="h-9 px-4 text-xs bg-slate-900 hover:bg-slate-700 text-white gap-2">
          <UserPlus className="w-3.5 h-3.5"/> Register Walk-in
        </Button>
      </div>

      {/* ── Summary Stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-6 gap-3">
        {/* Total Registered */}
        <div className="col-span-1 border border-slate-200 rounded-lg px-4 py-3 bg-white">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Registered</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{patientsCount}</p>
        </div>
        {/* Stage counts */}
        {WORKFLOW.map(w => {
          const Icon  = w.icon;
          const count = stageCounts[w.key] || 0;
          return (
            <button key={w.key} onClick={() => setStageFilter(stageFilter === w.key ? "All" : w.key)}
              className={`col-span-1 border rounded-lg px-4 py-3 text-left transition-all duration-150 bg-white ${
                stageFilter === w.key
                  ? "border-slate-900 ring-1 ring-slate-900"
                  : "border-slate-200 hover:border-slate-400"
              }`}>
              <div className="flex items-center justify-between mb-1">
                <Icon className="w-3.5 h-3.5 text-slate-400" />
                {stageFilter === w.key && <span className="w-1.5 h-1.5 rounded-full bg-slate-900"/>}
              </div>
              <p className="text-2xl font-bold text-slate-900">{count}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{w.short}</p>
            </button>
          );
        })}
      </div>

      {/* ── Workflow Pipeline Bar ─────────────────────────────────────────── */}
      <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
        <div className="flex divide-x divide-slate-100">
          {WORKFLOW.map((w, i) => {
            const Icon  = w.icon;
            const count = stageCounts[w.key] || 0;
            const active = stageFilter === w.key;
            return (
              <button key={w.key} onClick={() => setStageFilter(active ? "All" : w.key)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 transition-colors ${
                  active ? "bg-slate-900" : "hover:bg-slate-50"
                }`}>
                <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-400"}`} />
                <span className={`text-[10px] font-semibold ${active ? "text-white" : "text-slate-600"}`}>{w.short}</span>
                <span className={`text-[10px] font-bold ${active ? "text-slate-300" : "text-slate-400"}`}>{count} patients</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Live Workflow Board ───────────────────────────────────────────── */}
      <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">

        {/* Table toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {stageFilter === "All" ? "All Patients" : stageFilter}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">{filtered.length} patient{filtered.length !== 1 ? "s" : ""} {stageFilter !== "All" ? "in this stage" : "in today's queue"}</p>
          </div>
          <div className="flex items-center gap-2">
            {stageFilter !== "All" && (
              <button onClick={() => setStageFilter("All")}
                className="text-[11px] text-slate-500 hover:text-slate-900 border border-slate-200 rounded-md px-2.5 py-1.5 flex items-center gap-1 transition-colors hover:bg-slate-50">
                <X className="w-3 h-3"/> Clear
              </button>
            )}
            <button onClick={loadData}
              className="text-[11px] text-slate-500 hover:text-slate-900 border border-slate-200 rounded-md px-2.5 py-1.5 flex items-center gap-1 transition-colors hover:bg-slate-50">
              <RefreshCw className="w-3 h-3"/> Refresh
            </button>
          </div>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-12 px-5 py-2.5 border-b border-slate-100 bg-slate-50">
          {["#", "Patient", "Stage", "Doctor", "Move to Next", ""].map((col, i) => (
            <div key={i} className={`text-[10px] font-semibold text-slate-400 uppercase tracking-wider
              ${i===0?"col-span-1":""} ${i===1?"col-span-4":""} ${i===2?"col-span-2":""} ${i===3?"col-span-2":""} ${i===4?"col-span-2":""} ${i===5?"col-span-1 text-right":""}`}>
              {col}
            </div>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center">
              <ClipboardSVG />
            </div>
            <p className="text-sm font-medium text-slate-500">No patients{stageFilter !== "All" ? ` in ${stageFilter}` : " in queue"}</p>
            <p className="text-xs text-slate-400">Patients will appear here after registration</p>
          </div>
        ) : filtered.map((pat, idx) => {
          const status     = pat.appointment_status || "Doctor Consultation";
          const wf         = WORKFLOW.find(w => w.key === status);
          const NextIcon   = wf?.next ? WORKFLOW.find(w => w.key === wf.next)?.icon : null;
          const nextLabel  = wf?.next ? WORKFLOW.find(w => w.key === wf.next)?.short : null;
          const isDone     = status === "Done";

          return (
            <div key={`${pat.name}-${idx}`}
              className="grid grid-cols-12 px-5 py-3.5 border-b border-slate-50 items-center hover:bg-slate-50/60 transition-colors">

              {/* Index */}
              <div className="col-span-1">
                <span className="text-[11px] text-slate-400 font-medium">{String(idx + 1).padStart(2, "0")}</span>
              </div>

              {/* Patient */}
              <div className="col-span-4 flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-600 shrink-0">
                  {pat.patient_name?.[0]?.toUpperCase() || "P"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{pat.patient_name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{pat.mobile_number}</p>
                </div>
              </div>

              {/* Stage */}
              <div className="col-span-2">
                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-semibold ${
                  isDone ? "border-emerald-200 text-emerald-700 bg-white" : "border-slate-200 text-slate-700 bg-white"
                }`}>
                  {wf && <wf.icon className="w-3 h-3"/>}
                  {wf?.short || status}
                </span>
              </div>

              {/* Doctor */}
              <div className="col-span-2">
                <p className="text-[11px] text-slate-500 truncate">{pat.doctor || "—"}</p>
              </div>

              {/* Move next */}
              <div className="col-span-2">
                {!isDone && wf?.next ? (
                  <button onClick={() => moveStage(pat.name, status)}
                    className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-700 border border-slate-200 rounded-md px-2.5 py-1.5 hover:bg-slate-100 hover:border-slate-400 transition-colors">
                    {NextIcon && <NextIcon className="w-3 h-3"/>}
                    {nextLabel}
                    <ArrowRight className="w-3 h-3 text-slate-400 ml-0.5"/>
                  </button>
                ) : isDone ? (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                    <CheckCircle className="w-3.5 h-3.5"/> Complete
                  </span>
                ) : null}
              </div>

              {/* Profile */}
              <div className="col-span-1 flex justify-end">
                <button onClick={() => router.push(`/patient/${pat.mobile_number}`)}
                  className="w-7 h-7 rounded-md border border-slate-200 hover:border-slate-400 flex items-center justify-center transition-colors hover:bg-slate-100"
                  title="View Profile">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400"/>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
      </Label>
      {children}
    </div>
  );
}

function ClipboardSVG() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}
