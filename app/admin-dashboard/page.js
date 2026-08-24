"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Stethoscope, 
  Pill, 
  FlaskConical, 
  UserRoundCheck, 
  Shield, 
  KeyRound, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Edit3, 
  X, 
  Lock, 
  Check, 
  Building2, 
  Phone, 
  Mail, 
  Eye, 
  EyeOff, 
  Calendar, 
  TrendingUp, 
  Clock, 
  MoreVertical, 
  FileText, 
  Settings, 
  Plus, 
  ChevronRight,
  Filter,
  AlertTriangle,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { getStaffUsers, createStaffUser, updateUserRolesAndPermissions, deleteStaffUser } from "@/lib/hospital-service";

const ALL_ROLES = [
  "Hospital Admin",
  "Doctor",
  "Pharmacist",
  "Lab Technician",
  "Nurse",
  "Receptionist",
  "Billing Clerk"
];

const PERMISSION_OPTIONS = [
  { id: "Doctor Consultations", label: "Doctor Consultations & Queues" },
  { id: "Write Prescriptions", label: "Issue Medical Prescriptions" },
  { id: "Dispense Medicines", label: "Pharmacy Dispensing & FEFO" },
  { id: "Manage Pharmacy Stock", label: "Pharmacy Stock & GRN Import" },
  { id: "Enter Lab Results", label: "Lab Diagnostic Test Reports" },
  { id: "Register Patients", label: "Patient Registration & Walk-Ins" },
  { id: "Manage Invoices", label: "Billing, Receipts & Invoicing" },
  { id: "View Financials", label: "Financial Ledger & Reports" },
  { id: "Manage Roles & Staff", label: "Manage Hospital Roles & Permissions" },
  { id: "Full System Access", label: "Full System Super-Admin Privileges" }
];

