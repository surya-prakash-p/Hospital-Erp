"use client";

import { WALK_IN_ENABLED } from "@/lib/feature-flags";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
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
  const [patientsList, setPatientsList] = useState([]);
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
      const pts = await getPatients(); 
      setPatientsList(Object.values(pts || {}));
      setPatientsCount(Object.keys(pts || {}).length);
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

  const handleSelectExistingPatient = (patient) => {
    setFormState({
      ...EMPTY_FORM,
      patient_name: patient.patient_name,
      mobile_number: patient.mobile_number,
      age: patient.age || "",
      gender: patient.gender || "Male",
      email: patient.email || "",
      emergency_contact: patient.emergency_contact || "",
      medical_history: patient.medical_history || "",
      allergies: patient.allergies || "",
      is_existing: true,
      doctor: doctors.length > 0 ? doctors[0].name : ""
    });
    setShowChoice(false);
    setExistStep(false);
    setExistQuery("");
    setShowReg(true);
    toast(`Pre-filled profile for ${patient.patient_name}`, "success");
  };

  const handleExistSearch = async e => {
    e?.preventDefault();
    const query = existQuery.trim().toLowerCase();
    if (!query) { toast("Please enter a name or mobile number", "info"); return; }
    
    // Search local list first
    const match = patientsList.find(p => 
      p.patient_name?.toLowerCase() === query || 
      p.mobile_number === query
    ) || patientsList.find(p => 
      p.patient_name?.toLowerCase().includes(query) || 
      p.mobile_number?.includes(query)
    );
    
    if (match) {
      handleSelectExistingPatient(match);
    } else {
      // Fallback: search remote Frappe API
      setExistSearching(true);
      try {
        const patient = await searchPatient(query);
        if (patient) {
          handleSelectExistingPatient(patient);
        } else {
          toast(`No patient found matching "${existQuery}"`, "error");
        }
      } catch { 
        toast("Search failed", "error"); 
      } finally { 
        setExistSearching(false); 
      }
    }
  };

  const printConsultationInvoice = (walkIn, docFee) => {
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
      doc.text(walkIn.name || "N/A", 50, posY);

      doc.setFont("helvetica", "bold");
      doc.text("Patient Name:", 115, posY);
      doc.setFont("helvetica", "normal");
      doc.text(walkIn.patient_name || "", 145, posY);
      posY += 6;

      doc.setFont("helvetica", "bold");
      doc.text("Date & Time:", 20, posY);
      doc.setFont("helvetica", "normal");
      doc.text(new Date().toLocaleString(), 50, posY);

      doc.setFont("helvetica", "bold");
      doc.text("Mobile Number:", 115, posY);
      doc.setFont("helvetica", "normal");
      doc.text(walkIn.mobile_number || "", 145, posY);
      posY += 8;

      // Line separator
      doc.line(20, posY, 190, posY);
      posY += 8;

      // Doctor
      doc.setFont("helvetica", "bold");
      doc.text("Consulting Doctor:", 20, posY);
      doc.setFont("helvetica", "normal");
      doc.text(walkIn.doctor || "", 55, posY);
      posY += 8;

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

      doc.setFont("helvetica", "normal");
      doc.text(`Doctor OPD Consultation Fee (${walkIn.doctor})`, 22, posY);
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
      doc.text("Generated digitally via Thangam Hospital Reception Desk. No signature required.", 105, posY + 10, { align: "center" });

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
    } catch (err) {
      console.error("Failed to print consultation invoice", err);
    }
  };

  const handleRegister = async (e, type = "Doctor Consultation") => {
    e.preventDefault();
    if (!WALK_IN_ENABLED) return;
    const { patient_name, mobile_number, doctor } = formState;
    if (!patient_name.trim())     { toast("Patient name is required", "error"); return; }
    if (mobile_number.length < 10){ toast("Enter a valid 10-digit mobile number", "error"); return; }
    if (!formState.age && !formState.is_existing) { toast("Age is required for new patients", "error"); return; }
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
      const created = await createWalkIn({ patient_name, mobile_number, is_existing: formState.is_existing ? 1 : 0, doctor, appointment_status: type });
      
      // If it is OPD consultation, print the consultation invoice!
      if (type === "Doctor Consultation") {
        const DOCTOR_FEES = { "Dr. Rajesh": 500, "Dr. Priya": 1000, "Dr. Vignesh": 600 };
        const docFee = DOCTOR_FEES[doctor] || 500;
        printConsultationInvoice(created, docFee);
      }

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
      {WALK_IN_ENABLED && showChoice && (
        <div className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-[2px] flex items-center justify-center"
          onClick={e => { if (e.target === e.currentTarget) { setShowChoice(false); } }}>
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md mx-4 animate-in zoom-in-95 duration-200 overflow-hidden">

            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">
                Register Walk-in Patient
              </h3>
              <button onClick={() => { setShowChoice(false); }}
                className="w-7 h-7 rounded-md hover:bg-slate-100 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

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

              <button onClick={() => {
                  setShowChoice(false);
                  router.push("/patient-registry");
                }}
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
          </div>
        </div>
      )}

      {/* ── Registration Modal ──────────────────────────────────────────────── */}
      {WALK_IN_ENABLED && showReg && (
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
                  <Field label="Age *" icon={<Calendar className="w-3 h-3"/>}>
                    <Input placeholder="Age in years" type="number" value={formState.age} required={!formState.is_existing} className="h-9 text-sm border-slate-200"
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

      {WALK_IN_ENABLED && (
        <div className="flex items-center justify-end">
          <Button onClick={() => setShowChoice(true)}
            className="h-9 px-4 text-xs bg-slate-900 hover:bg-slate-700 text-white gap-2">
            <UserPlus className="w-3.5 h-3.5"/> Register Walk-in
          </Button>
        </div>
      )}

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
                <span className={`text-[10px] font-bold ${active ? "text-slate-300" : "text-slate-400"}`}>{count} visitors</span>
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
              {stageFilter === "All" ? "Visitors List" : stageFilter}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">{filtered.length} visitor{filtered.length !== 1 ? "s" : ""} {stageFilter !== "All" ? "in this stage" : "in today's queue"}</p>
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
          {["#", "Visitor Name", "Stage", "Doctor", "Move to Next", ""].map((col, i) => (
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
            <p className="text-sm font-medium text-slate-500">No visitors{stageFilter !== "All" ? ` in ${stageFilter}` : " in queue"}</p>
            <p className="text-xs text-slate-400">Visitors will appear here after registration</p>
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
