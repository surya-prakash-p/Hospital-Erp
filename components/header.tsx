"use client";

import React, { useState, useEffect } from "react";
import { 
  RefreshCw, 
  LogOut, 
  ShieldCheck, 
  User, 
  CheckCircle2, 
  X, 
  Stethoscope, 
  Clock, 
  MapPin, 
  CreditCard,
  ChevronDown,
  Activity,
  PhoneCall
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { usePathname, useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, logout, updateProfile } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Profile modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  
  // Profile & Availability form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [qualification, setQualification] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [opdTimings, setOpdTimings] = useState("");
  const [consultationFee, setConsultationFee] = useState("");
  const [bio, setBio] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState("Available (On-Duty)");
  const [emergencyOnCall, setEmergencyOnCall] = useState(true);
  const [maxCapacity, setMaxCapacity] = useState("30");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || user.name || "");
      setEmail(user.email || "");
      setMobileNo(user.mobile_no || "");
      setSpecialization(user.specialization || "General Medicine & Surgery");
      setQualification(user.qualification || "MBBS, MD (Gen Med)");
      setRoomNo(user.room_no || "OPD Chamber 102");
      setOpdTimings(user.opd_timings || "Mon-Sat: 09:00 AM - 01:00 PM & 04:00 PM - 07:00 PM");
      setConsultationFee(user.fee || "500");
      setBio(user.bio || "Senior Consultant Physician committed to compassionate, high-quality patient care.");
      setAvailabilityStatus(user.availabilityStatus || "Available (On-Duty)");
      setEmergencyOnCall(user.emergencyOnCall !== undefined ? user.emergencyOnCall : true);
      setMaxCapacity(user.maxCapacity || "30");
    }
  }, [user, isProfileModalOpen]);

  // Don't render header on login page or when user is not logged in
  if (pathname === '/login' || !user) {
    return null;
  }

  const hospitalRoles = ["Hospital Admin", "System Manager", "Doctor", "Pharmacist", "Lab Technician", "Receptionist", "Billing Clerk"];
  const displayRoles = (user?.roles || []).filter(r => hospitalRoles.includes(r));
  if (displayRoles.length === 0 && user?.roles?.length) {
    displayRoles.push(user.roles[0]);
  }

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (updateProfile) {
        updateProfile({
          full_name: fullName,
          name: fullName,
          email: email,
          mobile_no: mobileNo,
          specialization: specialization,
          qualification: qualification,
          room_no: roomNo,
          opd_timings: opdTimings,
          fee: consultationFee,
          bio: bio,
          availabilityStatus: availabilityStatus,
          emergencyOnCall: emergencyOnCall,
          maxCapacity: maxCapacity,
        });
      }
      setToastMessage(`Profile & Availability updated (${availabilityStatus})!`);
      setTimeout(() => setToastMessage(""), 3500);
      setIsProfileModalOpen(false);
    } catch (err) {
      console.error("Profile save error", err);
    } finally {
      setIsSaving(false);
    }
  };

  const routeTitles: Record<string, string> = {
    "/": "Overview Dashboard",
    "/reception": "Reception Desk",
    "/patient-registry": "Patient Registry",
    "/consultation": "Doctor Consultation",
    "/lab": "Lab Station & Diagnostics",
    "/pharmacy": "Pharmacy Station",
    "/billing": "Billing & Invoicing",
    "/finance": "Financial Ledger",
    "/doctors": "Doctors Registry",
    "/ai-assistant": "AI Copilot Workspace",
  };

  const activeTitle = routeTitles[pathname] || "Hospital ERP";

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-[110] bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span>Portal</span>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-semibold text-slate-900 tracking-tight font-sans">
              {activeTitle}
            </span>
          </div>
          <div className="h-4 w-px bg-slate-200 mx-1" />
          <div className="flex items-center gap-1.5 flex-wrap">
            {displayRoles.map((role) => (
              <span
                key={role}
                className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 uppercase tracking-wider shadow-2xs"
              >
                <ShieldCheck className="w-3 h-3 text-blue-600" />
                {role}
              </span>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* User Account Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="flex items-center gap-3 px-3 py-1 bg-white hover:bg-slate-50 transition-colors rounded-xl border border-slate-200 text-xs cursor-pointer outline-none group shadow-2xs"
                title="Open user account menu"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0">
                  <img
                    src={user?.doctor_image || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80"}
                    alt={fullName || "Doctor Profile"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="hidden sm:block text-left">
                  <div className="font-bold text-slate-900 text-[12px] leading-tight group-hover:text-blue-600 transition-colors">
                    {fullName || user?.full_name || user?.name || "Dr. Rajesh Kumar"}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                    {user?.roles?.length ? user.roles[0] : "Doctor"}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors ml-1" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-60 rounded-xl p-1.5 shadow-xl border border-slate-200 bg-white" align="end" sideOffset={6}>
              <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-slate-900 border-b border-slate-100 mb-1">
                <div className="font-bold text-slate-900 text-sm">My Account</div>
                <div className="text-[11px] font-normal text-slate-500 mt-0.5 truncate">{user?.email}</div>
              </DropdownMenuLabel>

              <DropdownMenuItem 
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center justify-between px-3 py-2.5 text-xs text-slate-900 font-semibold hover:bg-blue-50 hover:text-blue-700 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Profile</span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  availabilityStatus.includes('Available') ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                  availabilityStatus.includes('Busy') ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                  availabilityStatus.includes('Surgery') ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {availabilityStatus.split(' ')[0] || 'Active'}
                </span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1 border-slate-100" />

              <DropdownMenuItem 
                onClick={logout}
                className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-rose-600 font-bold hover:bg-rose-50 hover:text-rose-700 rounded-lg cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </header>

      {/* Doctor / User Profile Update Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
                  {fullName ? fullName.charAt(0).toUpperCase() : 'D'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide">
                    {user?.roles?.includes('Doctor') ? "Doctor Profile & Availability" : "Account & Profile Details"}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {user?.roles?.includes('Doctor') ? "View and update clinical profile and duty availability" : "View and update your account details & contact information"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Doctor Availability Section */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-600" /> Current Availability Status
                  </label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    availabilityStatus.includes('Available') ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                    availabilityStatus.includes('Busy') ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                    availabilityStatus.includes('Surgery') ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' : 'bg-slate-200 text-slate-800'
                  }`}>
                    {availabilityStatus}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">Duty Status</label>
                    <select
                      value={availabilityStatus}
                      onChange={(e) => setAvailabilityStatus(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                    >
                      <option value="Available (On-Duty)">Available (On-Duty)</option>
                      <option value="Busy (In Consultation)">Busy (In Consultation)</option>
                      <option value="In Surgery (OT)">In Surgery (OT)</option>
                      <option value="On Break">On Break</option>
                      <option value="Off-Duty / Unavailable">Off-Duty / Unavailable</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">Max Queue Capacity</label>
                    <input
                      type="number"
                      value={maxCapacity}
                      onChange={(e) => setMaxCapacity(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      placeholder="e.g. 30 patients/day"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={emergencyOnCall}
                      onChange={(e) => setEmergencyOnCall(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="flex items-center gap-1">
                      <PhoneCall className="w-3.5 h-3.5 text-blue-600" /> Available for Emergency On-Call (24/7)
                    </span>
                  </label>
                </div>
              </div>

              {/* Full Name & Specialization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" /> Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    placeholder="e.g. Dr. Rajesh Kumar"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-blue-600" /> Specialization
                  </label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    placeholder="e.g. Cardiology / General Medicine"
                  />
                </div>
              </div>

              {/* Email & Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    placeholder="doctor@thangamhospital.com"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Mobile Number</label>
                  <input
                    type="tel"
                    value={mobileNo}
                    onChange={(e) => setMobileNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    placeholder="9900000002"
                  />
                </div>
              </div>

              {/* Qualification & Room */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Qualifications & Reg. No.</label>
                  <input
                    type="text"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    placeholder="e.g. MBBS, MD, Reg #39401"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" /> OPD Room / Chamber
                  </label>
                  <input
                    type="text"
                    value={roomNo}
                    onChange={(e) => setRoomNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    placeholder="e.g. OPD Room 102, Block A"
                  />
                </div>
              </div>

              {/* OPD Timings & Consultation Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" /> Working Days & OPD Timings
                  </label>
                  <input
                    type="text"
                    value={opdTimings}
                    onChange={(e) => setOpdTimings(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    placeholder="e.g. Mon-Sat: 09:00 AM - 01:00 PM"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" /> Consultation Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    placeholder="500"
                  />
                </div>
              </div>

              {/* Bio / Doctor Summary */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Bio & Clinical Notes</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  placeholder="Enter doctor profile bio or clinical notes..."
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="h-9 px-4 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="h-9 px-5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer"
                >
                  {isSaving ? "Saving..." : "Save Profile & Availability"}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}