// Initial fallback activities if local storage is empty
const INITIAL_SYSTEM_ACTIVITIES = [
  { id: "act-1", title: "Hospital ERP System Initialized", desc: "Hospital Admin Portal Online", time: "09:00 AM", type: "system", color: "bg-emerald-50 text-emerald-600 border-emerald-200" }
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const isHospitalAdmin = Boolean(user?.roles?.includes('Hospital Admin') || user?.permissions?.includes('*') || user?.roles?.includes('Admin'));
  const [staffUsers, setStaffUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("this-month");
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // DOM Refs for smooth scrolling
  const staffTableRef = React.useRef(null);
  const deptSectionRef = React.useRef(null);

  // Live Today's Date Calculation (Updates automatically every day)
  const today = new Date();
  const formattedToday = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const currentMonthName = today.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const prevDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthName = prevDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  const handleMetricCardClick = (targetRole) => {
    if (targetRole === "Departments") {
      deptSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast("Viewing Department Wise Staff Breakdown", "info");
    } else {
      setRoleFilter(targetRole);
      staffTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      showToast(`Showing staff members: ${targetRole === 'All' ? 'All Roles' : targetRole}`, "info");
    }
  };

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeGovernanceTab, setActiveGovernanceTab] = useState("roles"); // "roles" | "permissions"
  const [selectedUser, setSelectedUser] = useState(null);

  // View Staff Profile Modal State
  const [isProfileViewOpen, setIsProfileViewOpen] = useState(false);
  const [viewingStaff, setViewingStaff] = useState(null);

  // Edit Staff Profile Modal State
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [editStaffName, setEditStaffName] = useState("");
  const [editStaffDesignation, setEditStaffDesignation] = useState("");
  const [editStaffDepartment, setEditStaffDepartment] = useState("");
  const [editStaffMobile, setEditStaffMobile] = useState("");
  const [editStaffStatus, setEditStaffStatus] = useState("Active");
  const [editStaffPassword, setEditStaffPassword] = useState("");

  // All Activities Modal State
  const [isActivitiesModalOpen, setIsActivitiesModalOpen] = useState(false);
  const [activitySearchQuery, setActivitySearchQuery] = useState("");

  // New Staff Form State
  const [fullName, setFullName] = useState("");
  const [primaryRole, setPrimaryRole] = useState("Doctor");
  const [department, setDepartment] = useState("General Medicine");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [qualifications, setQualifications] = useState("");
  const [consultationFee, setConsultationFee] = useState("500");
  const [isSaving, setIsSaving] = useState(false);

  // Delete Staff State (Admin Only)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset Password State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [staffToReset, setStaffToReset] = useState(null);
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Edit Roles & Permissions Form State
  const [editRoles, setEditRoles] = useState([]);
  const [editPermissions, setEditPermissions] = useState([]);

  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const addSystemActivityLog = (title, desc, type = "user") => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    
    let color = "bg-blue-50 text-blue-600 border-blue-200";
    if (type === "user") color = "bg-amber-50 text-amber-600 border-amber-200";
    else if (type === "role") color = "bg-blue-50 text-blue-600 border-blue-200";
    else if (type === "dept") color = "bg-emerald-50 text-emerald-600 border-emerald-200";
    else if (type === "profile") color = "bg-rose-50 text-rose-600 border-rose-200";
    else if (type === "system") color = "bg-teal-50 text-teal-600 border-teal-200";

    const newLog = {
      id: `act-${Date.now()}`,
      title,
      desc,
      time: timeStr,
      type,
      color
    };

    setActivities(prev => {
      const updated = [newLog, ...prev.slice(0, 9)];
      if (typeof window !== 'undefined') {
        localStorage.setItem('hospital_system_activities', JSON.stringify(updated));
      }
      return updated;
    });
  };

  async function loadData() {
    setLoading(true);
    try {
      const data = await getStaffUsers();
      setStaffUsers(data);

      if (typeof window !== 'undefined') {
        const savedActivities = localStorage.getItem('hospital_system_activities');
        if (savedActivities) {
          setActivities(JSON.parse(savedActivities));
        } else {
          // Generate initial activities based on loaded staff members
          const generated = (data || []).slice(0, 5).map((s, idx) => ({
            id: `act-gen-${idx}`,
            title: "Staff user active",
            desc: `${s.full_name} (${s.roles ? s.roles[0] : "Staff"})`,
            time: `${10 - idx}:15 AM`,
            type: "user",
            color: "bg-amber-50 text-amber-600 border-amber-200"
          }));
          const initialLogs = generated.length > 0 ? generated : INITIAL_SYSTEM_ACTIVITIES;
          setActivities(initialLogs);
          localStorage.setItem('hospital_system_activities', JSON.stringify(initialLogs));
        }
      }
    } catch (e) {
      showToast("Error loading staff directory", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !phone.trim() || !password) {
      showToast("Full Name, Email, Mobile Number, and Password are required", "error");
      return;
    }

    setIsSaving(true);
    showToast(`Creating ${primaryRole} account and syncing backend...`, "info");

    try {
      const newStaff = await createStaffUser({
        full_name: fullName.trim(),
        email: email.trim(),
        mobile_no: phone.trim(),
        password: password,
        role: primaryRole,
        roles: [primaryRole],
        department: department.trim() || (primaryRole === "Doctor" ? "General Medicine" : primaryRole === "Pharmacist" ? "Pharmacy" : "Laboratory"),
        designation: primaryRole,
        qualifications: qualifications.trim(),
        consultation_fee: consultationFee,
        status: "Active"
      });

      addSystemActivityLog("New staff user created", `${newStaff.full_name} (${primaryRole})`, "user");
      showToast(`Successfully created ${newStaff.full_name} (${primaryRole}) in backend!`, "success");
      setIsAddModalOpen(false);
      
      // Reset Form
      setFullName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setDepartment("General Medicine");
      setQualifications("");
      setConsultationFee("500");

      await loadData();
    } catch (err) {
      showToast(err.message || "Failed to create staff user", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = (staff) => {
    setSelectedUser(staff);
    setEditRoles(staff.roles || [staff.role || "Staff Member"]);
    setEditPermissions(staff.permissions || []);
    setModalSearchQuery("");
    setIsStaffDropdownOpen(false);
    setIsEditModalOpen(true);
  };

  const handleOpenRoleModal = (staff) => {
    const target = staff || (staffUsers.length > 0 ? staffUsers[0] : null);
    if (!target) {
      showToast("No staff members available yet", "error");
      return;
    }
    setSelectedUser(target);
    setEditRoles(target.roles || [target.role || "Staff Member"]);
    setEditPermissions(target.permissions || []);
    setActiveGovernanceTab("roles");
    setModalSearchQuery("");
    setIsStaffDropdownOpen(false);
    setIsEditModalOpen(true);
  };

  const handleOpenPermissionModal = (staff) => {
    const target = staff || (staffUsers.length > 0 ? staffUsers[0] : null);
    if (!target) {
      showToast("No staff members available yet", "error");
      return;
    }
    setSelectedUser(target);
    setEditRoles(target.roles || [target.role || "Staff Member"]);
    setEditPermissions(target.permissions || []);
    setActiveGovernanceTab("permissions");
    setModalSearchQuery("");
    setIsStaffDropdownOpen(false);
    setIsEditModalOpen(true);
  };

  const handleViewStaffProfile = (staff) => {
    setViewingStaff(staff);
    setIsProfileViewOpen(true);
  };

  const handleEditStaffProfile = (staff) => {
    setEditingStaff(staff);
    setEditStaffName(staff.full_name || "");
    setEditStaffDesignation(staff.designation || (staff.roles ? staff.roles[0] : "Staff"));
    setEditStaffDepartment(staff.department || "General Medicine");
    setEditStaffMobile(staff.mobile_no || "");
    setEditStaffStatus(staff.status || "Active");
    setEditStaffPassword("");
    setIsProfileEditOpen(true);
  };

  const handleSaveStaffProfile = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    setIsSaving(true);
    try {
      await createStaffUser({
        id: editingStaff.id,
        email: editingStaff.email,
        full_name: editStaffName,
        mobile_no: editStaffMobile,
        password: editStaffPassword || undefined,
        roles: editingStaff.roles || [editingStaff.designation || "Staff Member"],
        permissions: editingStaff.permissions || [],
        department: editStaffDepartment,
        designation: editStaffDesignation,
        status: editStaffStatus
      });

      addSystemActivityLog("Staff Profile Updated", `${editStaffName} (${editStaffDesignation}) profile details updated`, "user");
      showToast(`Profile updated for ${editStaffName}`, "success");
      setIsProfileEditOpen(false);
      await loadData();
    } catch (err) {
      showToast(err.message || "Failed to update profile", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleToggle = (roleName) => {
    setEditRoles(prev => 
      prev.includes(roleName) ? prev.filter(r => r !== roleName) : [...prev, roleName]
    );
  };

  const handlePermissionToggle = (permId) => {
    setEditPermissions(prev => 
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const handleSaveRolesPermissions = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (editRoles.length === 0) {
      showToast("At least one role must be assigned to the user", "error");
      return;
    }

    setIsSaving(true);
    showToast(`Updating roles & permissions for ${selectedUser.full_name}...`, "info");

    try {
      await updateUserRolesAndPermissions(selectedUser.email, editRoles, editPermissions);
      addSystemActivityLog("Role permission updated", `${selectedUser.full_name} (${editRoles.join(', ')})`, "role");
      showToast(`Updated roles & permissions for ${selectedUser.full_name}!`, "success");
      setIsEditModalOpen(false);
      setSelectedUser(null);
      await loadData();
    } catch (err) {
      showToast(err.message || "Failed to update roles", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDeleteStaff = async () => {
    if (!staffToDelete) return;
    setIsDeleting(true);
    try {
      await deleteStaffUser(staffToDelete.email || staffToDelete.mobile_no);
      addSystemActivityLog(
        "Staff Member Deleted",
        `${staffToDelete.full_name} (${staffToDelete.roles?.[0] || 'Staff'}) was permanently deleted by Admin`,
        "profile"
      );
      showToast(`Staff member ${staffToDelete.full_name} deleted successfully!`, "success");
      setIsDeleteModalOpen(false);
      setStaffToDelete(null);
      await loadData();
    } catch (err) {
      showToast(err.message || "Failed to delete staff member", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExecutePasswordReset = async (e) => {
    e.preventDefault();
    if (!staffToReset) return;

    if (!resetNewPassword || resetNewPassword.trim().length < 4) {
      showToast("Password must be at least 4 characters long", "error");
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      showToast("New password and confirm password do not match", "error");
      return;
    }

    setIsResettingPassword(true);
    try {
      await createStaffUser({
        id: staffToReset.id,
        email: staffToReset.email,
        mobile_no: staffToReset.mobile_no,
        password: resetNewPassword.trim(),
        full_name: staffToReset.full_name,
        roles: staffToReset.roles || [staffToReset.designation || "Staff Member"],
        permissions: staffToReset.permissions || [],
        department: staffToReset.department || "",
        designation: staffToReset.designation || "",
        status: staffToReset.status || "Active"
      });

      addSystemActivityLog(
        "Staff Password Reset",
        `Password updated for ${staffToReset.full_name} (${staffToReset.email || staffToReset.mobile_no})`,
        "user"
      );
      showToast(`Password successfully reset for ${staffToReset.full_name}!`, "success");
      setIsResetModalOpen(false);
      setStaffToReset(null);
      setResetNewPassword("");
      setResetConfirmPassword("");
      await loadData();
    } catch (err) {
      showToast(err.message || "Failed to reset password", "error");
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Metrics Calculations
  const totalStaffCount = staffUsers.length;
  const doctorsCount = staffUsers.filter(s => s.roles?.includes('Doctor')).length;
  const pharmaCount = staffUsers.filter(s => s.roles?.includes('Pharmacist')).length;
  const labCount = staffUsers.filter(s => s.roles?.includes('Lab Technician')).length;
  const nurseCount = staffUsers.filter(s => s.roles?.includes('Nurse')).length;
  const recepCount = staffUsers.filter(s => s.roles?.includes('Receptionist')).length;

  // 1. DYNAMIC DEPARTMENT WISE STAFF CALCULATIONS (Calculated strictly from actual staff data)
  const deptCountsMap = {};
  staffUsers.forEach(s => {
    const dName = s.department?.trim() || (s.roles?.includes('Doctor') ? "General Medicine" : s.roles?.includes('Pharmacist') ? "Pharmacy" : s.roles?.includes('Lab Technician') ? "Laboratory" : "Hospital Administration");
    deptCountsMap[dName] = (deptCountsMap[dName] || 0) + 1;
  });

  const deptCount = Object.keys(deptCountsMap).length || 5;

  const deptColorPalette = [
    "bg-blue-600", "bg-emerald-500", "bg-purple-600", "bg-amber-500", "bg-pink-500", "bg-teal-600", "bg-indigo-600", "bg-slate-500"
  ];

  const deptDistribution = Object.entries(deptCountsMap).length > 0 
    ? Object.entries(deptCountsMap)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count], index) => ({
          name,
          count,
          color: deptColorPalette[index % deptColorPalette.length]
        }))
    : [
        { name: "General Medicine", count: doctorsCount || 1, color: "bg-blue-600" },
        { name: "Pharmacy", count: pharmaCount || 1, color: "bg-emerald-500" },
        { name: "Laboratory", count: labCount || 1, color: "bg-purple-600" },
        { name: "Front Desk & Admissions", count: recepCount || 1, color: "bg-amber-500" },
        { name: "ICU & Wards", count: nurseCount || 1, color: "bg-pink-500" }
      ];

  const maxDeptCount = Math.max(...deptDistribution.map(d => d.count), 1);

  // 2. DYNAMIC ROLE DISTRIBUTION (Calculated strictly from actual staff data)
  const roleDistribution = [
    { name: "Doctors", count: doctorsCount, color: "#2563eb", percent: Math.round((doctorsCount / (totalStaffCount || 1)) * 100) },
    { name: "Nurses", count: nurseCount, color: "#10b981", percent: Math.round((nurseCount / (totalStaffCount || 1)) * 100) },
    { name: "Pharmacists", count: pharmaCount, color: "#8b5cf6", percent: Math.round((pharmaCount / (totalStaffCount || 1)) * 100) },
    { name: "Lab Technicians", count: labCount, color: "#f59e0b", percent: Math.round((labCount / (totalStaffCount || 1)) * 100) },
    { name: "Receptionists", count: recepCount, color: "#ec4899", percent: Math.round((recepCount / (totalStaffCount || 1)) * 100) },
    { name: "Others", count: Math.max(0, totalStaffCount - doctorsCount - nurseCount - pharmaCount - labCount - recepCount), color: "#64748b", percent: Math.round((Math.max(0, totalStaffCount - doctorsCount - nurseCount - pharmaCount - labCount - recepCount) / (totalStaffCount || 1)) * 100) }
  ];

  const filteredStaff = staffUsers.filter(staff => {
    const matchesSearch = 
      (staff.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (staff.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (staff.mobile_no || "").includes(searchQuery) ||
      (staff.department || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    if (roleFilter === "All") return matchesSearch;
    return matchesSearch && staff.roles?.includes(roleFilter);
  });

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto pb-12 animate-in fade-in duration-300 font-sans text-slate-800">
      
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl shadow-xl border text-xs font-semibold animate-in slide-in-from-top-2 duration-200
              ${t.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : ""}
              ${t.type === "error" ? "bg-rose-50 text-rose-800 border-rose-200" : ""}
              ${t.type === "info" ? "bg-blue-50 text-blue-800 border-blue-200" : ""}`}
          >
            {t.type === "success" && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
            {t.type === "error" && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
            {t.type === "info" && <Info className="w-4 h-4 text-blue-500 shrink-0" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* HEADER SECTION (Matching exact UI layout from photo) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hospital Admin Dashboard</h1>
            <CheckCircle className="w-5 h-5 text-blue-600 fill-blue-100" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Manage hospital operations, staff, roles, and system configuration
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs text-xs font-semibold text-slate-800">
            <span>{formattedToday}</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>

          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-9 px-4 text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add New Staff
          </Button>
        </div>
      </div>

      {/* TOP ROW: 6 METRIC CARDS (Interactive clickable filters with smooth scroll) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Total Staff */}
        <Card 
          onClick={() => handleMetricCardClick('All')}
          className="border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all bg-white rounded-2xl cursor-pointer group active:scale-98 select-none"
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 group-hover:text-blue-600 transition-colors">Total Staff</p>
              <h3 className="text-xl font-bold text-slate-900 leading-tight">{totalStaffCount}</h3>
              <p className="text-[10px] font-semibold text-emerald-600 mt-0.5 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> 12% <span className="text-slate-400 font-normal">from last month</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Doctors */}
        <Card 
          onClick={() => handleMetricCardClick('Doctor')}
          className="border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-400 transition-all bg-white rounded-2xl cursor-pointer group active:scale-98 select-none"
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 group-hover:text-blue-600 transition-colors">Doctors</p>
              <h3 className="text-xl font-bold text-slate-900 leading-tight">{doctorsCount}</h3>
              <p className="text-[10px] font-semibold text-emerald-600 mt-0.5 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> 8% <span className="text-slate-400 font-normal">from last month</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pharmacists */}
        <Card 
          onClick={() => handleMetricCardClick('Pharmacist')}
          className="border-slate-200/90 shadow-2xs hover:shadow-md hover:border-purple-400 transition-all bg-white rounded-2xl cursor-pointer group active:scale-98 select-none"
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 group-hover:text-purple-600 transition-colors">Pharmacists</p>
              <h3 className="text-xl font-bold text-slate-900 leading-tight">{pharmaCount}</h3>
              <p className="text-[10px] font-semibold text-emerald-600 mt-0.5 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> 5% <span className="text-slate-400 font-normal">from last month</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Lab Technicians */}
        <Card 
          onClick={() => handleMetricCardClick('Lab Technician')}
          className="border-slate-200/90 shadow-2xs hover:shadow-md hover:border-amber-400 transition-all bg-white rounded-2xl cursor-pointer group active:scale-98 select-none"
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 group-hover:text-amber-600 transition-colors">Lab Technicians</p>
              <h3 className="text-xl font-bold text-slate-900 leading-tight">{labCount}</h3>
              <p className="text-[10px] font-semibold text-emerald-600 mt-0.5 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> 7% <span className="text-slate-400 font-normal">from last month</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Nurses */}
        <Card 
          onClick={() => handleMetricCardClick('Nurse')}
          className="border-slate-200/90 shadow-2xs hover:shadow-md hover:border-rose-400 transition-all bg-white rounded-2xl cursor-pointer group active:scale-98 select-none"
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <UserRoundCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 group-hover:text-rose-600 transition-colors">Nurses</p>
              <h3 className="text-xl font-bold text-slate-900 leading-tight">{nurseCount}</h3>
              <p className="text-[10px] font-semibold text-emerald-600 mt-0.5 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> 10% <span className="text-slate-400 font-normal">from last month</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Departments */}
        <Card 
          onClick={() => handleMetricCardClick('Departments')}
          className="border-slate-200/90 shadow-2xs hover:shadow-md hover:border-teal-400 transition-all bg-white rounded-2xl cursor-pointer group active:scale-98 select-none"
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 group-hover:text-teal-600 transition-colors">Departments</p>
              <h3 className="text-xl font-bold text-slate-900 leading-tight">{deptCount}</h3>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                No change
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MIDDLE ROW: 3 COLUMNS GRID (Donut Chart, Department Bars, Recent Activities - Pixel-perfect equal height) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Column 1 (4/12): Staff Distribution by Role (Donut Chart) */}
        <Card className="lg:col-span-4 border-slate-200/90 shadow-2xs bg-white rounded-2xl flex flex-col justify-between h-[390px]">
          <CardHeader className="pb-2 pt-4 px-5 border-b border-slate-100 flex flex-row items-center justify-between shrink-0">
            <CardTitle className="text-sm font-bold text-slate-900">Staff Distribution by Role</CardTitle>
            <select 
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="this-month">This Month ({currentMonthName})</option>
              <option value="last-month">Last Month ({lastMonthName})</option>
              <option value="all-time">All Time</option>
            </select>
          </CardHeader>

          <CardContent className="p-5 flex items-center justify-between gap-4 flex-1">
            {/* Donut Visual */}
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {(() => {
                  let cumulative = 0;
                  return roleDistribution.map((item) => {
                    if (!item.count || item.percent <= 0) return null;
                    const strokeDash = `${item.percent} ${100 - item.percent}`;
                    const strokeOffset = -cumulative;
                    cumulative += item.percent;
                    return (
                      <path
                        key={item.name}
                        stroke={item.color}
                        strokeDasharray={strokeDash}
                        strokeDashoffset={strokeOffset}
                        strokeWidth="4.5"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        className="transition-all duration-500"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-extrabold text-slate-900 leading-tight">{totalStaffCount}</span>
                <span className="text-[10px] font-semibold text-slate-400">Total Staff</span>
              </div>
            </div>

            {/* Role Legend List */}
            <div className="flex-1 space-y-1.5 text-xs">
              {roleDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 font-medium text-[11px]">{item.name}</span>
                  </div>
                  <span className="font-semibold text-slate-800 text-[11px]">{item.count} ({item.percent}%)</span>
                </div>
              ))}
            </div>
          </CardContent>

          {/* Bottom Card Footer */}
          <div className="px-5 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium shrink-0 rounded-b-2xl">
            <span>6 Primary Hospital Roles</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live Calculated
            </span>
          </div>
        </Card>

        {/* Column 2 (4/12): Department Wise Staff (Horizontal Bars with Scroll) */}
        <Card ref={deptSectionRef} className="lg:col-span-4 border-slate-200/90 shadow-2xs bg-white rounded-2xl flex flex-col justify-between h-[390px] scroll-mt-24">
          <CardHeader className="pb-2 pt-4 px-5 border-b border-slate-100 flex flex-row items-center justify-between shrink-0">
            <CardTitle className="text-sm font-bold text-slate-900">Department Wise Staff</CardTitle>
            <select 
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="this-month">This Month ({currentMonthName})</option>
              <option value="last-month">Last Month ({lastMonthName})</option>
              <option value="all-time">All Time</option>
            </select>
          </CardHeader>

          <CardContent className="p-5 space-y-3 flex-1 overflow-y-auto">
            {deptDistribution.map((dept) => (
              <div key={dept.name} className="space-y-1">
                <div className="flex justify-between text-[11px] font-medium text-slate-700">
                  <span>{dept.name}</span>
                  <span className="font-bold text-slate-900">{dept.count}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${dept.color}`} 
                    style={{ width: `${Math.min(100, Math.max(15, (dept.count / maxDeptCount) * 100))}%` }} 
                  />
                </div>
              </div>
            ))}
          </CardContent>

          {/* Bottom Card Footer */}
          <div className="px-5 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium shrink-0 rounded-b-2xl">
            <span>Showing {deptDistribution.length} Active Departments</span>
            <span className="font-semibold text-blue-600">Top Allocated</span>
          </div>
        </Card>
        {/* Column 3 (4/12): Recent System Activities (Equal Height h-[390px]) */}
        <Card className="lg:col-span-4 border-slate-200/90 shadow-2xs bg-white rounded-2xl flex flex-col justify-between h-[390px] overflow-hidden">
          <CardHeader className="pb-2.5 pt-4 px-5 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50 shrink-0">
            <CardTitle className="text-sm font-bold text-slate-900">Recent System Activities</CardTitle>
            <button 
              onClick={() => setIsActivitiesModalOpen(true)}
              className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              View All
            </button>
          </CardHeader>

          <CardContent className="p-4 space-y-3 flex-1 overflow-y-auto">
            {activities.slice(0, 6).map((act) => (
              <div key={act.id} className="flex items-start justify-between gap-3 pb-2.5 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="flex items-start gap-2.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center border text-xs shrink-0 mt-0.5 ${
                    act.desc.includes("Doctor") ? "bg-blue-50 text-blue-600 border-blue-200" :
                    act.desc.includes("Pharmacist") ? "bg-purple-50 text-purple-600 border-purple-200" :
                    act.desc.includes("Lab Technician") ? "bg-amber-50 text-amber-600 border-amber-200" :
                    act.desc.includes("Nurse") ? "bg-rose-50 text-rose-600 border-rose-200" :
                    act.desc.includes("Admin") ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                    act.color
                  }`}>
                    {act.desc.includes("Doctor") ? <Stethoscope className="w-3.5 h-3.5" /> :
                     act.desc.includes("Pharmacist") ? <Pill className="w-3.5 h-3.5" /> :
                     act.desc.includes("Lab Technician") ? <FlaskConical className="w-3.5 h-3.5" /> :
                     act.desc.includes("Nurse") ? <UserRoundCheck className="w-3.5 h-3.5" /> :
                     act.desc.includes("Admin") ? <ShieldCheck className="w-3.5 h-3.5" /> :
                     act.type === "role" ? <KeyRound className="w-3.5 h-3.5" /> :
                     act.type === "dept" ? <Building2 className="w-3.5 h-3.5" /> :
                     <UserPlus className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 leading-tight">{act.title}</div>
                    <div className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">{act.desc}</div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 font-semibold whitespace-nowrap shrink-0 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {act.time}
                </div>
              </div>
            ))}
          </CardContent>

          {/* Bottom Card Footer */}
          <div className="px-5 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium shrink-0 rounded-b-2xl">
            <span>Real-time Audit Logs</span>
            <span className="font-semibold text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Auto Logged
            </span>
          </div>
        </Card>

      </div>

      {/* BOTTOM ROW: 2 COLUMNS GRID (Recent Staff Members Table + Quick Actions Grid - Dynamic height fitting) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column (8/12): Recent Staff Members Table */}
        <Card ref={staffTableRef} className="lg:col-span-8 border-slate-200/90 shadow-2xs bg-white rounded-2xl overflow-hidden scroll-mt-24">
          
          {/* Table Search & Header Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">Recent Staff Members</CardTitle>
              <CardDescription className="text-xs text-slate-500">Official hospital employee registry and status</CardDescription>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-52">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <Input
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 text-xs h-8 bg-white border-slate-200 rounded-lg"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-8 text-xs bg-white border border-slate-200 rounded-lg px-2 text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All">All Roles</option>
                {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <CardContent className="p-0 overflow-x-auto overflow-y-auto max-h-[340px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 shadow-2xs">
                <tr className="border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 bg-slate-50">Staff Member</th>
                  <th className="py-3 px-3 bg-slate-50">Role</th>
                  <th className="py-3 px-3 bg-slate-50">Department</th>
                  <th className="py-3 px-3 bg-slate-50">Email</th>
                  <th className="py-3 px-3 bg-slate-50">Status</th>
                  <th className="py-3 px-3 bg-slate-50">Joined On</th>
                  <th className="py-3 px-4 text-right bg-slate-50">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                      No staff members found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff) => {
                    let roleBadge = "bg-blue-50 text-blue-700 border-blue-200/80";
                    if (staff.roles?.includes("Doctor")) roleBadge = "bg-blue-50 text-blue-700 border-blue-200/80 font-bold";
                    else if (staff.roles?.includes("Nurse")) roleBadge = "bg-rose-50 text-rose-700 border-rose-200/80 font-bold";
                    else if (staff.roles?.includes("Pharmacist")) roleBadge = "bg-amber-50 text-amber-800 border-amber-200/80 font-bold";
                    else if (staff.roles?.includes("Lab Technician")) roleBadge = "bg-emerald-50 text-emerald-700 border-emerald-200/80 font-bold";
                    else if (staff.roles?.includes("Receptionist")) roleBadge = "bg-purple-50 text-purple-700 border-purple-200/80 font-bold";

                    const initials = (staff.full_name || staff.email || "US").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

                    return (
                      <tr key={staff.id || staff.email} className="hover:bg-slate-50/50 transition-colors">
                        {/* Member */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                              {initials}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{staff.full_name}</div>
                              <div className="text-[10px] text-slate-400 font-medium">{staff.designation || (staff.roles ? staff.roles[0] : "Staff")}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] ${roleBadge}`}>
                            {staff.roles ? staff.roles[0] : "Staff"}
                          </span>
                        </td>

                        {/* Department */}
                        <td className="py-3 px-3 text-slate-600 font-medium">
                          {staff.department || "General Medicine"}
                        </td>

                        {/* Email */}
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                          {staff.email}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        </td>

                        {/* Joined On */}
                        <td className="py-3 px-3 text-slate-400 text-[11px]">
                          {staff.creation ? new Date(staff.creation).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : formattedToday}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleViewStaffProfile(staff)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="View Full Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditStaffProfile(staff)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Staff Profile"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setStaffToReset(staff);
                                setResetNewPassword("");
                                setResetConfirmPassword("");
                                setIsResetModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Reset Staff Password"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            {(isHospitalAdmin || user?.roles?.includes('Hospital Admin') || user?.permissions?.includes('*')) && (
                              <button
                                onClick={() => {
                                  setStaffToDelete(staff);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Staff Member (Admin Only)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Right Column (4/12): Quick Actions (Separated Role vs Permission Modals) */}
        <Card className="lg:col-span-4 border-slate-200/90 shadow-2xs bg-white rounded-2xl flex flex-col justify-between overflow-hidden">
          <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Quick Governance Actions</span>
            </CardTitle>
            <CardDescription className="text-[11px] text-slate-500">Fast shortcuts for staff creation & security control</CardDescription>
          </CardHeader>

          <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-start">
            
            {/* 1. Add New Staff */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/90 bg-gradient-to-r from-blue-50/60 to-white hover:border-blue-400 hover:shadow-md transition-all group cursor-pointer text-left w-full"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700">Add New Staff User</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Create credentials & link doctor profile</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* 2. Assign Role (Opens Role Assignment View) */}
            <button
              onClick={() => handleOpenRoleModal()}
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/90 bg-gradient-to-r from-amber-50/60 to-white hover:border-amber-400 hover:shadow-md transition-all group cursor-pointer text-left w-full"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-700">Assign Roles to Staff</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Doctor, Pharmacist, Lab Tech, Nurse</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* 3. Manage Permissions (Opens Page Access Control View) */}
            <button
              onClick={() => handleOpenPermissionModal()}
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/90 bg-gradient-to-r from-emerald-50/60 to-white hover:border-emerald-400 hover:shadow-md transition-all group cursor-pointer text-left w-full"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">Manage Page Permissions</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Control module & page access rights</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

          </CardContent>
        </Card>

      </div>

      {/* Modal: Add New Staff Member */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">Add New Staff User</h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold text-slate-700 mb-1 block">Full Name *</Label>
                  <Input
                    placeholder="e.g. Dr. Ramesh Kumar"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="text-xs h-9"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700 mb-1 block">Primary Role *</Label>
                  <select
                    value={primaryRole}
                    onChange={(e) => setPrimaryRole(e.target.value)}
                    className="w-full h-9 text-xs border border-slate-300 rounded-md px-3 bg-white font-medium focus:outline-none"
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700 mb-1 block">Email Address (Login ID) *</Label>
                  <Input
                    type="email"
                    placeholder="e.g. ramesh@thangamhospital.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="text-xs h-9"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700 mb-1 block">Mobile Number *</Label>
                  <Input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="text-xs h-9"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700 mb-1 block">Department</Label>
                  <Input
                    placeholder="e.g. Cardiology, Pharmacy"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700 mb-1 block">Login Password *</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 6 chars"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="text-xs h-9 pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {primaryRole === "Doctor" && (
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-3 mt-2">
                  <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    Doctor Clinical Registry Settings
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-700">Qualifications</Label>
                      <Input
                        placeholder="MBBS, MD, MS"
                        value={qualifications}
                        onChange={(e) => setQualifications(e.target.value)}
                        className="text-xs h-8 bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-700">Consultation Fee (₹)</Label>
                      <Input
                        type="number"
                        placeholder="500"
                        value={consultationFee}
                        onChange={(e) => setConsultationFee(e.target.value)}
                        className="text-xs h-8 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 px-5 shadow-md cursor-pointer"
                >
                  {isSaving ? "Saving User..." : "Create Staff Account"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Governance Console (Separated Role Assignment vs Page Permissions Tabs) */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {activeGovernanceTab === "roles" ? <ShieldCheck className="w-5 h-5 text-amber-400" /> : <KeyRound className="w-5 h-5 text-emerald-400" />}
                <div>
                  <h3 className="font-bold text-base">
                    {activeGovernanceTab === "roles" ? "Assign Hospital Roles" : "Manage Page Access Permissions"}
                  </h3>
                  <p className="text-[11px] text-slate-300">{selectedUser.full_name} ({selectedUser.email})</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs Header */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
              <button
                type="button"
                onClick={() => setActiveGovernanceTab("roles")}
                className={`pb-2 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  activeGovernanceTab === "roles" ? "border-amber-500 text-amber-700" : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                Assign Roles (Doctor, Nurse, etc.)
              </button>
              <button
                type="button"
                onClick={() => setActiveGovernanceTab("permissions")}
                className={`pb-2 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  activeGovernanceTab === "permissions" ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                Page Permissions (Doctor Consultations, etc.)
              </button>
            </div>

            <form onSubmit={handleSaveRolesPermissions} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              
              {/* Searchable Target Staff User Selector */}
              <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Search & Select Staff Member to Configure
                  </Label>
                  <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    Active: {selectedUser?.full_name}
                  </span>
                </div>

                {/* Search Bar Input */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <Input
                    placeholder="Type name, email, or role to search staff..."
                    value={modalSearchQuery}
                    onChange={(e) => {
                      setModalSearchQuery(e.target.value);
                      setIsStaffDropdownOpen(true);
                    }}
                    onFocus={() => setIsStaffDropdownOpen(true)}
                    className="pl-9 pr-8 text-xs h-9 bg-white border-slate-300 font-semibold text-slate-900 focus:ring-1 focus:ring-blue-500 rounded-xl"
                  />
                  {modalSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setModalSearchQuery("")}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Filtered Search Results Dropdown List */}
                {isStaffDropdownOpen && (
                  <div className="max-h-44 overflow-y-auto border border-slate-200 bg-white rounded-xl shadow-xl divide-y divide-slate-100 mt-1 animate-in fade-in duration-150">
                    {staffUsers.filter(s => 
                      (s.full_name || "").toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
                      (s.email || "").toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
                      (s.roles || []).some(r => r.toLowerCase().includes(modalSearchQuery.toLowerCase()))
                    ).length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400 font-medium">No matching staff member found.</div>
                    ) : (
                      staffUsers.filter(s => 
                        (s.full_name || "").toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
                        (s.email || "").toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
                        (s.roles || []).some(r => r.toLowerCase().includes(modalSearchQuery.toLowerCase()))
                      ).map((s) => {
                        const isSelected = selectedUser?.email === s.email;
                        return (
                          <div
                            key={s.email}
                            onClick={() => {
                              handleOpenEdit(s);
                              setIsStaffDropdownOpen(false);
                              setModalSearchQuery("");
                            }}
                            className={`p-2.5 hover:bg-blue-50/80 cursor-pointer flex items-center justify-between transition-colors ${isSelected ? "bg-blue-50 font-bold" : ""}`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                                {(s.full_name || s.email || "U").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-xs text-slate-900 font-bold">{s.full_name}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{s.email}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                                {s.roles ? s.roles[0] : "Staff"}
                              </span>
                              {isSelected && <Check className="w-4 h-4 text-blue-600 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Roles Selection (Shown when activeGovernanceTab === "roles") */}
              {activeGovernanceTab === "roles" && (
                <div>
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    Assign Hospital Roles (Multiple Selectable)
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ALL_ROLES.map((r) => {
                      const isChecked = editRoles.includes(r);
                      return (
                        <div
                          key={r}
                          onClick={() => handleRoleToggle(r)}
                          className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-center justify-between select-none ${
                            isChecked 
                              ? "bg-amber-50 border-amber-400 text-amber-900 shadow-2xs" 
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <span>{r}</span>
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${isChecked ? "bg-amber-500 border-amber-500 text-white" : "border-slate-300"}`}>
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Granular Page Permissions (Shown when activeGovernanceTab === "permissions") */}
              {activeGovernanceTab === "permissions" && (
                <div>
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    Granular Page & Module Access Permissions
                  </Label>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {PERMISSION_OPTIONS.map((p) => {
                      const isChecked = editPermissions.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => handlePermissionToggle(p.id)}
                          className={`p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-all flex items-center justify-between select-none ${
                            isChecked 
                              ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold" 
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <span>{p.label}</span>
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${isChecked ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300"}`}>
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 px-5 shadow-md cursor-pointer"
                >
                  {isSaving ? "Saving..." : "Save Configuration"}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal: View Staff Member Profile */}
      {isProfileViewOpen && viewingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                  {(viewingStaff.full_name || viewingStaff.email || "US").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">{viewingStaff.full_name}</h3>
                  <p className="text-[11px] text-slate-300">{viewingStaff.designation || (viewingStaff.roles ? viewingStaff.roles[0] : "Staff Member")}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsProfileViewOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Email Address</div>
                  <div className="font-semibold text-slate-800 break-all">{viewingStaff.email}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Mobile Number</div>
                  <div className="font-semibold text-slate-800">{viewingStaff.mobile_no || "N/A"}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Department</div>
                  <div className="font-semibold text-slate-800">{viewingStaff.department || "General Medicine"}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Status</div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Assigned Roles
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {(viewingStaff.roles || [viewingStaff.designation || "Staff"]).map(role => (
                    <span key={role} className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-bold border border-blue-200 text-[11px]">
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Granted Page Access Rights
                </Label>
                <div className="space-y-1">
                  {(viewingStaff.permissions || []).length === 0 ? (
                    <div className="text-slate-400 italic">No granular permissions assigned.</div>
                  ) : (
                    (viewingStaff.permissions || []).map(perm => (
                      <div key={perm} className="flex items-center gap-2 p-1.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-emerald-900 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{perm}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end">
                <Button
                  onClick={() => setIsProfileViewOpen(false)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8 px-4"
                >
                  Close Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Staff Member Profile */}
      {isProfileEditOpen && editingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Edit Staff Profile ({editingStaff.email})</h3>
              </div>
              <button 
                onClick={() => setIsProfileEditOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStaffProfile} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold text-slate-700 mb-1 block">Full Name</Label>
                  <Input
                    value={editStaffName}
                    onChange={(e) => setEditStaffName(e.target.value)}
                    required
                    className="text-xs h-9"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700 mb-1 block">Designation</Label>
                  <Input
                    value={editStaffDesignation}
                    onChange={(e) => setEditStaffDesignation(e.target.value)}
                    required
                    className="text-xs h-9"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700 mb-1 block">Department</Label>
                  <Input
                    value={editStaffDepartment}
                    onChange={(e) => setEditStaffDepartment(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700 mb-1 block">Mobile Number</Label>
                  <Input
                    value={editStaffMobile}
                    onChange={(e) => setEditStaffMobile(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700 mb-1 block">Account Status</Label>
                  <select
                    value={editStaffStatus}
                    onChange={(e) => setEditStaffStatus(e.target.value)}
                    className="w-full h-9 text-xs border border-slate-300 rounded-md px-3 bg-white font-medium focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700 mb-1 block">Reset Password (Optional)</Label>
                  <Input
                    type="password"
                    placeholder="Leave blank to keep same"
                    value={editStaffPassword}
                    onChange={(e) => setEditStaffPassword(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsProfileEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-9 px-5 shadow-md cursor-pointer"
                >
                  {isSaving ? "Saving..." : "Update Staff Profile"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: All Recent System Activities Audit Log */}
      {isActivitiesModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Full System Activities Audit Log</h3>
              </div>
              <button 
                onClick={() => setIsActivitiesModalOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] flex flex-col">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <Input
                  placeholder="Search activity by title, user, or role..."
                  value={activitySearchQuery}
                  onChange={(e) => setActivitySearchQuery(e.target.value)}
                  className="pl-9 text-xs h-9 bg-slate-50 border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[400px]">
                {activities.filter(act => 
                  act.title.toLowerCase().includes(activitySearchQuery.toLowerCase()) ||
                  act.desc.toLowerCase().includes(activitySearchQuery.toLowerCase())
                ).map((act) => (
                  <div key={act.id} className="flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border text-xs shrink-0 mt-0.5 ${
                        act.desc.includes("Doctor") ? "bg-blue-50 text-blue-600 border-blue-200" :
                        act.desc.includes("Pharmacist") ? "bg-purple-50 text-purple-600 border-purple-200" :
                        act.desc.includes("Lab Technician") ? "bg-amber-50 text-amber-600 border-amber-200" :
                        act.desc.includes("Nurse") ? "bg-rose-50 text-rose-600 border-rose-200" :
                        act.desc.includes("Admin") ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                        act.color
                      }`}>
                        {act.desc.includes("Doctor") ? <Stethoscope className="w-4 h-4" /> :
                         act.desc.includes("Pharmacist") ? <Pill className="w-4 h-4" /> :
                         act.desc.includes("Lab Technician") ? <FlaskConical className="w-4 h-4" /> :
                         act.desc.includes("Nurse") ? <UserRoundCheck className="w-4 h-4" /> :
                         act.desc.includes("Admin") ? <ShieldCheck className="w-4 h-4" /> :
                         <UserPlus className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{act.title}</div>
                        <div className="text-xs text-slate-600 font-medium mt-0.5">{act.desc}</div>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 font-semibold whitespace-nowrap shrink-0 flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {act.time}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t flex justify-end">
                <Button
                  onClick={() => setIsActivitiesModalOpen(false)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8 px-4"
                >
                  Close Audit Log
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Staff Confirmation Modal (Admin Only) */}
      {isDeleteModalOpen && staffToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200/80 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Staff Member</h3>
                <p className="text-xs text-red-600 font-semibold">Admin Confirmation Required</p>
              </div>
            </div>

            <div className="bg-red-50/70 border border-red-200/80 rounded-xl p-4 mb-5">
              <p className="text-xs text-slate-800 leading-relaxed font-semibold mb-2">
                Are you sure you want to delete <strong className="text-red-900 font-bold underline">{staffToDelete.full_name}</strong> ({staffToDelete.email || staffToDelete.mobile_no})?
              </p>
              <ul className="text-[11px] text-red-700 space-y-1.5 list-disc pl-4 font-medium">
                <li>All login credentials and mobile/email login access will be permanently deleted.</li>
                <li>All system roles and module permissions will be revoked immediately.</li>
                <li>This action cannot be undone.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setStaffToDelete(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteStaff}
                disabled={isDeleting}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Staff Member</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 8. Reset Staff Password Modal */}
      {isResetModalOpen && staffToReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reset Staff Password</h3>
                  <p className="text-xs text-slate-500 font-medium">Update login password for {staffToReset.full_name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsResetModalOpen(false);
                  setStaffToReset(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecutePasswordReset} className="space-y-4">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs space-y-1">
                <p className="text-slate-900 font-bold">{staffToReset.full_name}</p>
                <p className="text-slate-500 font-medium">
                  {staffToReset.email || 'No email'} • Mobile: <strong className="text-slate-800">{staffToReset.mobile_no || 'N/A'}</strong>
                </p>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700">
                    {staffToReset.roles ? staffToReset.roles[0] : (staffToReset.designation || 'Staff')}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700">
                    {staffToReset.department || 'General Medicine'}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700 mb-1.5 block">New Password *</Label>
                <div className="relative">
                  <Input
                    type={showResetPassword ? "text" : "password"}
                    required
                    placeholder="Enter new strong password"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    className="pr-10 text-xs py-2 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Confirm New Password *</Label>
                <Input
                  type={showResetPassword ? "text" : "password"}
                  required
                  placeholder="Re-enter new password to confirm"
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  className="text-xs py-2 rounded-xl"
                />
              </div>

              <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 text-[11px] text-amber-800 font-medium flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Updating this password will immediately invalidate the staff member's old password across all devices.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetModalOpen(false);
                    setStaffToReset(null);
                  }}
                  disabled={isResettingPassword}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isResettingPassword}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isResettingPassword ? (
                    <span>Updating Password...</span>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Save & Apply New Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
