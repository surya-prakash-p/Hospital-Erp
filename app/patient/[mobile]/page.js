"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, User, Phone, Mail, Droplet, Ruler, Scale, Calendar, Edit2, 
  Check, RefreshCw, UserRound, BookOpen, Heart, Activity, CheckCircle, 
  AlertCircle, Info, Thermometer, HeartPulse, Wind, ShieldAlert, PlusCircle, 
  FileText, Receipt, File, History, StickyNote, Printer, Download, Share2, ArrowRight, Pill, FlaskConical
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getPatient, updatePatient, getDoctors, createWalkIn, getQueue } from "@/lib/hospital-service";

export default function PatientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const mobile = params.mobile;

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [activeTab, setActiveTab] = useState("Overview");

  const [showBookModal, setShowBookModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [doctorsList, setDoctorsList] = useState([]);
  const [downloadedReports, setDownloadedReports] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  
  const [patientWalkins, setPatientWalkins] = useState([]);
  const [nextAppointment, setNextAppointment] = useState(null);

  // Edit fields matching all vital and contact parameters
  const [editState, setEditState] = useState({
    patient_name: "", age: "", gender: "Male", email: "", height: "", weight: "",
    blood_group: "", temperature: "", bp: "", pulse: "", resp_rate: "", spo2: "",
    allergies: "", emergency_contact: "", medical_history: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  async function loadPatientDetails() {
    setLoading(true);
    try {
      const p = await getPatient(mobile);
      if (p) {
        setPatient(p);
        setEditState({
          patient_name: p.patient_name || "", age: p.age ? String(p.age) : "",
          gender: p.gender || "Male", email: p.email || "", height: p.height || "",
          weight: p.weight || "", blood_group: p.blood_group || "", temperature: p.temperature || "",
          bp: p.bp || "", pulse: p.pulse || "", resp_rate: p.resp_rate || "", spo2: p.spo2 || "",
          allergies: p.allergies || "", emergency_contact: p.emergency_contact || "", medical_history: p.medical_history || ""
        });
      } else {
        showToast("Patient record not found", "error");
      }
      
      const allDocs = await getDoctors();
      setDoctorsList(allDocs);
      const availableDocs = allDocs.filter(d => d.status !== "Unavailable");
      if (availableDocs.length > 0) setSelectedDoctor(availableDocs[0].name);

      const q = await getQueue();
      const myWalkins = q.filter(w => w.mobile_number === mobile).sort((a, b) => new Date(b.creation || 0) - new Date(a.creation || 0));
      setPatientWalkins(myWalkins);
      
      const latestWalkin = myWalkins.find(w => w.next_checkup_date);
      if (latestWalkin && latestWalkin.next_checkup_date) {
        setNextAppointment(latestWalkin.next_checkup_date);
      }

    } catch (err) {
      console.error(err);
      showToast("Error loading patient data", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (mobile) {
      loadPatientDetails();
    }
  }, [mobile]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editState.patient_name) {
      showToast("Patient Name is required", "error");
      return;
    }
    setIsSaving(true);
    try {
      const updated = await updatePatient(mobile, {
        patient_name: editState.patient_name, age: editState.age ? parseInt(editState.age) : null,
        gender: editState.gender, email: editState.email, height: editState.height, weight: editState.weight,
        blood_group: editState.blood_group, temperature: editState.temperature, bp: editState.bp,
        pulse: editState.pulse, resp_rate: editState.resp_rate, spo2: editState.spo2,
        allergies: editState.allergies, emergency_contact: editState.emergency_contact, medical_history: editState.medical_history
      });
      setPatient(updated);
      setIsEditing(false);
      showToast("Patient profile updated successfully!", "success");
    } catch (err) {
      showToast(err.message || "Failed to update profile", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBookWalkIn = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) {
      showToast("Please select a doctor", "error");
      return;
    }
    setIsBooking(true);
    try {
      await createWalkIn({
        patient_name: patient.patient_name, mobile_number: patient.mobile_number,
        is_existing: 1, doctor: selectedDoctor, appointment_status: "Doctor Consultation"
      });
      showToast("Walk-in booked successfully!", "success");
      setShowBookModal(false);
    } catch (err) {
      showToast(err.message || "Failed to book walk-in", "error");
    } finally {
      setIsBooking(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleQuickAction = (action) => {
    if (action === "Report") {
      const latestW = patientWalkins?.[0] || {};
      setDownloadedReports(prev => [...prev, {
        id: Date.now(),
        type: 'invoice',
        name: `Invoice_${patient.patient_name}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.pdf`,
        date: new Date().toLocaleDateString('en-GB'),
        walkinData: {
          doctor: latestW.doctor || "",
          lab_test_name: latestW.lab_test_name || "",
          need_lab_test: latestW.need_lab_test || 0,
          pharmacy_bill_amount: latestW.pharmacy_bill_amount || 0,
          dispensed_medicines: latestW.dispensed_medicines || []
        }
      }]);
      showToast(`Invoice generated and saved to Documents tab!`, "success");
    } else {
      showToast(`${action} prepared successfully!`, "success");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto animate-pulse p-6">
        <div className="h-14 w-full bg-slate-200/80 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 h-[600px] bg-slate-200/80 rounded-xl" />
          <div className="lg:col-span-3 h-[600px] bg-slate-200/80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <AlertCircle className="w-10 h-10 mx-auto text-rose-300 mb-2" />
        <p>No patient record found for mobile: {mobile}</p>
        <Button onClick={() => router.push('/reception')} variant="outline" className="mt-4 gap-1">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </Button>
      </div>
    );
  }

  // Derive mock data for UI completeness matching the image
  const patientId = patient.name || "PT001256";
  const registeredDate = patient.creation ? new Date(patient.creation).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "Unknown";
  
  const totalVisits = patientWalkins.length > 0 ? patientWalkins.length : 1;
  const lastVisitData = patientWalkins.length > 0 ? patientWalkins[0] : patient;
  const lastVisitDate = lastVisitData.creation ? new Date(lastVisitData.creation).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : registeredDate;
  const primaryDoctor = lastVisitData.doctor || "Assigned to walk-in";
  const patientSince = patient.creation ? new Date(patient.creation).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : registeredDate;
  
  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((t) => (
          <div key={t.id} className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg shadow-lg border text-xs font-semibold animate-in slide-in-from-top-2 duration-200 ${t.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : ""} ${t.type === "error" ? "bg-rose-50 text-rose-800 border-rose-200" : ""} ${t.type === "info" ? "bg-indigo-50 text-indigo-800 border-indigo-200" : ""}`}>
            {t.type === "success" && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
            {t.type === "error" && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
            {t.type === "info" && <Info className="w-4 h-4 text-indigo-500 shrink-0" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
        <Button variant="ghost" onClick={() => router.push('/reception')} className="gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm">
          <ArrowLeft className="w-4 h-4" /> Reception Desk
        </Button>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadPatientDetails} className="h-9 gap-1.5 text-xs font-semibold border-slate-200">
            <RefreshCw className="w-3.5 h-3.5" /> Reload
          </Button>
          {!isEditing && (
            <>
              <Button onClick={() => setShowBookModal(true)} className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 h-9 text-xs font-semibold shadow-sm">
                <PlusCircle className="w-3.5 h-3.5" /> Book Walk-In
              </Button>
              <Button onClick={() => setIsEditing(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 h-9 text-xs font-semibold shadow-sm">
                <Edit2 className="w-3.5 h-3.5" /> Edit Profile
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 max-w-[1500px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sidebar */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <div className="p-6 flex flex-col items-center border-b border-slate-100">
              <div className="w-24 h-24 rounded-full bg-indigo-600 text-white flex items-center justify-center text-4xl font-bold shadow-md mb-4">
                {patient.patient_name?.[0]?.toUpperCase() || "P"}
              </div>
              <h2 className="text-xl font-bold text-slate-900 font-serif text-center">{patient.patient_name}</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">Patient ID: {patientId}</p>
              <div className="mt-3 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                Active Patient
              </div>
            </div>
            
            <div className="p-6 space-y-5 text-sm">
              <div className="flex items-center gap-3">
                <UserRound className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Age</p>
                  <p className="font-semibold text-slate-800">{patient.age ? `${patient.age} Years` : "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Gender</p>
                  <p className="font-semibold text-slate-800">{patient.gender}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Phone</p>
                  <p className="font-semibold text-slate-800">{patient.mobile_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Email</p>
                  <p className="font-semibold text-slate-800">{patient.email || "Not Provided"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Droplet className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Blood Group</p>
                  <p className="font-semibold text-slate-800">{patient.blood_group || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Registered On</p>
                  <p className="font-semibold text-slate-800">{registeredDate}</p>
                </div>
              </div>

              {/* Next Check-up Date Display */}
              <div className="flex items-center gap-3 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <p className="text-[10px] text-indigo-600 uppercase font-bold tracking-wider">Next Check-up Date</p>
                  <p className="font-bold text-indigo-900 text-sm">{nextAppointment ? nextAppointment : "Not Scheduled"}</p>
                </div>
              </div>
              {/* View Full Profile removed as per request */}
            </div>
          </Card>

          {/* Emergency Contact Card removed as requested */}
        </div>

        {/* Right Main Content */}
        <div className="lg:col-span-9 space-y-6">
          {isEditing ? (
            // Editor Form
            <Card className="border-t-4 border-t-indigo-600 shadow-lg rounded-xl">
               <CardHeader className="bg-slate-50 border-b">
                 <CardTitle className="text-lg flex items-center gap-2">
                   <UserRound className="w-5 h-5 text-indigo-500" />
                   Edit Patient Profile
                 </CardTitle>
                 <CardDescription>Update name, vitals, allergies, contact numbers, and clinical metrics.</CardDescription>
               </CardHeader>
               <CardContent className="pt-6">
                 <form onSubmit={handleUpdate} className="space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     <div className="space-y-1">
                       <Label htmlFor="edit-name" className="text-xs font-semibold">Patient Name *</Label>
                       <Input id="edit-name" value={editState.patient_name} onChange={(e) => setEditState({ ...editState, patient_name: e.target.value })} required className="h-9 text-xs"/>
                     </div>
                     <div className="space-y-1">
                       <Label htmlFor="edit-email" className="text-xs font-semibold">Email Address</Label>
                       <Input id="edit-email" type="email" value={editState.email} onChange={(e) => setEditState({ ...editState, email: e.target.value })} className="h-9 text-xs"/>
                     </div>
                     <div className="space-y-1">
                       <Label htmlFor="edit-age" className="text-xs font-semibold">Age</Label>
                       <Input id="edit-age" type="number" value={editState.age} onChange={(e) => setEditState({ ...editState, age: e.target.value })} className="h-9 text-xs"/>
                     </div>
                     <div className="space-y-1">
                       <Label htmlFor="edit-gender" className="text-xs font-semibold">Gender</Label>
                       <Select value={editState.gender} onValueChange={(val) => setEditState({ ...editState, gender: val })}>
                         <SelectTrigger id="edit-gender" className="h-9 text-xs"><SelectValue placeholder="Select gender" /></SelectTrigger>
                         <SelectContent>
                           <SelectItem value="Male">Male</SelectItem>
                           <SelectItem value="Female">Female</SelectItem>
                           <SelectItem value="Other">Other</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="space-y-1">
                       <Label htmlFor="edit-height" className="text-xs font-semibold">Height</Label>
                       <Input id="edit-height" placeholder="e.g. 175 cm" value={editState.height} onChange={(e) => setEditState({ ...editState, height: e.target.value })} className="h-9 text-xs"/>
                     </div>
                     <div className="space-y-1">
                       <Label htmlFor="edit-weight" className="text-xs font-semibold">Weight</Label>
                       <Input id="edit-weight" placeholder="e.g. 72 kg" value={editState.weight} onChange={(e) => setEditState({ ...editState, weight: e.target.value })} className="h-9 text-xs"/>
                     </div>
                     <div className="space-y-1">
                       <Label htmlFor="edit-blood" className="text-xs font-semibold">Blood Group</Label>
                       <Select value={editState.blood_group} onValueChange={(val) => setEditState({ ...editState, blood_group: val })}>
                         <SelectTrigger id="edit-blood" className="h-9 text-xs"><SelectValue placeholder="Select blood group" /></SelectTrigger>
                         <SelectContent>
                           {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="space-y-1">
                       <Label htmlFor="edit-temp" className="text-xs font-semibold">Temperature (°F)</Label>
                       <Input id="edit-temp" placeholder="e.g. 98.6" value={editState.temperature} onChange={(e) => setEditState({ ...editState, temperature: e.target.value })} className="h-9 text-xs"/>
                     </div>
                     <div className="space-y-1">
                       <Label htmlFor="edit-bp" className="text-xs font-semibold">Blood Pressure</Label>
                       <Input id="edit-bp" placeholder="e.g. 120/80" value={editState.bp} onChange={(e) => setEditState({ ...editState, bp: e.target.value })} className="h-9 text-xs"/>
                     </div>
                     <div className="space-y-1">
                       <Label htmlFor="edit-pulse" className="text-xs font-semibold">Pulse Rate</Label>
                       <Input id="edit-pulse" placeholder="e.g. 72" value={editState.pulse} onChange={(e) => setEditState({ ...editState, pulse: e.target.value })} className="h-9 text-xs"/>
                     </div>
                     <div className="space-y-1">
                       <Label htmlFor="edit-resprate" className="text-xs font-semibold">Respiratory Rate</Label>
                       <Input id="edit-resprate" placeholder="e.g. 16" value={editState.resp_rate} onChange={(e) => setEditState({ ...editState, resp_rate: e.target.value })} className="h-9 text-xs"/>
                     </div>
                     <div className="space-y-1">
                       <Label htmlFor="edit-spo2" className="text-xs font-semibold">SpO2 (%)</Label>
                       <Input id="edit-spo2" placeholder="e.g. 98" value={editState.spo2} onChange={(e) => setEditState({ ...editState, spo2: e.target.value })} className="h-9 text-xs"/>
                     </div>
                     <div className="space-y-1">
                       <Label htmlFor="edit-allergies" className="text-xs font-semibold">Known Allergies</Label>
                       <Input id="edit-allergies" placeholder="e.g. Penicillin, Dust" value={editState.allergies} onChange={(e) => setEditState({ ...editState, allergies: e.target.value })} className="h-9 text-xs"/>
                     </div>
                     <div className="space-y-1">
                       <Label htmlFor="edit-emerg" className="text-xs font-semibold">Emergency Contact No.</Label>
                       <Input id="edit-emerg" placeholder="e.g. 9876543200" value={editState.emergency_contact || ""} maxLength={10} onChange={(e) => setEditState({ ...editState, emergency_contact: e.target.value.replace(/\D/g, "") })} className="h-9 text-xs"/>
                     </div>
                   </div>
   
                   <div className="space-y-1">
                     <Label htmlFor="edit-history" className="text-xs font-semibold">Additional Medical History Notes</Label>
                     <textarea id="edit-history" className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-950" value={editState.medical_history} onChange={(e) => setEditState({ ...editState, medical_history: e.target.value })} />
                   </div>
   
                   <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                     <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="h-9 text-xs">Cancel</Button>
                     <Button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-xs font-semibold">Save Profile</Button>
                   </div>
                 </form>
               </CardContent>
             </Card>
          ) : (
            <>
              {/* Dark Blue Top Banner */}
              <div className="bg-[#242b5c] rounded-xl p-6 text-white grid grid-cols-2 md:grid-cols-4 gap-6 items-center shadow-md relative overflow-hidden">
                {/* Decorative background circles */}
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute right-40 -bottom-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                    <Calendar className="w-4 h-4 text-indigo-300" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-300 uppercase font-semibold tracking-wider">Last Visit</p>
                    <p className="text-sm font-bold mt-0.5">{lastVisitDate}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                    <UserRound className="w-4 h-4 text-indigo-300" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-300 uppercase font-semibold tracking-wider">Primary Doctor</p>
                    <p className="text-sm font-bold mt-0.5">{primaryDoctor}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                    <Activity className="w-4 h-4 text-indigo-300" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-300 uppercase font-semibold tracking-wider">Total Visits</p>
                    <p className="text-sm font-bold mt-0.5">{totalVisits}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                    <Heart className="w-4 h-4 text-indigo-300" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-300 uppercase font-semibold tracking-wider">Patient Since</p>
                    <p className="text-sm font-bold mt-0.5">{patientSince}</p>
                  </div>
                </div>
              </div>

              {/* Vitals Grid (8 Items) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="shadow-sm border-slate-200">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                      <Droplet className="w-5 h-5 fill-rose-500 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Blood Group</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{patient.blood_group || "N/A"}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                      <Ruler className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Height</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{patient.height || "N/A"}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Weight</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{patient.weight || "N/A"}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                      <Thermometer className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Temperature</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{patient.temperature ? `${patient.temperature}°F` : "N/A"}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                      <HeartPulse className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Pulse Rate</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{patient.pulse ? `${patient.pulse} bpm` : "N/A"}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                      <Wind className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Respiratory Rate</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{patient.resp_rate || "N/A"}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
                      <Wind className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Oxygen (SpO2)</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{patient.spo2 ? `${patient.spo2}%` : "N/A"}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Allergies</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{patient.allergies || "None"}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200 col-span-2 md:col-span-4 hidden lg:block">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                      <StickyNote className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Notes</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">None</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs Navigation */}
              <div className="flex gap-6 border-b border-slate-200 px-1 overflow-x-auto">
                {[
                  { id: 'Overview', icon: BookOpen },
                  { id: 'Medical History', icon: UserRound },
                  { id: 'Prescriptions', icon: Pill },
                  { id: 'Lab Results', icon: FlaskConical },
                  { id: 'Documents', icon: FileText },
                  { id: 'Billing', icon: Receipt },
                  { id: 'Notes', icon: StickyNote }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-sm font-semibold transition-colors whitespace-nowrap ${
                      activeTab === tab.id 
                        ? 'border-indigo-600 text-indigo-700' 
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.id}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === "Overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Timeline */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="border-slate-200 shadow-sm rounded-xl">
                      <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                            <BookOpen className="w-4 h-4 text-indigo-500" />
                            Medical History & Walk-In Logs
                          </CardTitle>
                          <CardDescription className="text-xs">Timeline of consultations, diagnoses, prescriptions, and lab tests.</CardDescription>
                        </div>
                        <Select defaultValue="all">
                          <SelectTrigger className="w-32 h-8 text-xs font-semibold">
                            <SelectValue placeholder="All Visits" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Visits</SelectItem>
                            <SelectItem value="recent">Recent</SelectItem>
                          </SelectContent>
                        </Select>
                      </CardHeader>
                      <CardContent className="pt-6">
                        {patientWalkins.length > 0 ? (
                          <div className="relative pl-6 border-l-2 border-slate-200 space-y-8">
                            {patientWalkins.map((w, idx) => (
                              <div key={idx} className="relative">
                                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white shadow-sm" />
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                                  <div className="flex justify-between items-center mb-4">
                                    <div className="flex gap-4 items-center text-xs font-bold text-slate-600">
                                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> {w.creation ? new Date(w.creation).toLocaleDateString('en-GB') : registeredDate}</span>
                                      <span className="text-slate-300">|</span>
                                      <span>{w.doctor}</span>
                                    </div>
                                    <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-md">
                                      <CheckCircle className="w-3.5 h-3.5" /> {w.appointment_status || "Completed"}
                                    </span>
                                  </div>
                                  <div className="space-y-2 text-sm text-slate-700 font-sans leading-relaxed">
                                    {w.diagnosis && <p><strong>Diagnosis:</strong> {w.diagnosis}</p>}
                                    {w.prescription && <p><strong>Prescription:</strong> {w.prescription}</p>}
                                    {w.lab_result && <p><strong>Lab Result:</strong> {w.lab_result}</p>}
                                    {w.next_checkup_date && (
                                      <div className="mt-2 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 p-2 rounded-lg flex items-center justify-between">
                                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-indigo-600" /> Next Check-up Date:</span>
                                        <span className="font-extrabold">{w.next_checkup_date}</span>
                                      </div>
                                    )}
                                    {(!w.diagnosis && !w.prescription && !w.lab_result && !w.next_checkup_date) && <p className="italic text-slate-500">Consultation details pending or not provided.</p>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-10 text-muted-foreground text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            No active diagnosis history recorded. Check-in walk-in records will automatically sync here upon checkout.
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Table View of Walk-In History with Next Walkin Date Column */}
                    {patientWalkins.length > 0 && (
                      <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
                        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50">
                          <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                            <Calendar className="w-4 h-4 text-indigo-500" />
                            Walk-In Appointments & Next Checkup Dates
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100/70 text-slate-700 font-bold uppercase tracking-wider border-b">
                              <tr>
                                <th className="px-4 py-2.5">Visit Date</th>
                                <th className="px-4 py-2.5">Doctor</th>
                                <th className="px-4 py-2.5">Diagnosis</th>
                                <th className="px-4 py-2.5 text-indigo-700 bg-indigo-50/50">Next Check-up Date</th>
                                <th className="px-4 py-2.5">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {patientWalkins.map((w, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                  <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                                    {w.creation ? new Date(w.creation).toLocaleDateString('en-GB') : registeredDate}
                                  </td>
                                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{w.doctor}</td>
                                  <td className="px-4 py-3 text-slate-600 max-w-[150px] truncate">{w.diagnosis || "Checkup"}</td>
                                  <td className="px-4 py-3 font-bold text-indigo-700 bg-indigo-50/30 whitespace-nowrap">
                                    {w.next_checkup_date ? w.next_checkup_date : "Not Allocated"}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                                      {w.appointment_status || "Completed"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Right Column: Widgets */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* Upcoming Appointments */}
                    <Card className="border-slate-200 shadow-sm rounded-xl">
                      <CardHeader className="pb-3 border-b border-slate-100">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                          <Calendar className="w-4 h-4 text-indigo-500" />
                          Upcoming Appointments
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6 text-center space-y-3">
                        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-300">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          {nextAppointment ? (
                            <>
                              <p className="text-sm font-bold text-slate-800">{new Date(nextAppointment).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                              <p className="text-xs text-slate-500 mt-1">Scheduled checkup.</p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-bold text-slate-800">No upcoming appointments</p>
                              <p className="text-xs text-slate-500 mt-1">Book an appointment to see it here.</p>
                            </>
                          )}
                        </div>
                        <Button variant="outline" onClick={() => setShowBookModal(true)} className="text-indigo-600 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 h-8 text-xs font-semibold w-full mt-2">
                          <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Book Appointment
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Allergies & Conditions */}
                    <Card className="border-slate-200 shadow-sm rounded-xl">
                      <CardHeader className="pb-3 border-b border-slate-100">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                          <ShieldAlert className="w-4 h-4 text-rose-500" />
                          Allergies & Conditions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6 text-center space-y-2">
                        {patient.allergies ? (
                          <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 text-sm text-rose-700 font-semibold text-left">
                            {patient.allergies}
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-center gap-1.5 text-emerald-600 text-sm font-bold">
                              <CheckCircle className="w-4 h-4" /> No known allergies
                            </div>
                            <p className="text-xs text-slate-500">Patient has no known allergies.</p>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="border-slate-200 shadow-sm rounded-xl">
                      <CardHeader className="pb-3 border-b border-slate-100">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                          <Activity className="w-4 h-4 text-blue-500" />
                          Quick Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6 grid grid-cols-2 gap-3">
                        <button onClick={handlePrint} className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-colors gap-2 text-blue-600">
                          <Printer className="w-5 h-5" />
                          <span className="text-[9px] font-bold uppercase text-slate-600">Print Summary</span>
                        </button>
                        <button onClick={() => handleQuickAction("Report")} className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 transition-colors gap-2 text-emerald-600">
                          <Download className="w-5 h-5" />
                          <span className="text-[9px] font-bold uppercase text-slate-600 text-center">Download Report</span>
                        </button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === "Prescriptions" && (
                 <Card className="border-slate-200 shadow-sm rounded-xl p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2"><Pill className="w-5 h-5 text-indigo-500" /> Prescription History</h3>
                    {patientWalkins.filter(w => w.prescription).length > 0 ? (
                       <div className="space-y-4">
                          {patientWalkins.filter(w => w.prescription).map((w, i) => (
                             <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <p className="text-xs text-slate-500 mb-1">{w.creation ? new Date(w.creation).toLocaleDateString('en-GB') : registeredDate} - Dr. {w.doctor}</p>
                                <p className="text-sm font-semibold text-slate-700 whitespace-pre-wrap">{w.prescription}</p>
                             </div>
                          ))}
                       </div>
                    ) : <p className="text-sm text-slate-500 italic">No prescriptions found.</p>}
                 </Card>
              )}

              {activeTab === "Lab Results" && (
                 <Card className="border-slate-200 shadow-sm rounded-xl p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2"><FlaskConical className="w-5 h-5 text-indigo-500" /> Lab Results</h3>
                    {patientWalkins.filter(w => w.need_lab_test || w.lab_result).length > 0 ? (
                       <div className="space-y-4">
                          {patientWalkins.filter(w => w.need_lab_test || w.lab_result).map((w, i) => (
                             <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                                <div>
                                   <p className="text-xs text-slate-500 mb-1">{w.creation ? new Date(w.creation).toLocaleDateString('en-GB') : registeredDate}</p>
                                   <p className="text-sm font-semibold text-slate-700">{w.lab_test_name || "General Lab Test"}</p>
                                   {w.lab_result && <p className="text-sm text-slate-600 mt-1">Result: <span className="font-medium text-slate-800">{w.lab_result}</span></p>}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${w.lab_test_status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{w.lab_test_status || "Pending"}</span>
                                  {w.lab_test_image && (
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <img src={w.lab_test_image} alt="Lab Result" className="w-16 h-12 object-cover rounded border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity" />
                                      </DialogTrigger>
                                      <DialogContent className="max-w-4xl p-1 bg-white/5 border-none shadow-none">
                                        <DialogTitle className="sr-only">Lab Result Image</DialogTitle>
                                        <img src={w.lab_test_image} alt="Full Size Lab Test" className="w-full h-auto max-h-[85vh] object-contain rounded-lg" />
                                      </DialogContent>
                                    </Dialog>
                                  )}
                                </div>
                             </div>
                          ))}
                       </div>
                    ) : <p className="text-sm text-slate-500 italic">No lab results found.</p>}
                 </Card>
              )}

              {activeTab === "Billing" && (
                 <Card className="border-slate-200 shadow-sm rounded-xl p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2"><Receipt className="w-5 h-5 text-indigo-500" /> Billing History</h3>
                    {patientWalkins.filter(w => w.bill_amount > 0).length > 0 ? (
                       <div className="space-y-4">
                          {patientWalkins.filter(w => w.bill_amount > 0).map((w, i) => (
                             <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                                <div>
                                   <p className="text-xs text-slate-500 mb-1">{w.creation ? new Date(w.creation).toLocaleDateString('en-GB') : registeredDate}</p>
                                   <p className="text-sm font-semibold text-slate-700">Consultation & Services</p>
                                </div>
                                <div className="text-right">
                                   <p className="text-sm font-bold text-slate-800">₹{w.bill_amount}</p>
                                   <p className={`text-[10px] uppercase font-bold tracking-wider mt-1 ${w.payment_received ? "text-emerald-600" : "text-amber-500"}`}>{w.payment_received ? "Paid" : "Unpaid"}</p>
                                </div>
                             </div>
                          ))}
                       </div>
                    ) : <p className="text-sm text-slate-500 italic">No billing records found.</p>}
                 </Card>
              )}

              {activeTab === "Medical History" && (
                 <Card className="border-slate-200 shadow-sm rounded-xl p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2"><UserRound className="w-5 h-5 text-indigo-500" /> Additional Medical History</h3>
                    {patient.medical_history ? (
                       <pre className="text-sm text-slate-700 font-sans whitespace-pre-wrap leading-relaxed p-4 bg-slate-50 border border-slate-100 rounded-lg">
                          {patient.medical_history}
                       </pre>
                    ) : <p className="text-sm text-slate-500 italic">No additional medical history provided. Click 'Edit Profile' to add notes.</p>}
                 </Card>
              )}

              {activeTab === "Documents" && (
                <div className="py-10 text-center">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Patient Documents</h3>
                  </div>
                  {downloadedReports.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                      {downloadedReports.map(doc => (
                        <div key={doc.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-md">
                              <Download className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-700 truncate w-48">{doc.name}</p>
                              <p className="text-xs text-slate-500">{doc.date}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => {
                            if (doc.type === 'invoice') {
                              setActiveInvoice(doc);
                              setShowInvoiceModal(true);
                            } else {
                              window.open('#', '_blank');
                            }
                          }} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">View</Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 border border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center">
                      <p className="text-sm font-semibold text-slate-500">No documents found.</p>
                      <p className="text-xs mt-1 text-slate-400">Click Download Report in Quick Actions to generate one.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "Notes" && (
                <div className="py-20 text-center text-slate-500 bg-white border border-dashed border-slate-300 rounded-xl">
                  <p className="text-sm font-semibold">Notes data will appear here.</p>
                  <p className="text-xs mt-1">This module is currently being synced with the backend.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Book Walk-in Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
            <CardHeader className="border-b bg-slate-50/50 pb-4">
              <CardTitle className="text-lg font-serif text-slate-800">Book Walk-In Appointment</CardTitle>
              <CardDescription>Assign a doctor for {patient?.patient_name}</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleBookWalkIn} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Assign Doctor</Label>
                  <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select Doctor" />
                    </SelectTrigger>
                    <SelectContent className="z-[200]">
                      {doctorsList.map((d) => (
                        <SelectItem key={d.name} value={d.name} disabled={d.status === "Unavailable"}>
                          {d.doctor_name} {d.specialization ? `(${d.specialization})` : ''} {d.status === "Unavailable" ? "- Unavailable" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowBookModal(false)} className="h-9">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isBooking} className="bg-teal-600 hover:bg-teal-700 text-white h-9">
                    {isBooking ? "Booking..." : "Confirm Walk-In"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invoice View Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 border-0 overflow-hidden">
            <div className="bg-slate-900 text-white p-6 relative">
              <button onClick={() => setShowInvoiceModal(false)} className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition">
                <AlertCircle className="w-5 h-5 rotate-45 text-white/70" />
              </button>
              <h2 className="text-xl font-bold font-serif mb-1">Tax Invoice / Receipt</h2>
              <p className="text-sm text-slate-300">Thangam Hospital ERP System</p>
            </div>
            
            <div className="p-6 bg-white space-y-6">
              <div className="flex justify-between items-start text-sm">
                <div>
                  <p className="text-slate-500 font-semibold mb-1">Billed To:</p>
                  <p className="font-bold text-slate-800 text-base">{patient?.patient_name}</p>
                  <p className="text-slate-600">ID: {patientId}</p>
                  <p className="text-slate-600">Ph: {mobile}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 font-semibold mb-1">Invoice Details:</p>
                  <p className="text-slate-800 font-medium">{activeInvoice?.name}</p>
                  <p className="text-slate-600">Date: {activeInvoice?.date}</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Description</th>
                      <th className="px-4 py-3 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-4 py-3 text-slate-800">Consultation Fee {activeInvoice?.walkinData?.doctor ? `(${activeInvoice.walkinData.doctor})` : ""}</td>
                      <td className="px-4 py-3 text-right text-slate-800 font-medium">₹ 500.00</td>
                    </tr>
                    
                    {activeInvoice?.walkinData?.need_lab_test === 1 && (
                      <tr>
                        <td className="px-4 py-3 text-slate-800">Lab Diagnostics {activeInvoice.walkinData.lab_test_name ? `(${activeInvoice.walkinData.lab_test_name})` : ""}</td>
                        <td className="px-4 py-3 text-right text-slate-800 font-medium">₹ 450.00</td>
                      </tr>
                    )}
                    
                    {activeInvoice?.walkinData?.pharmacy_bill_amount > 0 && (
                      <tr>
                        <td className="px-4 py-3 text-slate-800">
                          Pharmacy Dispensed Package
                          {activeInvoice.walkinData.dispensed_medicines && activeInvoice.walkinData.dispensed_medicines.length > 0 && (
                            <div className="text-xs text-slate-500 mt-1 space-y-1">
                              {activeInvoice.walkinData.dispensed_medicines.map((med, idx) => (
                                <div key={idx}>- {med.medicine_name} (x{med.qty}) @ ₹{med.price || 0}/ea</div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-800 font-medium align-top">₹ {activeInvoice.walkinData.pharmacy_bill_amount.toFixed(2)}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                    <tr>
                      <td className="px-4 py-3 text-right uppercase text-xs tracking-wider">Grand Total</td>
                      <td className="px-4 py-3 text-right text-lg text-emerald-600">
                        ₹ {(
                          500 + 
                          (activeInvoice?.walkinData?.need_lab_test === 1 ? 450 : 0) + 
                          (activeInvoice?.walkinData?.pharmacy_bill_amount || 0)
                        ).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowInvoiceModal(false)}>Close</Button>
                <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  <Printer className="w-4 h-4" /> Print Invoice
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
