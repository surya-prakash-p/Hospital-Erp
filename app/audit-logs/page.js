"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Activity, 
  Eye, 
  UserPlus, 
  ShieldCheck, 
  Stethoscope, 
  Search, 
  RefreshCw, 
  Download, 
  Clock, 
  Calendar, 
  User, 
  Filter, 
  Layers, 
  CheckCircle2, 
  LogIn, 
  Receipt, 
  Trash2, 
  AlertTriangle,
  FileSpreadsheet,
  Building2,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Info,
  Laptop,
  Globe,
  Copy,
  Check,
  X,
  Shield,
  FileText,
  Lock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function AuditLogsPage() {
  const { user, loading: authLoading, hasRole, hasPermission } = useAuth();
  const router = useRouter();

  const isHospitalAdmin = Boolean(
    hasRole?.('Hospital Admin') || 
    hasRole?.('System Manager') || 
    user?.permissions?.includes('*') || 
    user?.role === 'Hospital Admin'
  );

  const canViewAuditLogs = Boolean(
    isHospitalAdmin || 
    hasPermission?.('Audit Logs') || 
    hasPermission?.('Audit')
  );

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Inspector Modal State
  const [selectedLog, setSelectedLog] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  // Clear modal state
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const [metrics, setMetrics] = useState({
    totalRecords: 0,
    pageVisitsToday: 0,
    userActionsToday: 0,
    activeStaffToday: 0
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "all") params.set("type", activeTab);
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (dateFilter !== "all") params.set("dateRange", dateFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      params.set("limit", "500");

      const res = await fetch(`/api/logs/list?${params.toString()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLogs(data.logs || []);
          if (data.metrics) setMetrics(data.metrics);
        }
      }
    } catch (err) {
      console.warn("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchLogs();
  }, [activeTab, roleFilter, dateFilter]);

  // Live auto-refresh interval
  useEffect(() => {
    if (!isAutoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs();
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoRefresh, activeTab, roleFilter, dateFilter, searchQuery]);

  // Paginated logs
  const totalPages = Math.ceil(logs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return logs.slice(start, start + pageSize);
  }, [logs, currentPage, pageSize]);

  const handleExportCSV = () => {
    if (!logs.length) return;
    const headers = ["Timestamp", "Date", "Time", "Category", "Action", "Staff Name", "Employee ID", "Role", "Department", "Target/Page", "Description", "IP Address"];
    const rows = logs.map(l => [
      l.timestamp,
      l.dateStr,
      l.timeStr,
      l.type,
      `"${(l.action || "").replace(/"/g, '""')}"`,
      `"${(l.actor?.name || "").replace(/"/g, '""')}"`,
      l.actor?.employeeId || "",
      l.actor?.role || "",
      `"${(l.actor?.department || "").replace(/"/g, '""')}"`,
      `"${(l.target || "").replace(/"/g, '""')}"`,
      `"${(l.description || "").replace(/"/g, '""')}"`,
      l.metadata?.ip || "127.0.0.1"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hospital_audit_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmClearLogs = async () => {
    setIsClearing(true);
    try {
      const res = await fetch("/api/logs/list", { method: "DELETE" });
      if (res.ok) {
        setIsClearModalOpen(false);
        await fetchLogs();
      }
    } catch (err) {
      console.error("Failed to clear logs:", err);
    } finally {
      setIsClearing(false);
    }
  };

  const copyJsonPayload = (logObj) => {
    navigator.clipboard.writeText(JSON.stringify(logObj, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getCategoryBadge = (type) => {
    switch (type) {
      case "page_visit":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80 shadow-2xs">
            <Eye className="w-3 h-3 text-sky-600" />
            Page Access
          </span>
        );
      case "user_mgmt":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
            <UserPlus className="w-3 h-3 text-emerald-600" />
            User Governance
          </span>
        );
      case "patient":
      case "clinical":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 shadow-2xs">
            <Stethoscope className="w-3 h-3 text-purple-600" />
            Clinical Operation
          </span>
        );
      case "billing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
            <Receipt className="w-3 h-3 text-amber-600" />
            Finance & Billing
          </span>
        );
      case "auth":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
            <LogIn className="w-3 h-3 text-indigo-600" />
            Security & Session
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs">
            <Activity className="w-3 h-3 text-slate-500" />
            System Event
          </span>
        );
    }
  };

  const getRelativeTime = (timestampStr) => {
    try {
      const diffMs = Date.now() - new Date(timestampStr).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return "Just now";
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return "";
    }
  };

  const getActorAvatarColor = (role) => {
    const r = (role || "").toLowerCase();
    if (r.includes("admin")) return "from-slate-900 to-indigo-950 text-white";
    if (r.includes("doctor")) return "from-blue-600 to-indigo-600 text-white";
    if (r.includes("pharm")) return "from-purple-600 to-pink-600 text-white";
    if (r.includes("lab")) return "from-amber-500 to-orange-600 text-white";
    if (r.includes("recep")) return "from-teal-600 to-emerald-600 text-white";
    return "from-slate-700 to-slate-900 text-white";
  };

  // If user is not admin and does not have explicit 'Audit Logs' permission
  if (!authLoading && !canViewAuditLogs) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center p-6 space-y-4 font-sans animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-md">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Viewing Hospital Audit & Access Logs is restricted to <strong>Hospital Administrators</strong> or staff members with explicit <strong>&quot;Audit Logs&quot;</strong> permission granted by an Admin.
          </p>
        </div>
        <div className="pt-2">
          <Button
            onClick={() => router.push('/')}
            className="h-9 px-5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white cursor-pointer rounded-xl"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1440px] mx-auto pb-14 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* 1. ENTERPRISE HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Hospital Audit & Access Ledger
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Enterprise Audit Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Comprehensive trace of page navigations, staff user governance, patient registrations, and financial operations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            variant={isAutoRefresh ? "default" : "outline"}
            size="sm"
            className={`h-9 px-3.5 text-xs font-semibold rounded-xl gap-2 cursor-pointer transition-all shadow-2xs font-sans ${
              isAutoRefresh ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Activity className={`w-3.5 h-3.5 ${isAutoRefresh ? "animate-spin" : ""}`} />
            <span>{isAutoRefresh ? "Auto-Refresh Live (6s)" : "Auto-Refresh Paused"}</span>
          </Button>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="h-9 px-3.5 text-xs font-semibold rounded-xl gap-2 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs cursor-pointer font-sans"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV Ledger</span>
          </Button>

          {isHospitalAdmin && (
            <Button
              onClick={() => setIsClearModalOpen(true)}
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs font-semibold rounded-xl gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer font-sans"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge History</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. TOP 4 METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Page Views Today */}
        <Card className="border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Page Navigations Today</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{metrics.pageVisitsToday}</h3>
              <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Live route transitions
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
              <Eye className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* User Mgmt Today */}
        <Card className="border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Staff Actions Today</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{metrics.userActionsToday}</h3>
              <p className="text-[11px] font-medium text-slate-500">
                Staff added, edited or deleted
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <UserPlus className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Active Staff */}
        <Card className="border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Staff Accounts</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{metrics.activeStaffToday}</h3>
              <p className="text-[11px] font-medium text-indigo-600 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                Authenticated users
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <User className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Total Records */}
        <Card className="border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Audit Trail</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{metrics.totalRecords}</h3>
              <p className="text-[11px] font-medium text-slate-500">
                Persisted in audit database
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* 3. AUDIT DATA TABLE CARD */}
      <Card className="border-slate-200/90 shadow-xs bg-white rounded-2xl overflow-hidden flex flex-col">
        
        {/* CATEGORY FILTER TABS */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl">
            {[
              { id: "all", label: "All Events", icon: Activity, count: metrics.totalRecords },
              { id: "page_visit", label: "Page Navigations", icon: Eye, count: metrics.pageVisitsToday },
              { id: "user_mgmt", label: "Staff Governance", icon: UserPlus, count: metrics.userActionsToday },
              { id: "patient", label: "Patient & Clinical", icon: Stethoscope },
              { id: "billing", label: "Billing & Ledger", icon: Receipt },
              { id: "auth", label: "Security & Sessions", icon: ShieldCheck }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all whitespace-nowrap cursor-pointer select-none ${
                    isActive 
                      ? "bg-white text-blue-700 shadow-xs" 
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SEARCH & SELECTORS TOOLBAR */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by staff name, employee ID, page route, or action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchLogs()}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="Hospital Admin">Hospital Admin</option>
              <option value="Doctor">Doctor</option>
              <option value="Pharmacist">Pharmacist</option>
              <option value="Lab Technician">Lab Technician</option>
              <option value="Receptionist">Receptionist</option>
              <option value="Billing Clerk">Billing Clerk</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7days">Last 7 Days</option>
            </select>

            <Button
              onClick={fetchLogs}
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
              title="Refresh Audit Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin text-blue-600" : ""}`} />
              <span className="ml-1.5 hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* STRUCTURED ENTERPRISE DATA TABLE */}
        <div className="overflow-x-auto min-h-[420px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-44">Timestamp & Date</th>
                <th className="py-3 px-4 w-64">Staff Member / Actor</th>
                <th className="py-3 px-4 w-44">Category</th>
                <th className="py-3 px-4">Event Description & Action</th>
                <th className="py-3 px-4 w-48">Resource / Route</th>
                <th className="py-3 px-4 w-28 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-7 h-7 animate-spin text-blue-600" />
                      <p className="text-xs font-semibold text-slate-600">Querying Audit Ledger...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Activity className="w-8 h-8 text-slate-300" />
                      <p className="text-xs font-bold text-slate-700">No matching audit records found</p>
                      <p className="text-[11px] text-slate-400">Try adjusting your search query or date filter</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  return (
                    <tr 
                      key={log.id} 
                      className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* 1. Timestamp */}
                      <td className="py-3 px-4 align-middle whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>{log.timeStr}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <span>{log.dateStr}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-blue-600 font-semibold">{getRelativeTime(log.timestamp)}</span>
                        </div>
                      </td>

                      {/* 2. Staff Member / Actor */}
                      <td className="py-3 px-4 align-middle">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getActorAvatarColor(log.actor?.role)} flex items-center justify-center font-bold text-xs shadow-2xs shrink-0`}>
                            {(log.actor?.name || "U").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate leading-tight flex items-center gap-1.5">
                              <span>{log.actor?.name}</span>
                              <span className="font-mono text-[10px] font-extrabold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                                {log.actor?.employeeId || "SYS"}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate mt-0.5">
                              {log.actor?.role || "Staff Member"} {log.actor?.department ? `• ${log.actor.department}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Category */}
                      <td className="py-3 px-4 align-middle whitespace-nowrap">
                        {getCategoryBadge(log.type)}
                      </td>

                      {/* 4. Description */}
                      <td className="py-3 px-4 align-middle">
                        <div className="font-semibold text-slate-800 leading-snug">
                          {log.description}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                          <span>Action: {log.action}</span>
                          {log.metadata?.ip && (
                            <>
                              <span>•</span>
                              <span>IP: {log.metadata.ip}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* 5. Resource / Target */}
                      <td className="py-3 px-4 align-middle">
                        {log.target ? (
                          <div className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-blue-700 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200/70 truncate max-w-[180px]" title={log.target}>
                            {log.target}
                          </div>
                        ) : (
                          <span className="text-slate-300 font-mono text-xs">—</span>
                        )}
                      </td>

                      {/* 6. Inspect Action */}
                      <td className="py-3 px-4 align-middle text-center" onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}>
                        <button
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                          title="Inspect Event Payload"
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className="text-slate-900">{logs.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to <strong className="text-slate-900">{Math.min(currentPage * pageSize, logs.length)}</strong> of <strong className="text-slate-900">{logs.length}</strong> records
            </span>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-white border border-slate-200 rounded-md px-2 py-0.5 text-xs font-semibold cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="h-8 px-2.5 text-xs font-semibold cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Previous
            </Button>

            <span className="px-3 py-1 bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-900">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="h-8 px-2.5 text-xs font-semibold cursor-pointer"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>

      </Card>

      {/* 4. EVENT PAYLOAD INSPECTOR MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-[160] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">Audit Event Inspector</h3>
                  <p className="text-[11px] text-slate-400 font-mono">ID: {selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* Event Overview Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm">{selectedLog.action}</div>
                  {getCategoryBadge(selectedLog.type)}
                </div>
                <p className="text-xs text-slate-700 font-medium">{selectedLog.description}</p>
              </div>

              {/* Grid Properties */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actor / User</div>
                  <div className="font-bold text-slate-900">{selectedLog.actor?.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">ID: {selectedLog.actor?.employeeId} ({selectedLog.actor?.role})</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Timestamp (IST)</div>
                  <div className="font-bold text-slate-900">{selectedLog.timeStr} • {selectedLog.dateStr}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{selectedLog.timestamp}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Resource</div>
                  <div className="font-mono font-bold text-blue-700 truncate">{selectedLog.target || "N/A"}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client IP / Source</div>
                  <div className="font-mono font-bold text-slate-800">{selectedLog.metadata?.ip || "127.0.0.1"}</div>
                </div>
              </div>

              {/* Raw Payload JSON */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600">Full Raw Event Payload</span>
                  <button
                    onClick={() => copyJsonPayload(selectedLog)}
                    className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? "Copied!" : "Copy JSON"}</span>
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed max-h-52">
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <Button
                onClick={() => setSelectedLog(null)}
                variant="outline"
                size="sm"
                className="h-8 px-4 text-xs font-semibold cursor-pointer"
              >
                Close Inspector
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* 5. CONFIRM PURGE MODAL */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-[170] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Purge Audit Ledger History?</h3>
            <p className="text-xs text-slate-500 mt-1">
              This action will reset the historical audit records. The system will retain system seed baseline entries.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsClearModalOpen(false)}
                className="h-9 px-4 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmClearLogs}
                disabled={isClearing}
                className="h-9 px-4 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                {isClearing ? "Clearing..." : "Yes, Purge History"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
