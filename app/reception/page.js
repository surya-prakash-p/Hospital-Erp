"use client";

import { WALK_IN_ENABLED } from "@/lib/feature-flags";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search, UserPlus, CheckCircle, AlertTriangle, Info, X,
  Loader2, User, Phone, Mail, Calendar, Stethoscope, Ruler,
  Scale, Droplet, ShieldAlert, Wind, Activity, Thermometer,
  HeartPulse, Pill, Receipt, RefreshCw,
  ArrowRight, ChevronRight, BedDouble, Eye, FileText, Download, ArrowLeft, Printer
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  getQueue, getPatients, getDoctors, searchPatient, createPatient, createWalkIn
} from "@/lib/hospital-service";

const WORKFLOW = [
  { key: "Doctor Consultation", short: "Consultation", icon: Stethoscope,  next: "Pharmacy" },
  { key: "Pharmacy",            short: "Pharmacy",     icon: Pill,         next: "Billing"  },
  { key: "Billing",             short: "Billing & Pay",icon: Receipt,      next: "Done"     },
  { key: "Done",                short: "Done",         icon: CheckCircle,  next: null       },
];

const STAGE_BADGE = {
  "Doctor Consultation": "text-slate-700 border-slate-300",
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
  const [activeRegTab, setActiveRegTab] = useState("new"); // "new" | "existing"
  const [existQuery, setExistQuery]     = useState("");
  const [existSearching, setExistSearching] = useState(false);
  const [selectedExistingPatient, setSelectedExistingPatient] = useState(null);
  const [existingDoctor, setExistingDoctor] = useState("");
  const [existingVitals, setExistingVitals] = useState({
    temperature: "", bp: "", pulse: "", resp_rate: "", spo2: ""
  });

  const [viewingInvoicePatient, setViewingInvoicePatient] = useState(null);
  const [previewInvoice, setPreviewInvoice]               = useState(null);
  const [isDownloadingPDF, setIsDownloadingPDF]           = useState(false);
  const [showReg, setShowReg]           = useState(false);
  const [formState, setFormState]       = useState({ ...EMPTY_FORM });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = (msg, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };

  const getDocFeeFromState = (docName) => {
    const d = doctors.find(doc => doc.name === docName || doc.doctor_name === docName);
    if (d && d.consultation_fee) {
      const parsed = parseFloat(d.consultation_fee);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return 500;
  };

  async function loadDataSilently() {
    try {
      const [q, pts] = await Promise.all([getQueue(), getPatients()]);
      setQueue(q || []);
      setPatientsList(Object.values(pts || {}));
      setPatientsCount(Object.keys(pts || {}).length);
    } catch (e) {
      console.warn("Silent reception queue refresh error:", e);
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      const [q, pts, allDocs] = await Promise.all([
        getQueue(),
        getPatients(),
        getDoctors()
      ]);
      setQueue(q || []);
      setPatientsList(Object.values(pts || {}));
      setPatientsCount(Object.keys(pts || {}).length);
      setDoctors(allDocs || []);
      const availableDocs = (allDocs || []).filter(d => d.status !== "Unavailable");
      if (availableDocs.length > 0) {
        setFormState(p => ({ ...p, doctor: availableDocs[0].name }));
        setExistingDoctor(availableDocs[0].name);
      }
    } catch { toast("Failed to load data", "error"); }
    finally  { setLoading(false); }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadDataSilently();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const h = e => { 
      if (e.key === "Escape") { 
        setShowReg(false); 
        setViewingInvoicePatient(null); 
        setPreviewInvoice(null);
      } 
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const openWalkInModal = (tab = "new") => {
    setActiveRegTab(tab);
    setSelectedExistingPatient(null);
    setExistQuery("");
    const availableDocs = doctors.filter(d => d.status !== "Unavailable");
    const defaultDoc = availableDocs.length > 0 ? availableDocs[0].name : (doctors[0]?.name || "");
    setFormState({ ...EMPTY_FORM, doctor: defaultDoc });
    setExistingDoctor(defaultDoc);
    setExistingVitals({ temperature: "", bp: "", pulse: "", resp_rate: "", spo2: "" });
    setShowReg(true);
  };

  const handleSelectExistingPatient = (patient) => {
    setSelectedExistingPatient(patient);
    const availableDocs = doctors.filter(d => d.status !== "Unavailable");
    if (!existingDoctor && availableDocs.length > 0) {
      setExistingDoctor(availableDocs[0].name);
    }
    toast(`Selected ${patient.patient_name}`, "info");
  };

  const filteredExistingPatients = patientsList.filter(p => {
    if (!existQuery.trim()) return true;
    const q = existQuery.trim().toLowerCase();
    return (
      p.patient_name?.toLowerCase().includes(q) ||
      p.mobile_number?.includes(q) ||
      p.name?.toLowerCase().includes(q)
    );
  });

  const handleExistSearchRemote = async e => {
    e?.preventDefault();
    const query = existQuery.trim().toLowerCase();
    if (!query) return;
    
    // Remote Frappe fallback search if not found in local list
    setExistSearching(true);
    try {
      const patient = await searchPatient(query);
      if (patient) {
        handleSelectExistingPatient(patient);
      } else if (filteredExistingPatients.length === 0) {
        toast(`No patient found matching "${existQuery}"`, "error");
      }
    } catch { 
      toast("Search failed", "error"); 
    } finally { 
      setExistSearching(false); 
    }
  };

  const downloadConsultationPDF = async (walkIn, docFee) => {
    setIsDownloadingPDF(true);
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
      doc.text(walkIn.doctor || "General OPD", 55, posY);
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
      doc.text(`Doctor OPD Consultation Fee (${walkIn.doctor || "General OPD"})`, 22, posY);
      doc.text("1", 120, posY, { align: "center" });
      doc.text(`INR ${Number(docFee || 500).toFixed(2)}`, 145, posY, { align: "right" });
      doc.text(`INR ${Number(docFee || 500).toFixed(2)}`, 185, posY, { align: "right" });
      posY += 7;

      // Totals Area
      posY += 3;
      doc.line(20, posY, 190, posY);
      posY += 8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("GRAND TOTAL (CONSULTATION):", 110, posY);
      doc.text(`INR ${Number(docFee || 500).toFixed(2)}`, 185, posY, { align: "right" });
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

      doc.save(`consultation_invoice_${walkIn.name || "receipt"}.pdf`);
      toast(`Consultation invoice downloaded`, "success");
    } catch (err) {
      console.error("Failed to download consultation invoice", err);
      toast("Download failed", "error");
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const downloadPharmacyPDF = async (pat) => {
    setIsDownloadingPDF(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      let posY = 20;

      // Header
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("THANGAM HOSPITAL", 105, posY, { align: "center" });
      posY += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text("123 Health City Road, Coimbatore - 641012", 105, posY, { align: "center" });
      posY += 5;
      doc.text("Phone: +91 422 2345678 | Email: pharmacy@thangam.org", 105, posY, { align: "center" });
      posY += 8;

      // Line separator
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(20, posY, 190, posY);
      posY += 8;

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(16, 185, 129); // emerald-600
      doc.text("PHARMACY DISPENSARY & MEDICINE INVOICE", 20, posY);
      posY += 8;

      // Meta Table
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text("Visit/Rx Ref:", 20, posY);
      doc.setFont("helvetica", "normal");
      doc.text(pat.name || "N/A", 50, posY);

      doc.setFont("helvetica", "bold");
      doc.text("Patient Name:", 115, posY);
      doc.setFont("helvetica", "normal");
      doc.text(pat.patient_name || "", 145, posY);
      posY += 6;

      doc.setFont("helvetica", "bold");
      doc.text("Date & Time:", 20, posY);
      doc.setFont("helvetica", "normal");
      doc.text(new Date().toLocaleString(), 50, posY);

      doc.setFont("helvetica", "bold");
      doc.text("Mobile Number:", 115, posY);
      doc.setFont("helvetica", "normal");
      doc.text(pat.mobile_number || "", 145, posY);
      posY += 6;

      doc.setFont("helvetica", "bold");
      doc.text("Prescribing Doctor:", 20, posY);
      doc.setFont("helvetica", "normal");
      doc.text(pat.doctor || "General OPD", 55, posY);
      posY += 8;

      doc.line(20, posY, 190, posY);
      posY += 8;

      // Medicine items table
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setFillColor(248, 250, 252);
      doc.rect(20, posY - 4, 170, 7, "F");
      doc.text("Prescribed Medicine / Item", 22, posY);
      doc.text("Dosage / Instructions", 90, posY);
      doc.text("Status", 145, posY);
      doc.text("Amount", 185, posY, { align: "right" });
      posY += 8;

      doc.setFont("helvetica", "normal");
      const prescriptionText = pat.prescription || "Standard Clinical Dispensary (As Prescribed)";
      doc.text(prescriptionText.slice(0, 38), 22, posY);
      doc.text("As directed by physician", 90, posY);
      doc.text(pat.pharmacy_status || "Dispensed", 145, posY);
      const medBill = pat.pharmacy_bill_amount || pat.bill_amount || 0;
      doc.text(medBill > 0 ? `INR ${Number(medBill).toFixed(2)}` : "Included", 185, posY, { align: "right" });
      posY += 10;

      doc.line(20, posY, 190, posY);
      posY += 8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("TOTAL PHARMACY BILL:", 110, posY);
      doc.text(`INR ${Number(medBill).toFixed(2)}`, 185, posY, { align: "right" });
      posY += 12;

      // Stamp
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(0.8);
      doc.rect(75, posY, 60, 12);
      doc.setTextColor(16, 185, 129);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("MEDICINES DISPENSED", 105, posY + 7, { align: "center" });
      posY += 20;

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Computerized Pharmacy Record. Thangam Hospital Dispensary.", 105, posY + 10, { align: "center" });

      doc.save(`pharmacy_invoice_${pat.name || "receipt"}.pdf`);
      toast(`Pharmacy invoice downloaded`, "success");
    } catch (err) {
      console.error("Failed to download pharmacy invoice", err);
      toast("Download failed", "error");
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleRegisterNew = async (e, type = "Doctor Consultation") => {
    e.preventDefault();
    if (!WALK_IN_ENABLED) return;
    const { patient_name, mobile_number, doctor } = formState;
    if (!patient_name.trim())     { toast("Patient name is required", "error"); return; }
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
      await createPatient({ ...formState, age: formState.age ? parseInt(formState.age) : null });
      await createWalkIn({
        patient_name,
        mobile_number,
        is_existing: 0,
        doctor,
        appointment_status: type
      });
      
      toast(type === "IPD" ? "Admitted successfully!" : "Appointment booked successfully!", "success");
      const uq = await getQueue(); setQueue(uq || []);
      const up = await getPatients();
      setPatientsList(Object.values(up || {}));
      setPatientsCount(Object.keys(up || {}).length);
    } catch (err) { toast(err.message || "Registration failed", "error"); }
    finally       { setIsSubmitting(false); }
  };

  const handleRegisterExisting = async (e, type = "Doctor Consultation") => {
    e.preventDefault();
    if (!WALK_IN_ENABLED) return;
    if (!selectedExistingPatient) {
      toast("Please select an existing patient first", "error");
      return;
    }
    if (!existingDoctor) {
      toast("Please assign a doctor", "error");
      return;
    }

    const { patient_name, mobile_number } = selectedExistingPatient;
    setIsSubmitting(true);
    const temp = {
      name: `TEMP-${Date.now().toString().slice(-4)}`,
      patient_name, mobile_number, doctor: existingDoctor,
      appointment_status: type
    };
    setQueue(p => [temp, ...p]);
    setShowReg(false);
    toast(type === "IPD" ? "Admitting existing patient…" : "Checking in existing patient…", "info");

    try {
      await createWalkIn({
        patient_name,
        mobile_number,
        is_existing: 1,
        doctor: existingDoctor,
        appointment_status: type,
        vitals: existingVitals
      });
      
      toast(type === "IPD" ? "Admitted successfully!" : `Checked in for Dr. ${existingDoctor}`, "success");
    } catch (err) { toast(err.message || "Check-in failed", "error"); }
    finally       { setIsSubmitting(false); }
  };

  const getStationBadge = (status) => {
    switch (status) {
      case "Doctor Consultation":
        return {
          label: "Doctor Consultation",
          className: "border-blue-200 text-blue-700 bg-blue-50/80",
          icon: Stethoscope
        };
      case "Pharmacy":
        return {
          label: "Pharmacy",
          className: "border-amber-200 text-amber-700 bg-amber-50/80",
          icon: Pill
        };
      case "Billing":
        return {
          label: "Billing & Pay",
          className: "border-emerald-200 text-emerald-700 bg-emerald-50/80",
          icon: Receipt
        };
      case "IPD Admission":
        return {
          label: "IPD Ward",
          className: "border-purple-200 text-purple-700 bg-purple-50/80",
          icon: BedDouble
        };
      case "Done":
        return {
          label: "Completed",
          className: "border-emerald-200 text-emerald-700 bg-emerald-50/80",
          icon: CheckCircle
        };
      default:
        return {
          label: status || "Doctor Consultation",
          className: "border-slate-200 text-slate-700 bg-slate-50",
          icon: Activity
        };
    }
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

      {/* ── 2-Tab Walk-in Registration Modal ─────────────────────────────────── */}
      {WALK_IN_ENABLED && showReg && (
        <div className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-[2px] flex items-start justify-center pt-6 pb-6 overflow-y-auto"
          onClick={e => { if (e.target === e.currentTarget) setShowReg(false); }}>
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl mx-4 animate-in slide-in-from-top-4 duration-200 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Walk-in Patient Registration</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Register a new walk-in or check in an existing registered patient</p>
              </div>
              <button onClick={() => setShowReg(false)}
                className="w-7 h-7 rounded-md hover:bg-slate-100 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="px-6 py-2.5 border-b border-slate-100 bg-slate-50/80 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveRegTab("new")}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeRegTab === "new"
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}>
                <UserPlus className="w-3.5 h-3.5 text-slate-600" />
                New Patient
              </button>
              <button
                type="button"
                onClick={() => setActiveRegTab("existing")}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeRegTab === "existing"
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}>
                <Search className="w-3.5 h-3.5 text-slate-600" />
                Existing Patient
                {patientsCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-normal">
                    {patientsCount}
                  </span>
                )}
              </button>
            </div>

            {/* TAB 1: New Patient Form */}
            {activeRegTab === "new" && (
              <form onSubmit={handleRegisterNew} className="overflow-y-auto max-h-[72vh]">
                {/* § 1 Personal */}
                <div className="px-6 pt-5 pb-5">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">1 — Personal Information</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Patient Name *" icon={<User className="w-3 h-3"/>}>
                      <Input placeholder="Full name" value={formState.patient_name} required className="h-9 text-sm border-slate-200"
                        onChange={e => setFormState({...formState, patient_name: e.target.value})}/>
                    </Field>
                    <Field label="Mobile Number" icon={<Phone className="w-3 h-3"/>}>
                      <Input placeholder="Mobile number (optional)" value={formState.mobile_number} maxLength={10} className="h-9 text-sm border-slate-200"
                        onChange={e => setFormState({...formState, mobile_number: e.target.value.replace(/\D/g,"")})}/>
                    </Field>
                    <Field label="Age" icon={<Calendar className="w-3 h-3"/>}>
                      <Input placeholder="Age in years (optional)" type="number" value={formState.age} className="h-9 text-sm border-slate-200"
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
                    <Button type="button" disabled={isSubmitting} onClick={(e) => handleRegisterNew(e, "IPD")}
                      className="h-9 px-4 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                      {isSubmitting
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/>Processing…</>
                        : <><BedDouble className="w-3.5 h-3.5"/>Admit (IPD)</>}
                    </Button>
                    <Button type="submit" disabled={isSubmitting}
                      className="h-9 px-4 text-xs bg-slate-900 hover:bg-slate-800 text-white gap-2">
                      {isSubmitting
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/>Processing…</>
                        : <><Calendar className="w-3.5 h-3.5"/>Book Appointment</>}
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 2: Existing Patient Search & Check-in */}
            {activeRegTab === "existing" && (
              <div className="overflow-y-auto max-h-[72vh]">
                {!selectedExistingPatient ? (
                  <div className="p-6 space-y-4">
                    {/* Search Bar */}
                    <form onSubmit={handleExistSearchRemote} className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <Input
                          placeholder="Search by patient name, 10-digit mobile, or ID..."
                          value={existQuery}
                          onChange={e => setExistQuery(e.target.value)}
                          className="pl-9 h-9 text-sm border-slate-200 focus:border-slate-400"
                        />
                      </div>
                      {existSearching && (
                        <Button disabled type="button" variant="outline" className="h-9 px-3 text-xs">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        </Button>
                      )}
                    </form>

                    {/* Results List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                          {existQuery ? `Matching Patients (${filteredExistingPatients.length})` : `Registered Patients (${filteredExistingPatients.length})`}
                        </p>
                        <span className="text-[10px] text-slate-400">Click a patient to select</span>
                      </div>

                      {filteredExistingPatients.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-slate-200 rounded-lg">
                          <User className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs text-slate-500 font-medium">No registered patient found</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Try searching another term or register as a New Patient</p>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setActiveRegTab("new")}
                            className="mt-3 h-8 text-xs border-slate-200">
                            <UserPlus className="w-3.5 h-3.5 mr-1" /> Switch to New Patient
                          </Button>
                        </div>
                      ) : (
                        <div className="max-h-[300px] overflow-y-auto space-y-1.5 pr-1">
                          {filteredExistingPatients.slice(0, 20).map(patient => (
                            <div
                              key={patient.name || patient.mobile_number}
                              onClick={() => handleSelectExistingPatient(patient)}
                              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 cursor-pointer transition-all group">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                    {patient.patient_name}
                                  </p>
                                  {patient.blood_group && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                                      {patient.blood_group}
                                    </span>
                                  )}
                                  {patient.allergies && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 font-medium flex items-center gap-1">
                                      <ShieldAlert className="w-2.5 h-2.5" /> Allergy
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    {patient.mobile_number}
                                  </span>
                                  {patient.age && <span>• {patient.age} yrs</span>}
                                  {patient.gender && <span>• {patient.gender}</span>}
                                </div>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 px-2.5 text-[11px] border-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                Select
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleRegisterExisting}>
                    <div className="p-6 space-y-5">
                      {/* Selected Patient Card */}
                      <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                              Selected Patient
                            </span>
                            {selectedExistingPatient.blood_group && (
                              <span className="text-[10px] font-semibold text-slate-700 bg-white border border-indigo-200 px-1.5 py-0.5 rounded">
                                {selectedExistingPatient.blood_group}
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-slate-900 mt-1.5">
                            {selectedExistingPatient.patient_name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {selectedExistingPatient.mobile_number}
                            </span>
                            {selectedExistingPatient.age && <span>• Age: {selectedExistingPatient.age}</span>}
                            {selectedExistingPatient.gender && <span>• Gender: {selectedExistingPatient.gender}</span>}
                            {selectedExistingPatient.allergies && (
                              <span className="text-amber-700 font-medium">
                                • Allergies: {selectedExistingPatient.allergies}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedExistingPatient(null)}
                          className="text-xs text-slate-500 hover:text-slate-800">
                          Change
                        </Button>
                      </div>

                      {/* Doctor Assignment */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                          Assign Consulting Doctor *
                        </Label>
                        <select
                          value={existingDoctor}
                          onChange={e => setExistingDoctor(e.target.value)}
                          required
                          className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400">
                          <option value="">Select doctor…</option>
                          {doctors.map(d => (
                            <option key={d.name} value={d.name} disabled={d.status === "Unavailable"}>
                              {d.doctor_name} ({d.specialization}) {d.status === "Unavailable" ? "- Unavailable" : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Today's Pre-Consultation Vitals (Optional) */}
                      <div className="pt-2 border-t border-slate-100">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
                          Today's Vitals (Optional)
                        </p>
                        <div className="grid grid-cols-5 gap-2.5">
                          {[
                            { label: "Temp °F", icon: <Thermometer className="w-3 h-3" />, key: "temperature", ph: "98.6" },
                            { label: "BP",      icon: <HeartPulse className="w-3 h-3" />,  key: "bp",          ph: "120/80" },
                            { label: "Pulse",   icon: <Activity className="w-3 h-3" />,    key: "pulse",       ph: "72 bpm" },
                            { label: "Resp.",   icon: <Wind className="w-3 h-3" />,        key: "resp_rate",   ph: "16/min" },
                            { label: "SpO2 %",  icon: null,                                 key: "spo2",        ph: "98%" },
                          ].map(f => (
                            <Field key={f.key} label={f.label} icon={f.icon}>
                              <Input
                                placeholder={f.ph}
                                value={existingVitals[f.key]}
                                className="h-8 text-xs border-slate-200"
                                onChange={e => setExistingVitals({ ...existingVitals, [f.key]: e.target.value })}
                              />
                            </Field>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSelectedExistingPatient(null)}
                        className="h-9 text-xs border-slate-200 text-slate-600">
                        Back to Search
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          disabled={isSubmitting}
                          onClick={e => handleRegisterExisting(e, "IPD")}
                          className="h-9 px-4 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                          {isSubmitting
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Processing…</>
                            : <><BedDouble className="w-3.5 h-3.5" />Admit (IPD)</>}
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="h-9 px-4 text-xs bg-slate-900 hover:bg-slate-800 text-white gap-2">
                          {isSubmitting
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Processing…</>
                            : <><CheckCircle className="w-3.5 h-3.5" />Check-in Patient</>}
                        </Button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Top Action Bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Reception Desk</h1>
          <p className="text-xs text-slate-500">Live patient queue, triage and walk-in check-in</p>
        </div>
        {WALK_IN_ENABLED && (
          <Button onClick={() => openWalkInModal("new")}
            className="h-9 px-4 text-xs bg-slate-900 hover:bg-slate-800 text-white gap-2 shadow-sm">
            <UserPlus className="w-3.5 h-3.5"/> Register Walk-in
          </Button>
        )}
      </div>


      {/* ── Summary Stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-3">
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
          {WORKFLOW.map((w) => {
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
                <X className="w-3 h-3"/> Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-12 px-5 py-2.5 border-b border-slate-100 bg-slate-50">
          {["#", "Visitor Name", "Doctor", "Current Station", "Invoices"].map((col, i) => (
            <div key={i} className={`text-[10px] font-semibold text-slate-400 uppercase tracking-wider
              ${i===0?"col-span-1":""} ${i===1?"col-span-4":""} ${i===2?"col-span-3":""} ${i===3?"col-span-3":""} ${i===4?"col-span-1 text-right":""}`}>
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
          const status      = pat.appointment_status || "Doctor Consultation";
          const stationInfo = getStationBadge(status);
          const StationIcon = stationInfo.icon;

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

              {/* Doctor */}
              <div className="col-span-3 min-w-0">
                <p className="text-[11px] text-slate-600 font-medium truncate flex items-center gap-1.5">
                  <Stethoscope className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{pat.doctor || "—"}</span>
                </p>
              </div>

              {/* Current Station */}
              <div className="col-span-3">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold ${stationInfo.className}`}>
                  <StationIcon className="w-3.5 h-3.5 shrink-0"/>
                  <span className="truncate">{stationInfo.label}</span>
                </span>
              </div>

              {/* View Invoices */}
              <div className="col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingInvoicePatient(pat)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 border border-slate-200 hover:border-slate-400 rounded-md px-2.5 py-1.5 hover:bg-slate-100 transition-colors shadow-xs"
                  title="View Invoices">
                  <Eye className="w-3.5 h-3.5 text-slate-500"/>
                  View
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── View Invoices Selection Modal ────────────────────────────────── */}
      {viewingInvoicePatient && (
        <div
          className="fixed inset-0 z-[95] bg-black/30 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={e => { if (e.target === e.currentTarget) setViewingInvoicePatient(null); }}>
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md mx-auto overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Patient Invoices &amp; Records</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {viewingInvoicePatient.patient_name} • {viewingInvoicePatient.mobile_number}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingInvoicePatient(null)}
                className="w-7 h-7 rounded-md hover:bg-slate-100 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Invoices List */}
            <div className="p-5 space-y-3">
              {/* Appointment Invoice Option - Always available */}
              <div className="p-3.5 rounded-lg border border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50/80 transition-colors flex items-center justify-between">
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                    <p className="text-xs font-bold text-slate-800">Appointment Invoice</p>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    OPD Consultation • {viewingInvoicePatient.doctor || "General OPD"}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const fee = getDocFeeFromState(viewingInvoicePatient.doctor);
                    setPreviewInvoice({
                      type: "appointment",
                      patient: viewingInvoicePatient,
                      fee: fee
                    });
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] h-8 px-3 gap-1.5 shrink-0 shadow-xs">
                  <Eye className="w-3.5 h-3.5" /> View Invoice
                </Button>
              </div>

              {/* Pharmacy Invoice Option - Only shown when pharmacy stage/dispensing is active */}
              {(viewingInvoicePatient.appointment_status === "Pharmacy" ||
                viewingInvoicePatient.appointment_status === "Billing" ||
                viewingInvoicePatient.appointment_status === "Done" ||
                viewingInvoicePatient.pharmacy_status === "Dispensed" ||
                (Number(viewingInvoicePatient.pharmacy_bill_amount) > 0)) ? (
                <div className="p-3.5 rounded-lg border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50/80 transition-colors flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <Pill className="w-4 h-4 text-emerald-600 shrink-0" />
                      <p className="text-xs font-bold text-slate-800">Pharmacy Invoice</p>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Prescription &amp; Dispensary Bill • {viewingInvoicePatient.pharmacy_status || "Dispensed"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setPreviewInvoice({
                        type: "pharmacy",
                        patient: viewingInvoicePatient
                      });
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-8 px-3 gap-1.5 shrink-0 shadow-xs">
                    <Eye className="w-3.5 h-3.5" /> View Invoice
                  </Button>
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/70 flex items-start gap-2.5 text-[11px] text-slate-500">
                  <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-700">Pharmacy Invoice Unavailable</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      The patient is currently in Consultation stage. Pharmacy invoice unlocks once medicines are prescribed and processed.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setViewingInvoicePatient(null)}
                className="text-xs h-8 border-slate-200">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── In-Tab Invoice Preview & Direct Download Modal ─────────────────── */}
      {previewInvoice && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={e => { if (e.target === e.currentTarget) setPreviewInvoice(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg mx-auto overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col my-auto max-h-[92vh]">
            
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewInvoice(null)}
                  className="p-1 hover:bg-slate-200 rounded-md text-slate-500 transition-colors mr-1"
                  title="Back">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    {previewInvoice.type === "appointment" ? "Clinical Consultation Invoice" : "Pharmacy Dispensary Invoice"}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Ref: {previewInvoice.patient.name || "WALKIN-REF"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewInvoice(null)}
                className="w-7 h-7 rounded-md hover:bg-slate-200 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Stylized Document Paper Preview */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-100/60">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5 text-slate-800">
                {/* Hospital Header */}
                <div className="text-center pb-4 border-b border-slate-200">
                  <h2 className="text-lg font-black tracking-wider text-slate-900 font-sans">THANGAM HOSPITAL</h2>
                  <p className="text-[10px] text-slate-500 mt-0.5">123 Health City Road, Coimbatore - 641012</p>
                  <p className="text-[10px] text-slate-400">Phone: +91 422 2345678 | Email: billing@thangam.org</p>
                </div>

                {/* Invoice Type Badge */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold tracking-wide uppercase ${
                      previewInvoice.type === "appointment" 
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}>
                      {previewInvoice.type === "appointment" ? "Clinical Consultation Bill" : "Pharmacy Dispensation Bill"}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-mono">{new Date().toLocaleDateString("en-IN")}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>

                {/* Patient & Doctor Meta Grid */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg text-[11px] border border-slate-100">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Patient Name</span>
                    <span className="font-bold text-slate-900">{previewInvoice.patient.patient_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Mobile Number</span>
                    <span className="font-mono text-slate-700">{previewInvoice.patient.mobile_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Consulting Doctor</span>
                    <span className="text-slate-700 font-medium">{previewInvoice.patient.doctor || "General OPD"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Visit ID</span>
                    <span className="font-mono text-slate-700 font-bold">{previewInvoice.patient.name || "N/A"}</span>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                  <div className="grid grid-cols-12 bg-slate-50 p-2.5 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                    <div className="col-span-7">Item Description</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-3 text-right">Amount</div>
                  </div>

                  {previewInvoice.type === "appointment" ? (
                    <div className="grid grid-cols-12 p-3 items-center text-[11px] border-b border-slate-100">
                      <div className="col-span-7">
                        <p className="font-bold text-slate-800">Doctor OPD Consultation Fee</p>
                        <p className="text-[10px] text-slate-400">{previewInvoice.patient.doctor || "Assigned Physician"}</p>
                      </div>
                      <div className="col-span-2 text-center font-mono">1</div>
                      <div className="col-span-3 text-right font-mono font-bold text-slate-900">
                        ₹{Number(previewInvoice.fee || 500).toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-12 p-3 items-center text-[11px] border-b border-slate-100">
                      <div className="col-span-7">
                        <p className="font-bold text-slate-800">Prescription Medicines &amp; Dispensary</p>
                        <p className="text-[10px] text-slate-400 truncate">{previewInvoice.patient.prescription || "Standard Clinical Dispensary"}</p>
                      </div>
                      <div className="col-span-2 text-center font-mono">1</div>
                      <div className="col-span-3 text-right font-mono font-bold text-slate-900">
                        ₹{Number(previewInvoice.patient.pharmacy_bill_amount || previewInvoice.patient.bill_amount || 0).toFixed(2)}
                      </div>
                    </div>
                  )}

                  {/* Total row */}
                  <div className="grid grid-cols-12 p-3 bg-slate-50/80 items-center text-xs font-bold">
                    <div className="col-span-7 text-slate-700">Total Amount Payable:</div>
                    <div className="col-span-5 text-right font-mono text-slate-900 text-sm">
                      {previewInvoice.type === "appointment"
                        ? `₹${Number(previewInvoice.fee || 500).toFixed(2)}`
                        : `₹${Number(previewInvoice.patient.pharmacy_bill_amount || previewInvoice.patient.bill_amount || 0).toFixed(2)}`}
                    </div>
                  </div>
                </div>

                {/* Stamp & Verification */}
                <div className="flex items-center justify-between pt-2">
                  <div className={`px-3 py-1.5 rounded border text-[10px] font-bold uppercase tracking-wider ${
                    previewInvoice.type === "appointment"
                      ? "border-indigo-300 text-indigo-700 bg-indigo-50/50"
                      : "border-emerald-300 text-emerald-700 bg-emerald-50/50"
                  }`}>
                    {previewInvoice.type === "appointment" ? "CONSULTATION INVOICED" : "MEDICINES DISPENSED"}
                  </div>
                  <p className="text-[9px] text-slate-400 italic">
                    Digitally generated • Thangam Hospital Desk
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewInvoice(null)}
                className="text-xs h-9 border-slate-200">
                Back
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={isDownloadingPDF}
                onClick={async () => {
                  if (previewInvoice.type === "appointment") {
                    await downloadConsultationPDF(previewInvoice.patient, previewInvoice.fee || 500);
                  } else {
                    await downloadPharmacyPDF(previewInvoice.patient);
                  }
                }}
                className={`text-xs h-9 px-4 gap-2 font-semibold shadow-xs text-white ${
                  previewInvoice.type === "appointment"
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}>
                {isDownloadingPDF ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </>
                )}
              </Button>
            </div>

          </div>
        </div>
      )}
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
