"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Phone, Mail, Droplet, Ruler, Scale, Calendar, Edit2, Check, RefreshCw, UserRound, BookOpen, Heart, Activity, CheckCircle, AlertCircle, Info, Thermometer, HeartPulse, Wind, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getPatient, updatePatient } from "@/lib/hospital-service";

export default function PatientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const mobile = params.mobile;

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Edit fields matching all vital and contact parameters
  const [editState, setEditState] = useState({
    patient_name: "",
    age: "",
    gender: "Male",
    email: "",
    height: "",
    weight: "",
    blood_group: "",
    temperature: "",
    bp: "",
    pulse: "",
    resp_rate: "",
    spo2: "",
    allergies: "",
    emergency_contact: "",
    medical_history: ""
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
          patient_name: p.patient_name || "",
          age: p.age ? String(p.age) : "",
          gender: p.gender || "Male",
          email: p.email || "",
          height: p.height || "",
          weight: p.weight || "",
          blood_group: p.blood_group || "",
          temperature: p.temperature || "",
          bp: p.bp || "",
          pulse: p.pulse || "",
          resp_rate: p.resp_rate || "",
          spo2: p.spo2 || "",
          allergies: p.allergies || "",
          emergency_contact: p.emergency_contact || "",
          medical_history: p.medical_history || ""
        });
      } else {
        showToast("Patient record not found", "error");
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
        patient_name: editState.patient_name,
        age: editState.age ? parseInt(editState.age) : null,
        gender: editState.gender,
        email: editState.email,
        height: editState.height,
        weight: editState.weight,
        blood_group: editState.blood_group,
        temperature: editState.temperature,
        bp: editState.bp,
        pulse: editState.pulse,
        resp_rate: editState.resp_rate,
        spo2: editState.spo2,
        allergies: editState.allergies,
        emergency_contact: editState.emergency_contact,
        medical_history: editState.medical_history
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

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-pulse">
        {/* Skeleton Header */}
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-slate-200" />
          <div className="h-6 w-32 bg-slate-200 rounded" />
        </div>

        {/* Skeleton Card */}
        <div className="bg-white border rounded-xl p-6 space-y-6">
          <div className="flex gap-4 items-center border-b pb-4">
            <div className="w-16 h-16 rounded-full bg-slate-200" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-48 bg-slate-200 rounded" />
              <div className="h-4 w-32 bg-slate-200 rounded" />
            </div>
            <div className="w-20 h-8 bg-slate-200 rounded" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(idx => (
              <div key={idx} className="h-20 bg-slate-200/65 rounded-lg" />
            ))}
          </div>

          <div className="space-y-3">
            <div className="h-4 w-36 bg-slate-200 rounded" />
            <div className="h-24 bg-slate-100 rounded" />
          </div>
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

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
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
        <Button
          variant="outline"
          onClick={() => router.push('/reception')}
          className="gap-1.5 h-9 text-xs border-slate-200 animate-in fade-in duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Reception Desk
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadPatientDetails} className="h-9 gap-1 text-xs border-slate-200">
            <RefreshCw className="w-3.5 h-3.5" /> Reload
          </Button>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 h-9 text-xs font-semibold shadow-sm"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {isEditing ? (
          <Card className="border-t-4 border-t-indigo-600 shadow-lg">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <UserRound className="w-5 h-5 text-indigo-500" />
                Edit Patient Profile
              </CardTitle>
              <CardDescription>Update name, vitals, allergies, contact numbers, and clinical metrics.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="edit-name" className="text-xs font-semibold">Patient Name *</Label>
                    <Input
                      id="edit-name"
                      value={editState.patient_name}
                      onChange={(e) => setEditState({ ...editState, patient_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-email" className="text-xs font-semibold">Email Address</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editState.email}
                      onChange={(e) => setEditState({ ...editState, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-age" className="text-xs font-semibold">Age</Label>
                    <Input
                      id="edit-age"
                      type="number"
                      value={editState.age}
                      onChange={(e) => setEditState({ ...editState, age: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-gender" className="text-xs font-semibold">Gender</Label>
                    <Select value={editState.gender} onValueChange={(val) => setEditState({ ...editState, gender: val })}>
                      <SelectTrigger id="edit-gender" className="h-10">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-height" className="text-xs font-semibold">Height</Label>
                    <Input
                      id="edit-height"
                      placeholder="e.g. 175 cm"
                      value={editState.height}
                      onChange={(e) => setEditState({ ...editState, height: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-weight" className="text-xs font-semibold">Weight</Label>
                    <Input
                      id="edit-weight"
                      placeholder="e.g. 72 kg"
                      value={editState.weight}
                      onChange={(e) => setEditState({ ...editState, weight: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-blood" className="text-xs font-semibold">Blood Group</Label>
                    <Select value={editState.blood_group} onValueChange={(val) => setEditState({ ...editState, blood_group: val })}>
                      <SelectTrigger id="edit-blood" className="h-10">
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                          <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-temp" className="text-xs font-semibold">Temperature (°F)</Label>
                    <Input
                      id="edit-temp"
                      placeholder="e.g. 98.6"
                      value={editState.temperature}
                      onChange={(e) => setEditState({ ...editState, temperature: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-bp" className="text-xs font-semibold">Blood Pressure (mmHg)</Label>
                    <Input
                      id="edit-bp"
                      placeholder="e.g. 120/80"
                      value={editState.bp}
                      onChange={(e) => setEditState({ ...editState, bp: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-pulse" className="text-xs font-semibold">Pulse Rate (bpm)</Label>
                    <Input
                      id="edit-pulse"
                      placeholder="e.g. 72"
                      value={editState.pulse}
                      onChange={(e) => setEditState({ ...editState, pulse: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-resprate" className="text-xs font-semibold">Respiratory Rate</Label>
                    <Input
                      id="edit-resprate"
                      placeholder="e.g. 16"
                      value={editState.resp_rate}
                      onChange={(e) => setEditState({ ...editState, resp_rate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-spo2" className="text-xs font-semibold">SpO2 (%)</Label>
                    <Input
                      id="edit-spo2"
                      placeholder="e.g. 98"
                      value={editState.spo2}
                      onChange={(e) => setEditState({ ...editState, spo2: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-emerg" className="text-xs font-semibold">Emergency Contact No.</Label>
                    <Input
                      id="edit-emerg"
                      placeholder="e.g. 9876543200"
                      value={editState.emergency_contact}
                      maxLength={10}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setEditState({ ...editState, emergency_contact: val });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-allergies" className="text-xs font-semibold">Known Allergies</Label>
                    <Input
                      id="edit-allergies"
                      placeholder="e.g. Penicillin, Dust"
                      value={editState.allergies}
                      onChange={(e) => setEditState({ ...editState, allergies: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-history" className="text-xs font-semibold">Additional Medical History Notes</Label>
                  <textarea
                    id="edit-history"
                    className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-950"
                    value={editState.medical_history}
                    onChange={(e) => setEditState({ ...editState, medical_history: e.target.value })}
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="h-9 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-xs font-semibold"
                  >
                    Save Profile
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Primary Profile Details Card */}
            <Card className="overflow-hidden shadow-md">
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 text-white flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/20 border-2 border-indigo-400/50 flex items-center justify-center text-white text-2xl font-bold">
                    {patient.patient_name?.[0]?.toUpperCase() || "P"}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold font-serif leading-tight">{patient.patient_name}</h3>
                    <p className="text-slate-300 text-xs font-medium mt-0.5 flex items-center gap-1.5">
                      <span>Age: {patient.age || "N/A"}</span>
                      <span>|</span>
                      <span>Gender: {patient.gender}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{patient.mobile_number}</span>
                  </div>
                  {patient.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>{patient.email}</span>
                    </div>
                  )}
                  {patient.emergency_contact && (
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>ICE Contact: {patient.emergency_contact}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Vitals Badges Grid */}
              <CardContent className="pt-6 pb-6 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-rose-50/40 border border-rose-100/70 rounded-xl p-3.5 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                      <Droplet className="w-4.5 h-4.5 fill-rose-500 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Blood Group</p>
                      <h4 className="text-sm font-bold text-slate-800 mt-0.5">{patient.blood_group || "N/A"}</h4>
                    </div>
                  </div>

                  <div className="bg-blue-50/40 border border-blue-100/70 rounded-xl p-3.5 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <Ruler className="w-4.5 h-4.5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Height</p>
                      <h4 className="text-sm font-bold text-slate-800 mt-0.5">{patient.height || "N/A"}</h4>
                    </div>
                  </div>

                  <div className="bg-emerald-50/40 border border-emerald-100/70 rounded-xl p-3.5 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                      <Scale className="w-4.5 h-4.5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Weight</p>
                      <h4 className="text-sm font-bold text-slate-800 mt-0.5">{patient.weight || "N/A"}</h4>
                    </div>
                  </div>

                  <div className="bg-amber-50/40 border border-amber-100/70 rounded-xl p-3.5 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                      <Thermometer className="w-4.5 h-4.5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Temperature</p>
                      <h4 className="text-sm font-bold text-slate-800 mt-0.5">{patient.temperature ? `${patient.temperature}°F` : "N/A"}</h4>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-indigo-50/40 border border-indigo-100/70 rounded-xl p-3.5 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                      <Activity className="w-4.5 h-4.5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Blood Pressure</p>
                      <h4 className="text-sm font-bold text-slate-800 mt-0.5">{patient.bp || "N/A"}</h4>
                    </div>
                  </div>

                  <div className="bg-teal-50/40 border border-teal-100/70 rounded-xl p-3.5 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                      <HeartPulse className="w-4.5 h-4.5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Pulse Rate</p>
                      <h4 className="text-sm font-bold text-slate-800 mt-0.5">{patient.pulse ? `${patient.pulse} bpm` : "N/A"}</h4>
                    </div>
                  </div>

                  <div className="bg-purple-50/40 border border-purple-100/70 rounded-xl p-3.5 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                      <Wind className="w-4.5 h-4.5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Resp Rate</p>
                      <h4 className="text-sm font-bold text-slate-800 mt-0.5">{patient.resp_rate || "N/A"}</h4>
                    </div>
                  </div>

                  <div className="bg-sky-50/40 border border-sky-100/70 rounded-xl p-3.5 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                      <CheckCircle className="w-4.5 h-4.5 text-sky-600" />
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Oxygen (SpO2)</p>
                      <h4 className="text-sm font-bold text-slate-800 mt-0.5">{patient.spo2 ? `${patient.spo2}%` : "N/A"}</h4>
                    </div>
                  </div>
                </div>

                {/* Known Allergies Callout */}
                {patient.allergies && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex gap-3 text-xs text-rose-800">
                    <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
                    <div>
                      <span className="font-bold">Drug/Allergy Alerts:</span> {patient.allergies}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Medical History Timeline Card */}
            <Card className="shadow-md">
              <CardHeader className="bg-slate-50/50 border-b py-4">
                <CardTitle className="text-base flex items-center gap-2 text-slate-800">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  Medical History & Walk-In Logs
                </CardTitle>
                <CardDescription className="text-xs">Timeline of consultations, diagnoses, prescriptions, and lab tests.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {patient.medical_history ? (
                  <pre className="p-4 bg-slate-900 border border-slate-950 rounded-lg text-[11px] text-slate-200 font-mono whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto shadow-inner animate-in fade-in duration-300">
                    {patient.medical_history}
                  </pre>
                ) : (
                  <div className="text-center py-10 text-muted-foreground text-xs italic">
                    No active diagnosis history recorded. Check-in walk-in records will automatically sync here upon checkout checkout.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
