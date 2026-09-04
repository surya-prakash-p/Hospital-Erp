"use client";

import { WALK_IN_ENABLED } from "@/lib/feature-flags";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import { 
  Users, 
  Search, 
  UserPlus, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Loader2, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Activity, 
  Thermometer, 
  Ruler, 
  Scale, 
  HeartPulse, 
  ClipboardList
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getPatients, createPatient, getDoctors, createWalkIn, getQueue } from "@/lib/hospital-service";

const EMPTY_PATIENT_FORM = {
  patient_name: "",
  mobile_number: "",
  age: "",
  gender: "Male",
  email: "",
  emergency_contact: "",
  allergies: "",
  medical_history: ""
};

const EMPTY_CHECKIN_FORM = {
  doctor: "",
  temperature: "",
  bp: "",
  pulse: "",
  resp_rate: "",
  spo2: "",
  height: "",
  weight: "",
  blood_group: "",
  symptoms: ""
};

export default function PatientRegistryPage() {
  const router = useRouter();
  const searchInputRef = useRef(null);
  
  const [patients, setPatients] = useState({});
  const [doctors, setDoctors] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  
  // Modals state
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Search/Filters state
  const [searchQuery, setSearchQuery] = useState("");

  // Forms state
  const [patientForm, setPatientForm] = useState({ ...EMPTY_PATIENT_FORM });
  const [checkinForm, setCheckinForm] = useState({ ...EMPTY_CHECKIN_FORM });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    loadRegistryData();
  }, []);

  useEffect(() => {
    if (!loading && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 50);
    }
  }, [loading]);

  async function loadRegistryData() {
    setLoading(true);
    try {
      const pts = await getPatients();
      setPatients(pts || {});
      const docs = await getDoctors();
      setDoctors(docs || []);
      const q = await getQueue();
      setQueue(q || []);
      
      const availableDocs = docs.filter(d => d.status !== "Unavailable");
      if (availableDocs.length > 0) {
        setCheckinForm(prev => ({ ...prev, doctor: availableDocs[0].name }));
      }
    } catch (e) {
      showToast("Error loading patient records", "error");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Handle new patient registration
  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    if (!patientForm.patient_name.trim() || !patientForm.mobile_number.trim() || !patientForm.age) {
      showToast("Name, Mobile, and Age are required", "error");
      return;
    }
    if (patientForm.mobile_number.length !== 10) {
      showToast("Enter a valid 10-digit mobile number", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const newPatient = {
        patient_name: patientForm.patient_name.trim(),
        mobile_number: patientForm.mobile_number.trim(),
        age: parseInt(patientForm.age),
        gender: patientForm.gender,
        email: patientForm.email.trim(),
        emergency_contact: patientForm.emergency_contact.trim(),
        allergies: patientForm.allergies.trim(),
        medical_history: patientForm.medical_history.trim(),
        creation: new Date().toISOString()
      };

      await createPatient(newPatient);
      showToast(`Patient ${newPatient.patient_name} registered successfully!`, "success");
      setIsRegModalOpen(false);
      setPatientForm({ ...EMPTY_PATIENT_FORM });
      await loadRegistryData();
    } catch (err) {
      showToast(err.message || "Failed to register patient", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger check-in dialog for a patient
  const handleOpenCheckin = (patient) => {
    if (!WALK_IN_ENABLED) return;
    setSelectedPatient(patient);
    setCheckinForm({ ...EMPTY_CHECKIN_FORM });
    const availableDocs = doctors.filter(d => d.status !== "Unavailable");
    if (availableDocs.length > 0) {
      setCheckinForm(prev => ({ ...prev, doctor: availableDocs[0].name }));
    }
    setIsCheckinModalOpen(true);
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

      showToast("Consultation invoice opened for printing!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to print invoice", "error");
    }
  };

  // Submit patient check-in / Walk-in queue booking
  const handleCheckinSubmit = async (e) => {
    e.preventDefault();
    if (!WALK_IN_ENABLED) return;
    if (!selectedPatient) return;
    if (!checkinForm.doctor) {
      showToast("Please select a consulting doctor", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const walkInData = {
        patient_name: selectedPatient.patient_name,
        mobile_number: selectedPatient.mobile_number,
        age: parseInt(selectedPatient.age),
        gender: selectedPatient.gender,
        doctor: checkinForm.doctor,
        appointment_status: "Doctor Consultation",
        
        // Vitals
        temperature: checkinForm.temperature.trim(),
        bp: checkinForm.bp.trim(),
        pulse: checkinForm.pulse.trim(),
        resp_rate: checkinForm.resp_rate.trim(),
        spo2: checkinForm.spo2.trim(),
        height: checkinForm.height.trim(),
        weight: checkinForm.weight.trim(),
        blood_group: checkinForm.blood_group,
        diagnosis: checkinForm.symptoms.trim() || "Consultation Checkup"
      };

      const created = await createWalkIn(walkInData);
      const DOCTOR_FEES = { "Dr. Rajesh": 500, "Dr. Priya": 1000, "Dr. Vignesh": 600 };
      const docFee = DOCTOR_FEES[checkinForm.doctor] || 500;
      printConsultationInvoice(created, docFee);

      showToast(`${selectedPatient.patient_name} successfully booked in to active queue!`, "success");
      setIsCheckinModalOpen(false);
      setSelectedPatient(null);
      router.push("/reception"); // Route to reception to see them in today's active visitors queue
    } catch (err) {
      showToast(err.message || "Booking in failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert patients map to array
  const patientsList = Object.values(patients).sort((a, b) => new Date(b.creation || 0) - new Date(a.creation || 0));

  // Filter patients by search query
  const filteredPatients = patientsList.filter(p => {
    const query = searchQuery.toLowerCase();
    return p.patient_name?.toLowerCase().includes(query) || 
           p.mobile_number?.includes(query) || 
           p.email?.toLowerCase().includes(query);
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Toast notifications container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
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

      {loading ? (
        <div className="flex flex-col gap-6 w-full animate-pulse mt-6">
          <div className="h-12 bg-slate-200/80 rounded-xl" />
          <div className="h-96 bg-slate-200/60 rounded-xl" />
        </div>
      ) : (
        <Card className="flex flex-col h-[650px]">
          <CardHeader className="bg-slate-50 border-b flex flex-col xl:flex-row xl:items-center justify-between gap-4 py-4 px-6 shrink-0">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                Registered Patients List
              </CardTitle>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
              <div className="relative min-w-0 flex-1 basis-full sm:basis-auto sm:min-w-[180px] xl:w-[280px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  ref={searchInputRef}
                  aria-label="Search patients"
                  placeholder="Search by name, mobile, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 h-9 text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <Button variant="outline" size="sm" onClick={loadRegistryData} className="gap-1 text-xs h-9 border-slate-200 shrink-0">
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </Button>
              <Button onClick={() => setIsRegModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 h-9 text-xs font-semibold shadow-sm shrink-0">
                <UserPlus className="w-4 h-4" />
                Register Patient
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-0 overflow-y-auto flex-1">
            <div className="min-w-full divide-y divide-slate-200">
              {/* Header */}
              <div className="bg-slate-50/70 grid grid-cols-12 px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider border-b">
                <div className="col-span-1">#</div>
                <div className="col-span-3">Patient Name</div>
                <div className="col-span-2 text-center">Age / Gender</div>
                <div className="col-span-2">Mobile Number</div>
                <div className="col-span-2">Medical History Brief</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              
              {/* Rows */}
              <div className="divide-y divide-slate-200 bg-white">
                {filteredPatients.map((p, index) => (
                  <div key={p.mobile_number || index} className="grid grid-cols-12 px-6 py-3.5 items-center text-xs hover:bg-slate-50/50 transition-colors">
                    <div className="col-span-1 text-slate-400 font-medium font-mono">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="col-span-3 flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-bold text-indigo-600 shrink-0">
                        {p.patient_name?.[0]?.toUpperCase() || "P"}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-900 block truncate">{p.patient_name}</span>
                        {p.email && <span className="text-[10px] text-slate-400 block truncate">{p.email}</span>}
                      </div>
                    </div>
                    <div className="col-span-2 text-center text-slate-600">
                      {p.age} Yrs | {p.gender}
                    </div>
                    <div className="col-span-2 text-slate-700 font-medium">{p.mobile_number}</div>
                    <div className="col-span-2 text-slate-500 truncate pr-3" title={p.medical_history}>
                      {p.medical_history || "No notes / checkup logs"}
                    </div>
                    <div className="col-span-2 text-right flex items-center justify-end gap-2">
                      <Button 
                        onClick={() => router.push(`/patient/${p.mobile_number}`)}
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] border-slate-200 hover:bg-slate-50 font-semibold"
                      >
                        Profile
                      </Button>
                      {WALK_IN_ENABLED && !queue.some(q => q.mobile_number === p.mobile_number && q.appointment_status !== "Completed") && (
                        <Button 
                          onClick={() => handleOpenCheckin(p)}
                          className="h-7 text-[10px] bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-1"
                        >
                          <ClipboardList className="w-3 h-3" />
                          Book in
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {filteredPatients.length === 0 && (
                  <div className="text-center text-muted-foreground py-20 text-xs">
                    No patients matching the criteria found.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Add Patient Modal ────────────────────────────────────────────── */}
      <Dialog open={isRegModalOpen} onOpenChange={setIsRegModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register Master Patient Account</DialogTitle>
            <DialogDescription>Create a master demographic clinical record in the registry database.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegisterPatient} className="space-y-5 pt-3">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-1">
                <Label htmlFor="reg-name" className="text-xs font-semibold block mb-1.5">Full Name *</Label>
                <Input 
                  id="reg-name" 
                  placeholder="e.g. Rahul Sharma"
                  value={patientForm.patient_name}
                  onChange={(e) => setPatientForm(prev => ({ ...prev, patient_name: e.target.value }))}
                  required 
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-mobile" className="text-xs font-semibold block mb-1.5">Mobile Number (10 Digits) *</Label>
                <Input 
                  id="reg-mobile" 
                  placeholder="e.g. 9876543210"
                  maxLength={10}
                  value={patientForm.mobile_number}
                  onChange={(e) => setPatientForm(prev => ({ ...prev, mobile_number: e.target.value.replace(/\D/g, "") }))}
                  required 
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-age" className="text-xs font-semibold block mb-1.5">Age (Years) *</Label>
                <Input 
                  id="reg-age" 
                  type="number"
                  placeholder="e.g. 34"
                  min="0"
                  max="130"
                  value={patientForm.age}
                  onChange={(e) => setPatientForm(prev => ({ ...prev, age: e.target.value }))}
                  required 
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-gender" className="text-xs font-semibold block mb-1.5">Gender *</Label>
                <select 
                  id="reg-gender"
                  value={patientForm.gender}
                  onChange={(e) => setPatientForm(prev => ({ ...prev, gender: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-email" className="text-xs font-semibold block mb-1.5">Email Address</Label>
                <Input 
                  id="reg-email" 
                  type="email"
                  placeholder="e.g. rahul@example.com"
                  value={patientForm.email}
                  onChange={(e) => setPatientForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-emergency" className="text-xs font-semibold block mb-1.5">Emergency Contact Number</Label>
                <Input 
                  id="reg-emergency" 
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  value={patientForm.emergency_contact}
                  onChange={(e) => setPatientForm(prev => ({ ...prev, emergency_contact: e.target.value.replace(/\D/g, "") }))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="reg-history" className="text-xs font-semibold block mb-1.5">Known Allergies / Brief Medical History</Label>
              <textarea 
                id="reg-history" 
                placeholder="e.g. Hypertension, Penicillin allergy, diabetic since 2021"
                rows="2"
                value={patientForm.medical_history}
                onChange={(e) => setPatientForm(prev => ({ ...prev, medical_history: e.target.value }))}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setIsRegModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                {isSubmitting ? <><Loader2 className="w-3 h-3 animate-spin mr-1"/>Registering...</> : "Register Patient"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Active Check-in Modal ─────────────────────────────────────────── */}
      <Dialog open={WALK_IN_ENABLED && isCheckinModalOpen} onOpenChange={setIsCheckinModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Walk-in Book in</DialogTitle>
            <DialogDescription>
              Book in **{selectedPatient?.patient_name}** ({selectedPatient?.mobile_number}) into today's active queues.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCheckinSubmit} className="space-y-5 pt-3">
            {/* Consulting Doctor */}
            <div className="space-y-1">
              <Label htmlFor="checkin-doctor" className="text-xs font-semibold block mb-1.5">Assign Consulting Doctor *</Label>
              <select 
                id="checkin-doctor"
                value={checkinForm.doctor}
                onChange={(e) => setCheckinForm(prev => ({ ...prev, doctor: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                {doctors.filter(d => d.status !== "Unavailable").map(doc => (
                  <option key={doc.name} value={doc.name}>{doc.name} ({doc.specialization || "Consultant"})</option>
                ))}
              </select>
            </div>

            {/* Vitals Form */}
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3 border-b pb-1">Vitals Info (Optional)</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="checkin-temp" className="text-xs font-semibold block mb-1.5 flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-slate-400" /> Temperature (°F)
                  </Label>
                  <Input 
                    id="checkin-temp" 
                    placeholder="e.g. 98.6"
                    value={checkinForm.temperature}
                    onChange={(e) => setCheckinForm(prev => ({ ...prev, temperature: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="checkin-bp" className="text-xs font-semibold block mb-1.5 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-slate-400" /> Blood Pressure
                  </Label>
                  <Input 
                    id="checkin-bp" 
                    placeholder="e.g. 120/80"
                    value={checkinForm.bp}
                    onChange={(e) => setCheckinForm(prev => ({ ...prev, bp: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="checkin-pulse" className="text-xs font-semibold block mb-1.5 flex items-center gap-1">
                    <HeartPulse className="w-3 h-3 text-slate-400" /> Pulse (bpm)
                  </Label>
                  <Input 
                    id="checkin-pulse" 
                    placeholder="e.g. 72"
                    value={checkinForm.pulse}
                    onChange={(e) => setCheckinForm(prev => ({ ...prev, pulse: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="checkin-resp" className="text-xs font-semibold block mb-1.5">Resp. Rate (/min)</Label>
                  <Input 
                    id="checkin-resp" 
                    placeholder="e.g. 16"
                    value={checkinForm.resp_rate}
                    onChange={(e) => setCheckinForm(prev => ({ ...prev, resp_rate: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="checkin-spo2" className="text-xs font-semibold block mb-1.5">SpO2 (%)</Label>
                  <Input 
                    id="checkin-spo2" 
                    placeholder="e.g. 98"
                    value={checkinForm.spo2}
                    onChange={(e) => setCheckinForm(prev => ({ ...prev, spo2: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="checkin-blood" className="text-xs font-semibold block mb-1.5">Blood Group</Label>
                  <select 
                    id="checkin-blood"
                    value={checkinForm.blood_group}
                    onChange={(e) => setCheckinForm(prev => ({ ...prev, blood_group: e.target.value }))}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Unknown</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="checkin-height" className="text-xs font-semibold block mb-1.5 flex items-center gap-1">
                    <Ruler className="w-3 h-3 text-slate-400" /> Height (cm)
                  </Label>
                  <Input 
                    id="checkin-height" 
                    placeholder="e.g. 172"
                    value={checkinForm.height}
                    onChange={(e) => setCheckinForm(prev => ({ ...prev, height: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="checkin-weight" className="text-xs font-semibold block mb-1.5 flex items-center gap-1">
                    <Scale className="w-3 h-3 text-slate-400" /> Weight (kg)
                  </Label>
                  <Input 
                    id="checkin-weight" 
                    placeholder="e.g. 68"
                    value={checkinForm.weight}
                    onChange={(e) => setCheckinForm(prev => ({ ...prev, weight: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Symptoms */}
            <div className="space-y-1">
              <Label htmlFor="checkin-symptoms" className="text-xs font-semibold block mb-1.5">Symptoms / Visit Reason</Label>
              <textarea 
                id="checkin-symptoms" 
                placeholder="e.g. Fever, persistent cough for 2 days, general weakness..."
                rows="2"
                value={checkinForm.symptoms}
                onChange={(e) => setCheckinForm(prev => ({ ...prev, symptoms: e.target.value }))}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setIsCheckinModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-slate-900 hover:bg-slate-800 text-white font-semibold">
                {isSubmitting ? <><Loader2 className="w-3 h-3 animate-spin mr-1"/>Booking in...</> : "Complete Book in"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
