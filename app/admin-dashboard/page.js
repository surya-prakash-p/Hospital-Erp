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
  Eye, 
  EyeOff, 
  Calendar, 
  Plus,
  AlertTriangle,
  Trash2,
  IdCard,
  Loader2,
  Sparkles
} from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { getStaffUsers, createStaffUser, updateUserRolesAndPermissions, deleteStaffUser } from "@/lib/hospital-service";
import { generateNextEmployeeId, validateEmployeeIdFormat } from "@/lib/employee-id";

const ALL_ROLES = [
  "Hospital Admin",
  "Doctor",
  "Pharmacist",
  "Nurse",
  "Receptionist",
  "Billing Clerk"
];

const ROLE_DEFINITIONS = [
  { role: "Hospital Admin", icon: ShieldCheck, desc: "Full administrative authority, security governance & system configuration" },
  { role: "Doctor", icon: Stethoscope, desc: "Doctor consultation queue, clinical diagnosis, prescriptions & medical review" },
  { role: "Pharmacist", icon: Pill, desc: "Pharmacy dispensing, batch inventory, FEFO tracking & stock registers" },
  { role: "Nurse", icon: UserRoundCheck, desc: "Inpatient triage, vital checks, ward management & nursing assistance" },
  { role: "Receptionist", icon: Building2, desc: "Front desk patient registration, appointment scheduling & queue tokens" },
  { role: "Billing Clerk", icon: KeyRound, desc: "Patient cashier checkout, billing invoices, receipts & finance ledger" }
];

const PERMISSION_OPTIONS = [
  { id: "Doctor Consultations", label: "Doctor Consultations & Queues", desc: "Access doctor consultation workflow, queue list, and patient records" },
  { id: "Write Prescriptions", label: "Issue Medical Prescriptions", desc: "Create and authorize digital patient drug prescriptions" },
  { id: "Dispense Medicines", label: "Pharmacy Dispensing & FEFO", desc: "Dispense prescribed medications and deduct batch inventory" },
  { id: "Manage Pharmacy Stock", label: "Pharmacy Stock & GRN Import", desc: "Manage medicine master, purchase orders, and goods receipts" },
  { id: "Register Patients", label: "Patient Registration & Walk-Ins", desc: "Register new patients, edit demographics, and create reception walk-ins" },
  { id: "Manage Invoices", label: "Billing, Receipts & Invoicing", desc: "Generate patient bills, cashier receipts, and manage checkout payments" },
  { id: "View Financials", label: "Financial Ledger & Reports", desc: "Access hospital financial ledger, revenue summaries, and expense entries" },
  { id: "Audit Logs", label: "View Hospital Audit & Access Logs", desc: "Access multi-device security audit logs and staff activity records" },
  { id: "Manage Roles & Staff", label: "Manage Hospital Roles & Permissions", desc: "Assign staff roles, grant granular permissions, and manage credentials" },
  { id: "Full System Access", label: "Full System Super-Admin Privileges", desc: "Unrestricted master access across all clinical, financial, and admin modules" }
];

