"use client";

import { useState, useEffect } from "react";
import { Search, UserPlus, Activity, Users, CheckCircle, AlertCircle, Plus, Info, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getQueue,
  getPatients,
  getDoctors,
  searchPatient,
  createPatient,
  createWalkIn
} from "@/lib/hospital-service";

export default function ReceptionPage() {
  const router = useRouter();
  // Database States
  const [queue, setQueue] = useState([]);
  const [patientsCount, setPatientsCount] = useState(0);
  const [doctors, setDoctors] = useState([]);

  // Toast notifications State
  const [toasts, setToasts] = useState([]);

  // Form States
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [formState, setFormState] = useState({
    patient_name: "",
    mobile_number: "",
    age: "",
    gender: "Male",
    email: "",
    doctor: "",
    height: "",
    weight: "",
    blood_group: "",
    is_existing: false,
    medical_history: ""
  });

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

        const p = await getPatients();
        setPatientsCount(Object.keys(p).length);

        const d = await getDoctors();
        setDoctors(d);
        if (d.length > 0) {
          setFormState((prev) => ({ ...prev, doctor: prev.doctor || d[0].name }));
        }
      } catch (err) {
        showToast("Error loading reception data", "error");
        console.error(err);
      }
    }
    loadData();
  }, []);

  // Search handler
  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) {
      showToast("Please enter a name or mobile number", "info");
      return;
    }
    
    setIsSearching(true);
    try {
      const patient = await searchPatient(searchQuery.trim());
      if (patient) {
        showToast(`Patient found! Redirecting to profile...`, "success");
        router.push(`/patient/${patient.mobile_number}`);
      } else {
        showToast(`No record found for "${searchQuery}". Please register as a new patient.`, "info");
        const isNumeric = /^\d+$/.test(searchQuery.trim());
        setFormState((prev) => ({
          ...prev,
          patient_name: isNumeric ? "" : searchQuery.trim(),
          mobile_number: isNumeric ? searchQuery.trim() : "",
          age: "",
          email: "",
          height: "",
          weight: "",
          blood_group: "",
          is_existing: false,
          medical_history: ""
        }));
      }
    } catch (err) {
      showToast("Search failed", "error");
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  // Submit Registration & Walk-In with Optimistic UI updates
  const handleRegister = async (e) => {
    e?.preventDefault();
    const { patient_name, mobile_number, age, gender, email, doctor, is_existing, medical_history } = formState;

    if (!patient_name || !mobile_number) {
      showToast("Patient Name and Mobile Number are required", "error");
      return;
    }

    if (mobile_number.length < 10) {
      showToast("Please enter a valid 10-digit mobile number", "error");
      return;
    }

    const originalQueue = [...queue];
    const originalPatientsCount = patientsCount;

    // Optimistically update states instantly
    const mockWalkIn = {
      name: `HOSP-WALK-TEMP-${Date.now().toString().slice(-4)}`,
      patient_name,
      mobile_number,
      is_existing: is_existing ? 1 : 0,
      doctor,
      appointment_status: "Doctor Consultation"
    };

    setQueue(prev => [mockWalkIn, ...prev]);
    setPatientsCount(prev => prev + (is_existing ? 0 : 1));
    showToast("Registering patient visit (updating)...", "info");

    // Reset form immediately for instant feel
    setFormState({
      patient_name: "",
      mobile_number: "",
      age: "",
      gender: "Male",
      email: "",
      doctor: doctors.length > 0 ? doctors[0].name : "",
      height: "",
      weight: "",
      blood_group: "",
      is_existing: false,
      medical_history: ""
    });
    try {
      // 1. Create/Retrieve Patient
      const { height, weight, blood_group } = formState;
      await createPatient({
        patient_name,
        mobile_number,
        age: age ? parseInt(age) : null,
        gender,
        email,
        height,
        weight,
        blood_group,
        medical_history: medical_history || ""
      });

      // 2. Create Patient Walk-In
      const walkIn = await createWalkIn({
        patient_name,
        mobile_number,
        is_existing,
        doctor,
        appointment_status: "Doctor Consultation"
      });

      showToast(`Registered successfully! ID: ${walkIn.name}`, "success");
      
      // Redirect to patient profile page
      router.push(`/patient/${mobile_number}`);

      // Reload actual database states in background
      const updatedQueue = await getQueue();
      setQueue(updatedQueue);
      const updatedPatients = await getPatients();
      setPatientsCount(Object.keys(updatedPatients).length);
    } catch (err) {
      // Rollback on failure
      setQueue(originalQueue);
      setPatientsCount(originalPatientsCount);
      showToast(err.message || "Failed to register patient", "error");
      console.error(err);
    }
  };

  const handleSelectDoctor = (val) => {
    setFormState((prev) => ({ ...prev, doctor: val }));
  };

  const handleSelectGender = (val) => {
    setFormState((prev) => ({ ...prev, gender: val }));
  };

  const handleResetForm = () => {
    setFormState({
      patient_name: "",
      mobile_number: "",
      age: "",
      gender: "Male",
      email: "",
      doctor: doctors.length > 0 ? doctors[0].name : "",
      is_existing: false,
      medical_history: ""
    });
    setSearchQuery("");
    showToast("Form cleared", "info");
  };

  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto">
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
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-serif">Reception Desk</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage patient walk-ins and registry</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Find Existing Patient */}
          <Card>
            <CardHeader className="bg-slate-50 border-b py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-500" />
                Find Existing Patient Records
              </CardTitle>
              <CardDescription className="text-xs">Search by mobile number or name to auto-load reports.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 pb-4">
              <form onSubmit={handleSearch} className="flex gap-3">
                <Input
                  placeholder="Search by Mobile (e.g. 9876543210) or Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 h-9 text-sm"
                />
                 <Button 
                  type="submit" 
                  disabled={isSearching}
                  className="h-9 text-sm bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5"
                >
                  {isSearching && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isSearching ? "Searching..." : "Check Record"}
                </Button>
              </form>
              <p className="text-[11px] text-muted-foreground mt-2 italic">
                💡 Tip: Try typing "9876543210" or "Surya Prakash" to demo auto-loading reports!
              </p>
            </CardContent>
          </Card>

          {/* New Patient Registration */}
          <Card>
            <CardHeader className="bg-slate-50 border-b py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-500" />
                {formState.is_existing ? "Existing Patient Visit Registration" : "New Patient Registration"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 pb-4">
              <form onSubmit={handleRegister} className="space-y-3">
                {formState.is_existing && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-md p-3 text-xs text-indigo-800 flex gap-2 items-start mb-2">
                    <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Autoloaded Patient Profile:</span> Records exist in system. Appending visit log will update their permanent history.
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-xs">Patient Name *</Label>
                    <Input
                      id="name"
                      placeholder="Enter full name"
                      value={formState.patient_name}
                      onChange={(e) => setFormState({ ...formState, patient_name: e.target.value })}
                      className="h-9 text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="mobile" className="text-xs">Mobile Number *</Label>
                    <Input
                      id="mobile"
                      placeholder="Enter 10-digit number"
                      value={formState.mobile_number}
                      onChange={(e) => setFormState({ ...formState, mobile_number: e.target.value })}
                      className="h-9 text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="age" className="text-xs">Age</Label>
                    <Input
                      id="age"
                      placeholder="Age in years"
                      type="number"
                      value={formState.age}
                      onChange={(e) => setFormState({ ...formState, age: e.target.value })}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="gender" className="text-xs">Gender</Label>
                    <Select value={formState.gender} onValueChange={handleSelectGender}>
                      <SelectTrigger id="gender" className="h-9 text-sm">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-xs">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="patient@example.com"
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="doctor" className="text-xs">Assign Doctor *</Label>
                    <Select value={formState.doctor} onValueChange={handleSelectDoctor}>
                      <SelectTrigger id="doctor" className="h-9 text-sm">
                        <SelectValue placeholder="Select doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((d) => (
                          <SelectItem key={d.name} value={d.name}>
                            {d.doctor_name} ({d.specialization})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Vitals fields: Height, Weight, Blood Group */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-slate-100 pt-3">
                  <div className="space-y-1">
                    <Label htmlFor="height" className="text-xs">Height</Label>
                    <Input
                      id="height"
                      placeholder="e.g. 175 cm"
                      value={formState.height}
                      onChange={(e) => setFormState({ ...formState, height: e.target.value })}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="weight" className="text-xs">Weight</Label>
                    <Input
                      id="weight"
                      placeholder="e.g. 72 kg"
                      value={formState.weight}
                      onChange={(e) => setFormState({ ...formState, weight: e.target.value })}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="blood" className="text-xs">Blood Group</Label>
                    <Select value={formState.blood_group} onValueChange={(val) => setFormState({ ...formState, blood_group: val })}>
                      <SelectTrigger id="blood" className="h-9 text-sm">
                        <SelectValue placeholder="Select blood..." />
                      </SelectTrigger>
                      <SelectContent>
                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                          <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formState.is_existing && formState.medical_history && (
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-indigo-700">Past Diagnosis History</Label>
                    <pre className="p-3 bg-indigo-50/30 rounded border border-indigo-100/50 text-xs text-indigo-900 overflow-y-auto max-h-[120px] font-mono whitespace-pre-wrap">
                      {formState.medical_history}
                    </pre>
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={handleResetForm} className="h-9 text-sm">
                    Clear Form
                  </Button>
                  <Button type="submit" className="w-full md:w-auto h-9 text-sm bg-indigo-600 hover:bg-indigo-700 text-white gap-1">
                    <Plus className="w-4 h-4" />
                    Register Patient Walk-In
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar panels */}
        <div className="space-y-4">
          {/* Active Patient Board (Queue) */}
          <Card className="flex flex-col h-[350px]">
            <CardHeader className="bg-slate-50 border-b py-3 shrink-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-500" />
                Active Patient Board
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1">
              <div className="divide-y">
                {queue
                  .filter((q) => q.appointment_status !== "Completed")
                  .map((item) => {
                    let badgeClass = "bg-slate-100 text-slate-700 border-slate-200";
                    if (item.appointment_status === "Doctor Consultation") {
                      badgeClass = "bg-indigo-50 text-indigo-700 border-indigo-200";
                    } else if (item.appointment_status === "Lab Test") {
                      badgeClass = "bg-purple-50 text-purple-700 border-purple-200";
                    } else if (item.appointment_status === "Pharmacy") {
                      badgeClass = "bg-pink-50 text-pink-700 border-pink-200";
                    } else if (item.appointment_status === "Billing") {
                      badgeClass = "bg-teal-50 text-teal-700 border-teal-200";
                    }

                    return (
                      <div key={item.name} className="p-3 bg-white hover:bg-slate-50 transition-colors flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-semibold text-xs text-slate-900">{item.patient_name}</h4>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {item.mobile_number} | {item.doctor}
                          </p>
                        </div>
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${badgeClass} whitespace-nowrap`}>
                          {item.appointment_status === "Doctor Consultation" ? "Consultation" : item.appointment_status}
                        </span>
                      </div>
                    );
                  })}

                {queue.filter((q) => q.appointment_status !== "Completed").length === 0 && (
                  <div className="text-center text-muted-foreground py-10 text-xs">
                    No active patients in queue.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Patient Registry Summary */}
          <Card>
            <CardHeader className="bg-slate-50 border-b py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-500" />
                Patient Registry Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 pb-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-2xl font-bold text-slate-900">{patientsCount}</p>
                  <p className="text-[10px] font-medium text-slate-500 mt-0.5 uppercase tracking-wider">Registered</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-2xl font-bold text-slate-900">
                    {queue.filter((q) => q.appointment_status === "Completed").length}
                  </p>
                  <p className="text-[10px] font-medium text-slate-500 mt-0.5 uppercase tracking-wider">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
