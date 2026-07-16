"use client";

import { useState, useEffect } from "react";
import { UserRound, MapPin, Award, Star, GraduationCap, DollarSign, Users, Trash2, Upload, PlusCircle, CheckCircle, AlertCircle, Info, Lock, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getDoctors, createDoctor } from "@/lib/hospital-service";

export default function DoctorsCatalogPage() {
  const [doctorsList, setDoctorsList] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [showPassword, setShowPassword] = useState(false);

  // Form states matching user screenshot
  const [docImage, setDocImage] = useState("");
  const [fullName, setFullName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [consultFee, setConsultFee] = useState("");
  const [rating, setRating] = useState("");
  const [patients, setPatients] = useState("");
  const [successRate, setSuccessRate] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("Available");
  const [about, setAbout] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  async function loadData() {
    try {
      const docs = await getDoctors();
      setDoctorsList(docs);
    } catch (e) {
      showToast("Error loading doctors", "error");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { // 2MB Limit
      showToast("Image must be smaller than 2MB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setDocImage(reader.result);
      showToast("Profile image loaded!", "success");
    };
    reader.readAsDataURL(file);
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !specialization.trim() || !consultFee) {
      showToast("Full Name, Specialization and Consultation Fee are required", "error");
      return;
    }

    const newDoctor = {
      doctor_name: fullName.trim(),
      specialization: specialization.trim(),
      consultation_fee: parseFloat(consultFee),
      doctor_image: docImage,
      location: location.trim(),
      experience: experience.trim(),
      qualifications: qualifications.trim(),
      rating: rating ? parseFloat(rating) : 5.0,
      patients: patients.trim() || "0",
      success_rate: successRate.trim() || "100%",
      email: email.trim(),
      password: password,
      status: status,
      about: about.trim()
    };

    const originalList = [...doctorsList];
    // Optimistic UI update
    setDoctorsList(prev => [...prev, { ...newDoctor, name: newDoctor.doctor_name }]);
    showToast("Adding doctor to registry (updating)...", "info");
    setIsAdding(false);

    // Reset Form
    setDocImage("");
    setFullName("");
    setSpecialization("");
    setLocation("");
    setExperience("");
    setQualifications("");
    setConsultFee("");
    setRating("");
    setPatients("");
    setSuccessRate("");
    setEmail("");
    setPassword("");
    setStatus("Available");
    setAbout("");

    setIsSaving(true);
    try {
      await createDoctor(newDoctor);
      showToast(`${newDoctor.doctor_name} successfully added to registry!`, "success");
      await loadData();
    } catch (err) {
      // Rollback on failure
      setDoctorsList(originalList);
      showToast(err.message || "Failed to save doctor", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Toast Notifications */}
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
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Doctors Registry</h2>
          <p className="text-muted-foreground mt-1">Manage clinical staff, credentials, and availability</p>
        </div>
        {!isAdding && (
          <Button
            onClick={() => setIsAdding(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 h-10 text-sm font-semibold"
          >
            <PlusCircle className="w-4 h-4" />
            Add New Doctor
          </Button>
        )}
      </div>

      {isAdding ? (
        <Card className="max-w-3xl mx-auto border-t-4 border-t-indigo-600 shadow-xl">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-xl flex items-center gap-2 text-slate-800">
              <UserRound className="w-5 h-5 text-indigo-500" />
              Add New Doctor
            </CardTitle>
            <CardDescription>Fill out all credentials and profile values for the medical board registry.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleAddDoctor} className="space-y-6">
              {/* Profile Image Upload Box */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Upload Profile Image</Label>
                <div className="flex items-center gap-4">
                  {!docImage ? (
                    <div 
                      onClick={() => document.getElementById('doctor-profile-upload').click()}
                      className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/10 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group"
                    >
                      <Upload className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all duration-200" />
                      <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Upload</span>
                    </div>
                  ) : (
                    <div className="relative group w-16 h-16 rounded-full overflow-hidden border border-slate-200 shadow-sm bg-slate-100 flex items-center justify-center">
                      <img
                        src={docImage}
                        alt="Profile Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setDocImage("")}
                          className="text-white p-1 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  <input
                    id="doctor-profile-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-semibold text-slate-700">Choose File</p>
                    <p className="text-[10px] mt-0.5">JPG, PNG up to 2MB. Face photo recommended.</p>
                  </div>
                </div>
              </div>

              {/* Form Input Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="fullname" className="text-xs font-semibold text-slate-700">Full Name *</Label>
                  <Input
                    id="fullname"
                    placeholder="e.g. Dr. Rajesh Kumar"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="specialization" className="text-xs font-semibold text-slate-700">Specialization *</Label>
                  <Input
                    id="specialization"
                    placeholder="e.g. Cardiologist"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="location" className="text-xs font-semibold text-slate-700">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g. Clinic Block A, 1st Floor"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="experience" className="text-xs font-semibold text-slate-700">Experience</Label>
                  <Input
                    id="experience"
                    placeholder="e.g. 12 Years"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="qualifications" className="text-xs font-semibold text-slate-700">Qualifications</Label>
                  <Input
                    id="qualifications"
                    placeholder="e.g. MBBS, MD, FACC"
                    value={qualifications}
                    onChange={(e) => setQualifications(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="consultfee" className="text-xs font-semibold text-slate-700">Consultation Fee (₹) *</Label>
                  <Input
                    id="consultfee"
                    type="number"
                    placeholder="e.g. 500"
                    value={consultFee}
                    onChange={(e) => setConsultFee(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="rating" className="text-xs font-semibold text-slate-700">Rating (1.0 - 5.0)</Label>
                  <Input
                    id="rating"
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    placeholder="e.g. 4.8"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="patients" className="text-xs font-semibold text-slate-700">Patients Count</Label>
                  <Input
                    id="patients"
                    placeholder="e.g. 1500+"
                    value={patients}
                    onChange={(e) => setPatients(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="successrate" className="text-xs font-semibold text-slate-700">Success Rate (%)</Label>
                  <Input
                    id="successrate"
                    placeholder="e.g. 98%"
                    value={successRate}
                    onChange={(e) => setSuccessRate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-700">Doctor Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="e.g. rajesh@thangamhospital.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-xs font-semibold text-slate-700">Doctor Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter login password..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="status" className="text-xs font-semibold text-slate-700">Status</Label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-950"
                  >
                    <option value="Available">Available</option>
                    <option value="Unavailable">Unavailable</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="about" className="text-xs font-semibold text-slate-700">About Doctor</Label>
                <textarea
                  id="about"
                  className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-950"
                  placeholder="Doctor bios, education, achievements..."
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAdding(false)}
                  className="h-9 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-sm font-semibold"
                >
                  Save Doctor
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctorsList.map((doc) => {
            const isAvailable = doc.status === "Available" || !doc.status;
            return (
              <Card key={doc.name} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4 border-l-slate-200 hover:border-l-indigo-500 relative flex flex-col justify-between">
                {/* Doctor Availability Dot overlay */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/80 px-2 py-0.5 rounded-full border text-[10px] font-bold shadow-sm backdrop-blur-xs select-none">
                  <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? "bg-emerald-500" : "bg-slate-400"}`} />
                  <span className={isAvailable ? "text-emerald-700" : "text-slate-500"}>
                    {isAvailable ? "Available" : "Away"}
                  </span>
                </div>

                <CardHeader className="bg-slate-50/50 pb-4">
                  <div className="flex gap-4 items-center">
                    {doc.doctor_image ? (
                      <img
                        src={doc.doctor_image}
                        alt={doc.doctor_name}
                        className="w-14 h-14 rounded-full object-cover border border-slate-200 bg-white"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-lg">
                        {doc.doctor_name ? doc.doctor_name.split(". ").pop()?.[0] : "D"}
                      </div>
                    )}

                    <div>
                      <CardTitle className="text-base text-slate-800">{doc.doctor_name}</CardTitle>
                      <CardDescription className="text-xs font-semibold text-indigo-600 mt-0.5">
                        {doc.specialization}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 text-xs space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    {/* Location & Experience */}
                    <div className="grid grid-cols-2 gap-2 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{doc.location || "Coimbatore Block"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{doc.experience || "5+ Years Exp"}</span>
                      </div>
                    </div>

                    {/* Qualifications */}
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{doc.qualifications || "MBBS, MD"}</span>
                    </div>

                    {/* About */}
                    {doc.about && (
                      <p className="text-[11px] text-slate-500 italic mt-1 line-clamp-2">
                        "{doc.about}"
                      </p>
                    )}
                  </div>

                  {/* Rating / Patients / Fee breakdown bar */}
                  <div className="border-t pt-3 mt-3 grid grid-cols-3 gap-1 text-center border-dashed">
                    <div>
                      <div className="flex items-center justify-center gap-0.5 font-bold text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{doc.rating ? doc.rating.toFixed(1) : "5.0"}</span>
                      </div>
                      <p className="text-[9px] text-slate-400 uppercase font-semibold mt-0.5">Rating</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-0.5 font-bold text-indigo-600">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{doc.patients || "200+"}</span>
                      </div>
                      <p className="text-[9px] text-slate-400 uppercase font-semibold mt-0.5">Patients</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-0.5 font-bold text-emerald-600">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{doc.consultation_fee}</span>
                      </div>
                      <p className="text-[9px] text-slate-400 uppercase font-semibold mt-0.5">Fee (₹)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {doctorsList.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-20">
              No doctors found in catalog.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
