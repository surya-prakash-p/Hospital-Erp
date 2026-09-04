"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Search, 
  RefreshCw, 
  Download, 
  ExternalLink, 
  Filter, 
  Eye, 
  UserPlus, 
  ShieldCheck, 
  LogIn, 
  LogOut, 
  Activity, 
  Calendar, 
  Clock, 
  User, 
  ChevronRight,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Pill,
  FlaskConical,
  Receipt,
  Layers,
  Trash2,
  Info,
  Copy,
  Check,
  FileText
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface AuditLog {
  id: string;
  timestamp: string;
  timeStr: string;
  dateStr: string;
  type: string;
  action: string;
  description: string;
  actor: {
    employeeId: string;
    name: string;
    role: string;
    email: string;
    department?: string;
  };
  target: string;
  metadata?: Record<string, any>;
}

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuditLogModal({ isOpen, onClose }: AuditLogModalProps) {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  const [metrics, setMetrics] = useState({
    totalRecords: 0,
    pageVisitsToday: 0,
    userActionsToday: 0,
    activeStaffToday: 0
  });
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "all") params.set("type", activeTab);
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (dateFilter !== "all") params.set("dateRange", dateFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      params.set("limit", "150");

      const res = await fetch(`/api/logs/list?${params.toString()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLogs(data.logs || []);
          if (data.metrics) setMetrics(data.metrics);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, activeTab, roleFilter, dateFilter]);

  // Auto-refresh timer every 6 seconds when open
  useEffect(() => {
    if (!isOpen || !isAutoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs();
    }, 6000);
    return () => clearInterval(interval);
  }, [isOpen, isAutoRefresh, activeTab, roleFilter, dateFilter, searchQuery]);

  if (!isOpen) return null;

  const handleExportCSV = () => {
    if (!logs.length) return;
    const headers = ["Timestamp", "Date", "Time", "Category", "Action", "Staff Name", "Employee ID", "Role", "Target/Page", "Description"];
    const rows = logs.map(l => [
      l.timestamp,
      l.dateStr,
      l.timeStr,
      l.type,
      `"${(l.action || "").replace(/"/g, '""')}"`,
      `"${(l.actor?.name || "").replace(/"/g, '""')}"`,
      l.actor?.employeeId || "",
      l.actor?.role || "",
      `"${(l.target || "").replace(/"/g, '""')}"`,
      `"${(l.description || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hospital_audit_logs_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryBadge = (type: string) => {
    switch (type) {
      case "page_visit":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <Eye className="w-3 h-3 text-sky-600" />
            Page Nav
          </span>
        );
      case "user_mgmt":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <UserPlus className="w-3 h-3 text-emerald-600" />
            User Mgmt
          </span>
        );
      case "patient":
      case "clinical":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Stethoscope className="w-3 h-3 text-purple-600" />
            Clinical
          </span>
        );
      case "billing":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Receipt className="w-3 h-3 text-amber-600" />
            Billing
          </span>
        );
      case "auth":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <LogIn className="w-3 h-3 text-indigo-600" />
            Security
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Activity className="w-3 h-3 text-slate-500" />
            System
          </span>
        );
    }
  };

  const getRelativeTime = (timestampStr: string) => {
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

  const copyJsonPayload = (logObj: any) => {
    navigator.clipboard.writeText(JSON.stringify(logObj, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleOpenFullPage = () => {
    onClose();
    router.push("/audit-logs");
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full h-[90vh] max-h-[840px] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        
        {/* MODAL HEADER */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">Audit & Page Access Ledger</h3>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Trace
                </span>
              </div>
              <p className="text-[11px] text-slate-300">Live capture of user page navigations, staff additions, and operations</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleOpenFullPage}
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 gap-1.5 cursor-pointer font-sans"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Full Page View</span>
            </Button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold shrink-0">
              <Eye className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-500">Page Views Today</div>
              <div className="text-sm font-bold text-slate-900 leading-none mt-0.5">{metrics.pageVisitsToday}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">
              <UserPlus className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-500">Staff Actions Today</div>
              <div className="text-sm font-bold text-slate-900 leading-none mt-0.5">{metrics.userActionsToday}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-500">Active Staff Accounts</div>
              <div className="text-sm font-bold text-slate-900 leading-none mt-0.5">{metrics.activeStaffToday}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-500">Total Audit Records</div>
              <div className="text-sm font-bold text-slate-900 leading-none mt-0.5">{metrics.totalRecords}</div>
            </div>
          </div>
        </div>

        {/* CONTROLS & FILTER TABS */}
        <div className="p-3.5 border-b border-slate-200 bg-white space-y-2.5 shrink-0">
          
          {/* TABS */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: "all", label: "All Activity", icon: Activity },
              { id: "page_visit", label: "Page Navigations", icon: Eye },
              { id: "user_mgmt", label: "Staff Governance", icon: UserPlus },
              { id: "patient", label: "Clinical & Patients", icon: Stethoscope },
              { id: "auth", label: "Security & Logins", icon: ShieldCheck }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                    isActive 
                      ? "bg-blue-600 text-white shadow-xs" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* SEARCH & FILTERS ROW */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff, Employee ID, page..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchLogs()}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="Admin">Hospital Admin</option>
                <option value="Doctor">Doctor</option>
                <option value="Pharmacist">Pharmacist</option>
                <option value="Lab Technician">Lab Technician</option>
                <option value="Receptionist">Receptionist</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
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
                className="h-8 px-2.5 text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
                title="Refresh Logs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
              </Button>

              <Button
                onClick={handleExportCSV}
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs text-slate-700 bg-white hover:bg-slate-50 gap-1 cursor-pointer font-sans"
                title="Export CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">CSV</span>
              </Button>
            </div>
          </div>
        </div>

        {/* ENTERPRISE DATA TABLE IN MODAL */}
        <div className="flex-1 overflow-y-auto overflow-x-auto bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                <th className="py-2.5 px-4 w-36">Time</th>
                <th className="py-2.5 px-4 w-52">Staff Actor</th>
                <th className="py-2.5 px-4 w-32">Type</th>
                <th className="py-2.5 px-4">Action Summary</th>
                <th className="py-2.5 px-4 w-40">Target</th>
                <th className="py-2.5 px-4 w-20 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                      <p className="text-xs font-semibold">Retrieving audit trail...</p>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Activity className="w-7 h-7 text-slate-300" />
                      <p className="text-xs font-bold text-slate-700">No activity records found</p>
                      <p className="text-[11px] text-slate-400">Try changing your search keywords</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr 
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                  >
                    {/* Timestamp */}
                    <td className="py-2.5 px-4 align-middle whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-600" />
                        <span>{log.timeStr}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {log.dateStr} • <span className="text-blue-600 font-semibold">{getRelativeTime(log.timestamp)}</span>
                      </div>
                    </td>

                    {/* Staff Actor */}
                    <td className="py-2.5 px-4 align-middle">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                          {(log.actor?.name || "U").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate text-xs flex items-center gap-1">
                            <span>{log.actor?.name}</span>
                            <span className="font-mono text-[9px] font-bold bg-slate-100 text-slate-700 px-1 py-0.2 rounded border border-slate-200">
                              {log.actor?.employeeId || "SYS"}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {log.actor?.role}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-2.5 px-4 align-middle whitespace-nowrap">
                      {getCategoryBadge(log.type)}
                    </td>

                    {/* Action Description */}
                    <td className="py-2.5 px-4 align-middle">
                      <div className="font-semibold text-slate-800 line-clamp-2">
                        {log.description}
                      </div>
                    </td>

                    {/* Target */}
                    <td className="py-2.5 px-4 align-middle">
                      {log.target ? (
                        <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 truncate block max-w-[150px]" title={log.target}>
                          {log.target}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Inspect */}
                    <td className="py-2.5 px-4 align-middle text-center" onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}>
                      <button className="px-2 py-0.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 text-[11px] font-semibold rounded transition-colors cursor-pointer">
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div>
            Showing <strong className="text-slate-900">{logs.length}</strong> logged events
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleOpenFullPage}
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs font-semibold text-blue-700 border-blue-200 hover:bg-blue-50 cursor-pointer"
            >
              Open Full Audit Dashboard
            </Button>
            <Button
              onClick={onClose}
              size="sm"
              className="h-8 px-4 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
            >
              Close
            </Button>
          </div>
        </div>

      </div>

      {/* EVENT INSPECTOR SUB-MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-[160] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-xs">Event Detail Inspector</span>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs max-h-[70vh] overflow-y-auto">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900">{selectedLog.action}</div>
                <div className="text-slate-600 mt-1">{selectedLog.description}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-slate-400 font-semibold uppercase text-[9px]">Actor</div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedLog.actor?.name}</div>
                  <div className="text-slate-500 font-mono">{selectedLog.actor?.employeeId} ({selectedLog.actor?.role})</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-slate-400 font-semibold uppercase text-[9px]">Timestamp</div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedLog.timeStr}</div>
                  <div className="text-slate-500">{selectedLog.dateStr}</div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-700 text-[11px]">Raw JSON Payload</span>
                  <button 
                    onClick={() => copyJsonPayload(selectedLog)}
                    className="text-blue-600 hover:text-blue-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[10px] overflow-x-auto max-h-40 leading-relaxed">
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setSelectedLog(null)} className="h-7 text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
