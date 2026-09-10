"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Eye, 
  Search, 
  Download, 
  Calendar, 
  Layers, 
  LogIn, 
  Trash2, 
  FileText, 
  Lock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit3,
  CreditCard,
  Pill,
  FlaskConical,
  TrendingUp,
  Users,
  Copy,
  Check,
  X,
  IndianRupee,
  ShieldCheck,
  Stethoscope,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  // Raw logs from server
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State matching mockup
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState("all");
  const [selectedActionType, setSelectedActionType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Inspector Modal State
  const [selectedLog, setSelectedLog] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch all logs from server (silent avoids resetting table state or showing fullscreen loader)
  const fetchLogs = async (silent = false) => {
    if (!silent) {
      if (logs.length === 0) setLoading(true);
      else setIsRefreshing(true);
    }
    try {
      const params = new URLSearchParams();
      params.set("limit", "1000");

      const res = await fetch(`/api/logs/list?${params.toString()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.logs)) {
          setLogs(data.logs);
        }
      }
    } catch (err) {
      console.warn("Failed to load audit logs:", err);
    } finally {
      if (!silent) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchLogs(false);
  }, []);

  // Background auto-refresh every 15 seconds silently
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Helper 1: Map action type from real log to badge props
  const mapAction = (log) => {
    const act = (log.action || "").toLowerCase();
    const typ = (log.type || "").toLowerCase();
    const desc = (log.description || "").toLowerCase();

    if (act.includes("delete") || act.includes("remove") || act.includes("purge") || desc.includes("deleted")) {
      return {
        label: "Deleted",
        pillClass: "bg-rose-50 text-rose-600 border-rose-200/80",
        icon: Trash2
      };
    }
    if (act.includes("payment") || act.includes("paid") || act.includes("collect") || desc.includes("collected") || desc.includes("paid") || typ === "billing") {
      if (desc.includes("collected") || desc.includes("payment") || act.includes("payment")) {
        return {
          label: "Payment Collected",
          pillClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
          icon: IndianRupee
        };
      }
    }
    if (act.includes("create") || act.includes("add") || act.includes("register") || act.includes("new") || desc.includes("created") || desc.includes("added") || desc.includes("registered") || typ === "user_mgmt") {
      return {
        label: "Created",
        pillClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
        icon: Plus
      };
    }
    if (act.includes("update") || act.includes("edit") || act.includes("modify") || act.includes("reset") || act.includes("adjust") || desc.includes("updated") || desc.includes("edited") || desc.includes("reset")) {
      return {
        label: "Updated",
        pillClass: "bg-amber-50 text-amber-700 border-amber-200/80",
        icon: Edit3
      };
    }
    if (act.includes("dispense") || desc.includes("dispensed")) {
      return {
        label: "Dispensed",
        pillClass: "bg-purple-50 text-purple-700 border-purple-200/80",
        icon: Pill
      };
    }
    if (act.includes("login") || act.includes("auth") || typ === "auth" || desc.includes("logged in")) {
      return {
        label: "Logged In",
        pillClass: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
        icon: LogIn
      };
    }

    // Default viewed
    return {
      label: "Viewed",
      pillClass: "bg-blue-50 text-blue-600 border-blue-200/80",
      icon: Eye
    };
  };

  // Helper 2: Map module from real log
  const mapModule = (log) => {
    const tgt = (log.target || "").toLowerCase();
    const act = (log.action || "").toLowerCase();
    const typ = (log.type || "").toLowerCase();
    const desc = (log.description || "").toLowerCase();

    if (tgt.includes("admin") || tgt.includes("staff") || typ === "user_mgmt" || act.includes("staff") || desc.includes("staff member")) {
      return { label: "Staff Management", icon: Users };
    }
    if (tgt.includes("patient") || tgt.includes("reception") || tgt.includes("walkin") || act.includes("patient") || desc.includes("patient")) {
      return { label: "Patient", icon: FileText };
    }
    if (tgt.includes("appointment") || act.includes("appointment") || desc.includes("appointment")) {
      return { label: "Appointment", icon: Calendar };
    }
    if (tgt.includes("pharmacy") || act.includes("medicine") || act.includes("stock") || desc.includes("medicine") || desc.includes("stock")) {
      return { label: "Pharmacy", icon: Pill };
    }
    if (tgt.includes("lab") || tgt.includes("radiology") || act.includes("lab") || desc.includes("lab report") || desc.includes("diagnostic")) {
      return { label: "Lab Reports", icon: FlaskConical };
    }
    if (tgt.includes("consultation") || act.includes("consultation") || desc.includes("consultation") || typ === "clinical") {
      return { label: "Consultation", icon: Stethoscope };
    }
    if (tgt.includes("billing") || act.includes("invoice") || desc.includes("invoice") || desc.includes("bill")) {
      return { label: "Billing", icon: CreditCard };
    }
    if (tgt.includes("finance") || act.includes("finance") || desc.includes("transaction") || typ === "finance") {
      return { label: "Finance", icon: TrendingUp };
    }
    if (tgt.includes("auth") || tgt.includes("login") || typ === "auth") {
      return { label: "Authentication", icon: ShieldCheck };
    }
    return { label: "System", icon: Layers };
  };

  // Helper 3: Format Date and Time
  const formatDateTime = (log) => {
    let d = null;
    if (log.timestamp) d = new Date(log.timestamp);
    else if (log.createdAt) d = new Date(log.createdAt);

    if (d && !isNaN(d.getTime())) {
      const time = d.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      const date = d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      return { time, date };
    }

    return {
      time: log.timeStr || "12:00 PM",
      date: log.dateStr || "Today"
    };
  };

  // Helper 4: Format Staff Member Name & Role
  const getStaffInfo = (log) => {
    const actorName = log.actor?.name || log.actor?.full_name || log.actor?.employeeId || "Hospital Admin";
    const actorRole = log.actor?.role || log.actor?.designation || (log.actor?.department ? `${log.actor.department} Staff` : "Staff");
    return { name: actorName, role: actorRole };
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const actionObj = mapAction(log);
      const moduleObj = mapModule(log);
      const staffObj = getStaffInfo(log);
      const { date } = formatDateTime(log);

      // Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = staffObj.name.toLowerCase().includes(query);
        const matchesRole = staffObj.role.toLowerCase().includes(query);
        const matchesAction = (log.action || "").toLowerCase().includes(query) || actionObj.label.toLowerCase().includes(query);
        const matchesModule = moduleObj.label.toLowerCase().includes(query);
        const matchesDesc = (log.description || "").toLowerCase().includes(query);
        const matchesTarget = (log.target || "").toLowerCase().includes(query);

        if (!matchesName && !matchesRole && !matchesAction && !matchesModule && !matchesDesc && !matchesTarget) {
          return false;
        }
      }

      // Module Filter
      if (selectedModule !== "all") {
        if (moduleObj.label.toLowerCase() !== selectedModule.toLowerCase()) {
          return false;
        }
      }

      // Action Type Filter
      if (selectedActionType !== "all") {
        if (actionObj.label.toLowerCase() !== selectedActionType.toLowerCase()) {
          return false;
        }
      }

      // Date Range Filter
      if (startDate) {
        const logDateObj = new Date(log.timestamp || log.createdAt || date);
        const startObj = new Date(startDate);
        if (!isNaN(logDateObj.getTime()) && !isNaN(startObj.getTime())) {
          startObj.setHours(0, 0, 0, 0);
          if (logDateObj < startObj) return false;
        }
      }

      if (endDate) {
        const logDateObj = new Date(log.timestamp || log.createdAt || date);
        const endObj = new Date(endDate);
        if (!isNaN(logDateObj.getTime()) && !isNaN(endObj.getTime())) {
          endObj.setHours(23, 59, 59, 999);
          if (logDateObj > endObj) return false;
        }
      }

      return true;
    });
  }, [logs, searchQuery, selectedModule, selectedActionType, startDate, endDate]);

  // Paginated View
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // Export CSV Handler
  const handleExportCSV = () => {
    if (!filteredLogs.length) return;
    const headers = ["Timestamp", "Date", "Time", "Staff Name", "Role", "Action Type", "Module", "Details", "IP Address"];
    const rows = filteredLogs.map((l) => {
      const { time, date } = formatDateTime(l);
      const staff = getStaffInfo(l);
      const action = mapAction(l);
      const mod = mapModule(l);

      return [
        l.timestamp || l.createdAt || "",
        date,
        time,
        `"${(staff.name || "").replace(/"/g, '""')}"`,
        `"${(staff.role || "").replace(/"/g, '""')}"`,
        `"${action.label}"`,
        `"${mod.label}"`,
        `"${(l.description || l.action || "").replace(/"/g, '""')}"`,
        l.metadata?.ip || "127.0.0.1"
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hospital_audit_log_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyJsonPayload = (logObj) => {
    navigator.clipboard.writeText(JSON.stringify(logObj, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
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

  const startRecord = filteredLogs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, filteredLogs.length);

  return (
    <div className="flex flex-col gap-5 max-w-[1400px] mx-auto pb-14 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* 1. HEADER (Icon + Title + Subtitle + Export CSV Button) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Audit Log</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Track all system activities and changes</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => fetchLogs(false)}
            variant="outline"
            disabled={isRefreshing}
            className="h-10 px-4 text-xs font-bold rounded-xl gap-2 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs cursor-pointer font-sans"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </Button>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="h-10 px-4 text-xs font-bold rounded-xl gap-2 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs cursor-pointer font-sans"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* 2. FILTER BAR (Search, Module, Action Type, Date Range + Apply Button) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          
          {/* 1. Search */}
          <div className="sm:col-span-2 lg:col-span-3">
            <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Search</Label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search by name, action, or module..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 text-xs h-9.5 bg-white border-slate-200 rounded-xl font-medium placeholder:text-slate-400 focus-visible:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 2. Module */}
          <div className="sm:col-span-1 lg:col-span-2">
            <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Module</Label>
            <select
              value={selectedModule}
              onChange={(e) => {
                setSelectedModule(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-2xs truncate"
            >
              <option value="all">All Modules</option>
              <option value="Staff Management">Staff Management</option>
              <option value="Patient">Patient</option>
              <option value="Appointment">Appointment</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="Lab Reports">Lab Reports</option>
              <option value="Consultation">Consultation</option>
              <option value="Billing">Billing</option>
              <option value="Finance">Finance</option>
              <option value="Authentication">Authentication</option>
              <option value="System">System</option>
            </select>
          </div>

          {/* 3. Action Type */}
          <div className="sm:col-span-1 lg:col-span-2">
            <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Action Type</Label>
            <select
              value={selectedActionType}
              onChange={(e) => {
                setSelectedActionType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-2xs truncate"
            >
              <option value="all">All Actions</option>
              <option value="Created">Created</option>
              <option value="Updated">Updated</option>
              <option value="Deleted">Deleted</option>
              <option value="Viewed">Viewed</option>
              <option value="Payment Collected">Payment Collected</option>
              <option value="Dispensed">Dispensed</option>
              <option value="Logged In">Logged In</option>
            </select>
          </div>

          {/* 4. Date Range */}
          <div className="sm:col-span-2 lg:col-span-4">
            <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Date Range</Label>
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 h-9.5 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-[11px] font-semibold text-slate-700 bg-transparent focus:outline-none w-full min-w-0"
                title="From Date"
              />
              <span className="text-slate-300 font-bold shrink-0">–</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-[11px] font-semibold text-slate-700 bg-transparent focus:outline-none w-full min-w-0"
                title="To Date"
              />
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => { setStartDate(""); setEndDate(""); }}
                  className="text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer"
                  title="Clear Date Range"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* 5. Apply Button */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Button
              type="button"
              onClick={() => {
                setCurrentPage(1);
                fetchLogs();
              }}
              className="w-full h-9.5 px-0 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs cursor-pointer flex items-center justify-center transition-all"
            >
              Apply
            </Button>
          </div>

        </div>
      </div>

      {/* 3. AUDIT DATA TABLE (Clean White Card) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold text-slate-600 tracking-wider">
                <th className="py-3.5 px-5 font-bold">Date &amp; Time</th>
                <th className="py-3.5 px-4 font-bold">Staff Member</th>
                <th className="py-3.5 px-4 font-bold">Action</th>
                <th className="py-3.5 px-4 font-bold">Module</th>
                <th className="py-3.5 px-5 font-bold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                      <span className="text-xs">Loading hospital audit activities...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-8 h-8 text-slate-300" />
                      <span className="text-xs font-semibold text-slate-500">No activity logs found matching the selected criteria.</span>
                      <span className="text-[11px] text-slate-400">Try clearing or adjusting your search filters.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log, idx) => {
                  const { time, date } = formatDateTime(log);
                  const staff = getStaffInfo(log);
                  const action = mapAction(log);
                  const mod = mapModule(log);
                  const ActionIcon = action.icon;
                  const ModuleIcon = mod.icon;

                  return (
                    <tr 
                      key={log.id || `${log.timestamp || 'log'}-${idx}`}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      {/* 1. Date & Time */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs">{time}</div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">{date}</div>
                      </td>

                      {/* 2. Staff Member */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs">{staff.name}</div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">{staff.role}</div>
                      </td>

                      {/* 3. Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border shadow-2xs ${action.pillClass}`}>
                          <ActionIcon className="w-3.5 h-3.5" />
                          <span>{action.label}</span>
                        </span>
                      </td>

                      {/* 4. Module */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
                          <ModuleIcon className="w-3.5 h-3.5 text-slate-600" />
                          <span>{mod.label}</span>
                        </span>
                      </td>

                      {/* 5. Details */}
                      <td className="py-3.5 px-5 text-slate-700 font-medium text-xs leading-relaxed max-w-md">
                        {log.description || log.action || "System activity recorded"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. TABLE FOOTER (Showing X - Y of Z + Pagination Buttons) */}
        <div className="p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 font-medium text-xs">
            Showing <strong className="text-slate-900 font-bold">{startRecord}</strong> – <strong className="text-slate-900 font-bold">{endRecord}</strong> of <strong className="text-slate-900 font-bold">{filteredLogs.length}</strong> activities
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              const isActive = currentPage === pageNum;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    isActive 
                      ? "bg-blue-600 text-white shadow-2xs" 
                      : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. LOG INSPECTOR MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm">Activity Details</h3>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Staff Member</span>
                  <p className="font-bold text-slate-900">{getStaffInfo(selectedLog).name}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Role / Dept</span>
                  <p className="font-bold text-slate-900">{getStaffInfo(selectedLog).role}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Action</span>
                  <p className="font-bold text-slate-900">{selectedLog.action || "Activity"}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Module</span>
                  <p className="font-bold text-slate-900">{mapModule(selectedLog).label}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Description</span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-medium">
                  {selectedLog.description || "No description provided."}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Raw Payload</span>
                  <button
                    onClick={() => copyJsonPayload(selectedLog)}
                    className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold hover:underline cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopied ? "Copied" : "Copy JSON"}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 leading-relaxed">
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>

              <div className="pt-2 border-t flex justify-end">
                <Button
                  onClick={() => setSelectedLog(null)}
                  className="h-8 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl cursor-pointer"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