const ROLE_DEFAULT_PERMISSIONS = {
  "Hospital Admin": ["Doctor Consultations", "Write Prescriptions", "Dispense Medicines", "Manage Pharmacy Stock", "Register Patients", "Manage Invoices", "View Financials", "Audit Logs", "Manage Roles & Staff", "Full System Access"],
  "Doctor": ["Doctor Consultations", "Write Prescriptions"],
  "Pharmacist": ["Dispense Medicines", "Manage Pharmacy Stock"],
  "Nurse": ["Doctor Consultations", "Register Patients"],
  "Receptionist": ["Register Patients"],
  "Billing Clerk": ["Manage Invoices", "View Financials"]
};

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const isHospitalAdmin = Boolean(user?.roles?.includes('Hospital Admin') || user?.permissions?.includes('*') || user?.roles?.includes('Admin'));
  const [staffUsers, setStaffUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // DOM Ref for smooth scrolling
  const staffTableRef = React.useRef(null);

  // Live Today's Date Calculation
  const today = new Date();
  const formattedToday = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const handleMetricCardClick = (targetRole) => {
    setRoleFilter(targetRole);
    staffTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast(`Filtering staff: ${targetRole === 'All' ? 'All Staff Members' : targetRole}`, "info");
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
  const [editStaffEmail, setEditStaffEmail] = useState("");
  const [editStaffDesignation, setEditStaffDesignation] = useState("");
  const [editStaffDepartment, setEditStaffDepartment] = useState("");
  const [editStaffMobile, setEditStaffMobile] = useState("");
  const [editStaffStatus, setEditStaffStatus] = useState("Active");
  const [editStaffJoinedDate, setEditStaffJoinedDate] = useState("");
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
  const [joinedDate, setJoinedDate] = useState(() => new Date().toISOString().split('T')[0]);
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

  // Edit Employee ID Modal State (Admin Only)
  const [isEditEmpIdModalOpen, setIsEditEmpIdModalOpen] = useState(false);
  const [staffToEditEmpId, setStaffToEditEmpId] = useState(null);
  const [newEmpIdInput, setNewEmpIdInput] = useState("");
  const [isSavingEmpId, setIsSavingEmpId] = useState(false);

  const handleSaveEmployeeId = async (e) => {
    e.preventDefault();
    if (!staffToEditEmpId) return;
    const cleanId = newEmpIdInput.trim().toUpperCase();

    if (!validateEmployeeIdFormat(cleanId)) {
      showToast("Employee ID format must start with TH (e.g. TH001)", "error");
      return;
    }

    setIsSavingEmpId(true);
    try {
      const res = await fetch('/api/users/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: staffToEditEmpId.id,
          email: staffToEditEmpId.email,
          employeeId: cleanId,
          employee_id: cleanId
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to change Employee ID");
      }

      showToast(`Successfully updated Employee ID to ${cleanId}!`, "success");
      setIsEditEmpIdModalOpen(false);
      setStaffToEditEmpId(null);
      await loadData();
    } catch (err) {
      showToast(err.message || "Failed to update Employee ID", "error");
    } finally {
      setIsSavingEmpId(false);
    }
  };

  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const getStaffJoinDate = (staff) => {
    if (!staff) return "-";
    const raw = staff.joined_date || staff.date_of_joining || staff.createdAt || staff.creation || staff.updatedAt;
    if (!raw) return "-";
    try {
      if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        const [y, m, d] = raw.split('-');
        const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
        return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      const d = new Date(raw);
      if (isNaN(d.getTime())) return String(raw);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return String(raw);
    }
  };

  const addSystemActivityLog = (title, desc, type = "user") => {
    fetch('/api/logs/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: type === "user" || type === "role" || type === "profile" ? "user_mgmt" : "system",
        action: title,
        description: desc,
        actor: user ? {
          employeeId: user.employeeId || user.id || "TH001",
          name: user.full_name || user.name || "Hospital Admin",
          role: user.role || "Hospital Admin",
          email: user.email || ""
        } : null,
        target: desc,
        metadata: { category: type }
      })
    }).catch(() => null);
  };

  async function loadDataSilently() {
    try {
      const res = await fetch('/api/users/manage', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          setStaffUsers(data.users);
        }
      }
    } catch (e) {}
  }

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch('/api/users/manage', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          setStaffUsers(data.users);
          if (typeof window !== 'undefined') {
            localStorage.setItem('hospital_staff_users', JSON.stringify(data.users));
          }
          return;
        }
      }
      const data = await getStaffUsers();
      if (data && data.length > 0) {
        setStaffUsers(data);
      }
    } catch (e) {
      showToast("Error loading staff directory", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadDataSilently();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !password) {
      showToast("Full Name and Password are required", "error");
      return;
    }

    setIsSaving(true);
    showToast(`Creating ${primaryRole} account and syncing backend...`, "info");

    try {
      const targetDept = primaryRole === "Nurse" ? "Nursing & Wards" : (department.trim() || (primaryRole === "Doctor" ? "General Medicine" : primaryRole === "Pharmacist" ? "Pharmacy" : "General Administration"));
      const validJoinedDate = joinedDate || new Date().toISOString().split('T')[0];
      const newStaff = await createStaffUser({
        full_name: fullName.trim(),
        email: email.trim(),
        mobile_no: phone.trim(),
        password: password,
        role: primaryRole,
        roles: [primaryRole],
        department: targetDept,
        designation: primaryRole,
        qualifications: qualifications.trim(),
        consultation_fee: consultationFee,
        status: "Active",
        joined_date: validJoinedDate,
        date_of_joining: validJoinedDate,
        createdAt: `${validJoinedDate}T08:00:00.000Z`,
        creation: `${validJoinedDate}T08:00:00.000Z`
      });

      addSystemActivityLog("New staff user created", `${newStaff.full_name} (${primaryRole})`, "user");
      showToast(`Successfully created ${newStaff.full_name}! Employee ID: ${newStaff.employeeId || newStaff.employee_id}`, "success");
      setIsAddModalOpen(false);
      
      // Reset Form
      setFullName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setDepartment("General Medicine");
      setQualifications("");
      setJoinedDate(new Date().toISOString().split('T')[0]);
      setStaffUsers(prev => {
        const empId = newStaff.employeeId || newStaff.employee_id;
        const exists = prev.some(u => (u.employeeId || u.employee_id || u.id) === (empId || newStaff.id));
        if (exists) return prev;
        return [newStaff, ...prev];
      });

      await loadData();
    } catch (err) {
      showToast(err.message || "Failed to create staff user", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenGovernanceModal = (staff, tab = "roles") => {
    const target = staff || (staffUsers.length > 0 ? staffUsers[0] : null);
    if (!target) {
      showToast("No staff members available yet", "error");
      return;
    }
    setSelectedUser(target);
    setEditRoles(target.roles || [target.role || "Staff Member"]);
    setEditPermissions(target.permissions || []);
    setActiveGovernanceTab(tab);
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
    setEditStaffName(staff.full_name || staff.name || "");
    setEditStaffEmail(staff.email || "");
    setEditStaffDesignation(staff.designation || (staff.roles ? staff.roles[0] : "Staff"));
    setEditStaffDepartment(staff.department || "General Medicine");
    const rawMob = (staff.mobile_no || staff.mobileNo || staff.phone || "").trim();
    setEditStaffMobile(rawMob.includes("@") ? "" : rawMob);
    setEditStaffStatus(staff.status === "Inactive" || staff.active === false ? "Inactive" : "Active");
    const existingJoin = staff.joined_date || staff.date_of_joining || (staff.createdAt ? staff.createdAt.split('T')[0] : '') || '';
    setEditStaffJoinedDate(existingJoin);
    setEditStaffPassword("");
    setIsProfileEditOpen(true);
  };

  const handleSaveStaffProfile = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    setIsSaving(true);
    try {
      const cleanJoinDate = editStaffJoinedDate.trim() || editingStaff.joined_date || editingStaff.date_of_joining || (editingStaff.createdAt ? editingStaff.createdAt.split('T')[0] : '');
      await createStaffUser({
        id: editingStaff.id,
        email: editStaffEmail.trim() || editingStaff.email,
        full_name: editStaffName,
        mobile_no: editStaffMobile.trim(),
        password: editStaffPassword || undefined,
        roles: editingStaff.roles || [editingStaff.designation || "Staff Member"],
        permissions: editingStaff.permissions || [],
        department: editStaffDepartment,
        designation: editStaffDesignation,
        status: editStaffStatus,
        joined_date: cleanJoinDate,
        date_of_joining: cleanJoinDate,
        createdAt: cleanJoinDate ? `${cleanJoinDate}T08:00:00.000Z` : (editingStaff.createdAt || editingStaff.creation),
        creation: cleanJoinDate ? `${cleanJoinDate}T08:00:00.000Z` : (editingStaff.creation || editingStaff.createdAt)
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
      const identifier = staffToDelete.id || staffToDelete.employeeId || staffToDelete.employee_id || staffToDelete.frappeStaffId || staffToDelete.email || staffToDelete.mobile_no || staffToDelete.full_name;
      await deleteStaffUser(identifier);
      addSystemActivityLog(
        "Staff Member Deleted",
        `${staffToDelete.full_name} (${staffToDelete.roles?.[0] || 'Staff'}) was permanently deleted by Admin`,
        "profile"
      );

      const deletedId = staffToDelete.id;
      const deletedEmpId = staffToDelete.employeeId || staffToDelete.employee_id || staffToDelete.frappeStaffId;
      const deletedEmail = staffToDelete.email;
      const deletedName = staffToDelete.full_name || staffToDelete.name;

      setStaffUsers(prev => prev.filter(u => {
        const uId = u.id;
        const uEmpId = u.employeeId || u.employee_id || u.frappeStaffId;
        const uEmail = u.email;
        const uName = u.full_name || u.name;

        if (deletedId && uId === deletedId) return false;
        if (deletedEmpId && uEmpId === deletedEmpId) return false;
        if (deletedEmail && uEmail && deletedEmail.trim().toLowerCase() === uEmail.trim().toLowerCase()) return false;
        if (deletedName && uName && deletedName.trim().toLowerCase() === uName.trim().toLowerCase()) return false;
        return true;
      }));

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
  const nurseCount = staffUsers.filter(s => s.roles?.includes('Nurse')).length;
  const recepCount = staffUsers.filter(s => s.roles?.includes('Receptionist')).length;

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

      {/* Page Header & Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8.5 h-8.5 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Staff Administration &amp; Governance</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium">Manage hospital personnel roster, clinical credentials, and access permissions</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>{formattedToday}</span>
          </div>

          <Button
            onClick={() => handleOpenGovernanceModal()}
            variant="outline"
            className="bg-white hover:bg-slate-50 text-slate-800 border-slate-300 gap-2 h-9 px-4 text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            Roles &amp; Permissions
          </Button>

          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-9 px-4 text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Staff
          </Button>
        </div>
      </div>

      {/* Role Filter & Metric Strip */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-1.5">
        {[
          { id: 'All', label: 'All Members', count: totalStaffCount, icon: Users },
          { id: 'Doctor', label: 'Doctors', count: doctorsCount, icon: Stethoscope },
          { id: 'Pharmacist', label: 'Pharmacists', count: pharmaCount, icon: Pill },
          { id: 'Nurse', label: 'Nurses', count: nurseCount, icon: UserRoundCheck },
          { id: 'Receptionist', label: 'Receptionists', count: recepCount, icon: Building2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = roleFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleMetricCardClick(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                isActive ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Full-Width Staff Members Directory */}
      <Card ref={staffTableRef} className="border-slate-200/80 shadow-xs bg-white rounded-2xl overflow-hidden scroll-mt-24">
        
        {/* Table Search & Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/40">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold text-slate-900">Hospital Staff Directory</CardTitle>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-full">
                {filteredStaff.length} {filteredStaff.length === 1 ? 'member' : 'members'}
              </span>
            </div>
            <CardDescription className="text-xs text-slate-500 mt-0.5">Active personnel roster, designations, and clinical credentials</CardDescription>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <Input
                placeholder="Search by name, email, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-8.5 bg-white border-slate-200 rounded-xl"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-8.5 text-xs bg-white border border-slate-200 rounded-xl px-2.5 text-slate-700 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All">All Roles</option>
              {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-3">Employee ID</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Joined On</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      <span className="text-xs">Loading staff registry...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 font-medium">
                    No staff members found matching the selected filter.
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
                  const empIdDisplay = staff.employeeId || staff.employee_id || staff.frappeStaffId || "TH-STF-001";
                  const contactMobile = (staff.mobile_no || staff.mobileNo || staff.phone || "").trim();

                  return (
                    <tr key={staff.id || staff.email} className="hover:bg-slate-50/70 transition-colors">
                      {/* Member */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8.5 h-8.5 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0 shadow-2xs">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{staff.full_name}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{staff.designation || (staff.roles ? staff.roles[0] : "Staff")}</div>
                          </div>
                        </div>
                      </td>

                      {/* Employee ID */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-800">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/80">
                            {empIdDisplay}
                          </span>
                          {isHospitalAdmin ? (
                            <button
                              onClick={() => {
                                setStaffToEditEmpId(staff);
                                setNewEmpIdInput(empIdDisplay);
                                setIsEditEmpIdModalOpen(true);
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                              title="Edit Employee ID (Admin Only)"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          ) : (
                            <Lock className="w-3 h-3 text-slate-400" title="Employee ID Locked" />
                          )}
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

                      {/* Contact */}
                      <td className="py-3 px-3">
                        <div className="text-slate-700 font-mono text-[11px]">{staff.email || "—"}</div>
                        {contactMobile && !contactMobile.includes("@") && (
                          <div className="text-[10px] text-slate-400 font-mono">{contactMobile}</div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      </td>

                      {/* Joined On */}
                      <td className="py-3 px-3 text-slate-500 font-medium text-[11px]">
                        {getStaffJoinDate(staff)}
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
                            onClick={() => handleOpenGovernanceModal(staff)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Configure Roles & Permissions"
                          >
                            <ShieldCheck className="w-4 h-4" />
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
        </div>
      </Card>

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
              
              {/* Auto-Generated Employee ID Banner */}
              <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">Server Auto-Generated Employee ID</div>
                  <div className="text-[10px] text-blue-700 font-medium">Reserved sequentially for role ({primaryRole})</div>
                </div>
                <div className="px-3 py-1 bg-white rounded-lg border border-blue-300 text-xs font-mono font-extrabold text-blue-800 flex items-center gap-1.5 shadow-2xs">
                  <IdCard className="w-4 h-4 text-blue-600" />
                  <span>{generateNextEmployeeId(primaryRole, staffUsers, [])}</span>
                </div>
              </div>

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
                  <Label className="text-xs font-bold text-slate-700 mb-1 block">Email Address (Optional)</Label>
                  <Input
                    type="email"
                    placeholder="e.g. ramesh@thangamhospital.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700 mb-1 block">Mobile Number</Label>
                  <Input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>

                {primaryRole !== "Nurse" && (
                  <div>
                    <Label className="text-xs font-bold text-slate-700 mb-1 block">Department</Label>
                    <Input
                      placeholder="e.g. Cardiology, Pharmacy"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>
                )}

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
                
                <div>
                  <Label className="text-xs font-bold text-slate-700 mb-1 block">Joined Date</Label>
                  <Input
                    type="date"
                    value={joinedDate}
                    onChange={(e) => setJoinedDate(e.target.value)}
                    className="text-xs h-9 bg-white"
                  />
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

      {/* Modal: Unified Roles & Access Permissions Governance */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">Staff Roles &amp; Access Permissions</h3>
                  <p className="text-[11px] text-slate-300">
                    Configuring access rights for <span className="text-white font-semibold">{selectedUser.full_name}</span> ({selectedUser.employeeId || selectedUser.employee_id || selectedUser.frappeStaffId || selectedUser.email || "TH-STF-001"})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Staff Member Selector Bar */}
            <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {(selectedUser.full_name || selectedUser.email || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{selectedUser.full_name}</span>
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded">
                        {selectedUser.employeeId || selectedUser.employee_id || selectedUser.frappeStaffId || "TH001"}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {selectedUser.department || "General"} • {selectedUser.email || "No email"}
                    </div>
                  </div>
                </div>

                {/* Search & Switch Staff Button/Input */}
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <Input
                    placeholder="Switch staff member..."
                    value={modalSearchQuery}
                    onChange={(e) => {
                      setModalSearchQuery(e.target.value);
                      setIsStaffDropdownOpen(true);
                    }}
                    onFocus={() => setIsStaffDropdownOpen(true)}
                    className="pl-8 pr-7 text-xs h-8 bg-white border-slate-300 rounded-lg font-medium"
                  />
                  {modalSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setModalSearchQuery("")}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Dropdown Results */}
                  {isStaffDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1 w-72 max-h-48 overflow-y-auto border border-slate-200 bg-white rounded-xl shadow-xl divide-y divide-slate-100 z-50 animate-in fade-in duration-150">
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
                          const isSelected = (selectedUser.id && s.id && selectedUser.id === s.id) || (selectedUser.email && s.email && selectedUser.email === s.email);
                          return (
                            <div
                              key={s.id || s.email}
                              onClick={() => {
                                handleOpenGovernanceModal(s);
                                setIsStaffDropdownOpen(false);
                                setModalSearchQuery("");
                              }}
                              className={`p-2 hover:bg-blue-50/80 cursor-pointer flex items-center justify-between transition-colors ${isSelected ? "bg-blue-50/90 font-bold" : ""}`}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                                  {(s.full_name || s.email || "U").charAt(0).toUpperCase()}
                                </div>
                                <div className="leading-tight">
                                  <div className="text-xs text-slate-900 font-bold">{s.full_name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{s.employeeId || s.email}</div>
                                </div>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3]" />}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Segmented Tabs Navigation */}
            <div className="flex border-b border-slate-200 bg-white px-6 pt-3 gap-2">
              <button
                type="button"
                onClick={() => setActiveGovernanceTab("roles")}
                className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeGovernanceTab === "roles"
                    ? "border-amber-500 text-amber-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>1. Assigned Roles</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                  {editRoles.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveGovernanceTab("permissions")}
                className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeGovernanceTab === "permissions"
                    ? "border-emerald-500 text-emerald-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>2. Page &amp; Module Permissions</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                  {editPermissions.length}
                </span>
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveRolesPermissions} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              
              {/* TAB 1: Roles Selection */}
              {activeGovernanceTab === "roles" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                        Select Hospital Roles
                      </Label>
                      <p className="text-[11px] text-slate-500">Staff member can hold multiple roles simultaneously</p>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {editRoles.length} selected
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {ROLE_DEFINITIONS.map((def) => {
                      const Icon = def.icon;
                      const isChecked = editRoles.includes(def.role);
                      return (
                        <div
                          key={def.role}
                          onClick={() => handleRoleToggle(def.role)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 select-none ${
                            isChecked 
                              ? "bg-amber-50/70 border-amber-400 text-amber-950 shadow-2xs" 
                              : "bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${
                            isChecked ? "bg-amber-500 text-white border-amber-500 shadow-2xs" : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">{def.role}</span>
                              <div className={`w-4 h-4 rounded flex items-center justify-center border ${isChecked ? "bg-amber-500 border-amber-500 text-white" : "border-slate-300"}`}>
                                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-tight mt-1">{def.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: Granular Page Permissions */}
              {activeGovernanceTab === "permissions" && (
                <div className="space-y-3">
                  <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/70">
                    <Label className="text-xs font-bold text-emerald-950 uppercase tracking-wider block">
                      Granular Page Access Rights
                    </Label>
                    <p className="text-[11px] text-emerald-800">Controls menu visibility and action permissions</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PERMISSION_OPTIONS.map((p) => {
                      const isChecked = editPermissions.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => handlePermissionToggle(p.id)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 select-none ${
                            isChecked 
                              ? "bg-emerald-50/80 border-emerald-400 text-emerald-950 shadow-2xs" 
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded flex items-center justify-center border mt-0.5 shrink-0 ${isChecked ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300"}`}>
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 leading-tight">{p.label}</div>
                            <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{p.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-[11px] text-slate-500 font-medium">
                  Configured: <span className="font-bold text-slate-800">{editRoles.length} Roles</span>, <span className="font-bold text-slate-800">{editPermissions.length} Permissions</span>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditModalOpen(false)}
                    className="h-9 px-4 text-xs font-semibold rounded-xl border-slate-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 px-5 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>{isSaving ? "Saving..." : "Save Access Configuration"}</span>
                  </Button>
                </div>
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
                  <div className="font-semibold text-slate-800 break-all">{viewingStaff.email || "N/A"}</div>
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
                <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Joined Date</div>
                  <div className="font-semibold text-slate-700 font-mono text-[11px]">{getStaffJoinDate(viewingStaff)}</div>
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
                  <Label className="text-xs font-bold text-slate-700 mb-1 block">Email Address</Label>
                  <Input
                    type="email"
                    value={editStaffEmail}
                    onChange={(e) => setEditStaffEmail(e.target.value)}
                    required
                    className="text-xs h-9 font-medium"
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
                  <Label className="text-xs font-bold text-slate-700 mb-1 block">Mobile Number (Login Identifier)</Label>
                  <Input
                    type="tel"
                    placeholder="e.g. 9363105887"
                    value={editStaffMobile}
                    onChange={(e) => setEditStaffMobile(e.target.value)}
                    className="text-xs h-9 font-mono"
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
                  <Label className="text-xs font-bold text-slate-700 mb-1 block">Joined Date</Label>
                  <Input
                    type="date"
                    value={editStaffJoinedDate}
                    onChange={(e) => setEditStaffJoinedDate(e.target.value)}
                    className="text-xs h-9 bg-white font-medium"
                  />
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
                      {formatActivityTime(act)}
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

      {/* Edit Employee ID Modal (Admin Only) */}
      {isEditEmpIdModalOpen && staffToEditEmpId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                  <IdCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Change Employee ID</h3>
                  <p className="text-xs text-slate-500 font-medium">{staffToEditEmpId.full_name} ({staffToEditEmpId.roles?.[0] || 'Staff'})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditEmpIdModalOpen(false);
                  setStaffToEditEmpId(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployeeId} className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                <div className="text-slate-500 font-medium">Current Employee ID:</div>
                <div className="font-mono font-bold text-slate-900 text-sm">
                  {staffToEditEmpId.employeeId || staffToEditEmpId.employee_id || staffToEditEmpId.frappeStaffId || 'N/A'}
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700 mb-1.5 block">New Employee ID *</Label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. TH001"
                  value={newEmpIdInput}
                  onChange={(e) => setNewEmpIdInput(e.target.value.toUpperCase())}
                  className="text-xs py-2 rounded-xl font-mono uppercase font-bold"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 font-medium flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Server will verify format and uniqueness before saving. Change will be recorded in audit log.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditEmpIdModalOpen(false);
                    setStaffToEditEmpId(null);
                  }}
                  disabled={isSavingEmpId}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingEmpId}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isSavingEmpId ? "Saving..." : "Save Employee ID"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
