"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useAppSidebar } from "@/components/sidebar-context";
import {
  Menu,
  Activity,
  LayoutDashboard,
  ClipboardList,
  Users,
  Stethoscope,
  Pill,
  Receipt,
  Wallet,
  Bot,
  ShieldCheck,
  Calendar,
} from "lucide-react";

// Route title & icon mapping
const routeMetadata: Record<string, { title: string; subtitle: string; icon: React.ElementType }> = {
  "/": { title: "Overview Dashboard", subtitle: "Hospital Operations & Real-Time Performance", icon: LayoutDashboard },
  "/reception": { title: "Reception Desk", subtitle: "OPD Check-In, Walk-In & Queue Management", icon: ClipboardList },
  "/patient-registry": { title: "Patient Registry", subtitle: "Medical Master Records & Admissions", icon: Users },
  "/consultation": { title: "Doctor Consultation", subtitle: "Clinical Chamber & Prescription Desk", icon: Stethoscope },
  "/pharmacy": { title: "Pharmacy POS Counter", subtitle: "Billing, Medicine Dispensing & Inventory Control", icon: Pill },
  "/billing": { title: "Billing & Pay", subtitle: "Invoices, Cashier Desk & Payments Settlement", icon: Receipt },
  "/finance": { title: "Finance Ledger", subtitle: "Double-Entry Accounts & General Journal", icon: Wallet },
  "/ai-assistant": { title: "AI Clinical Copilot", subtitle: "Clinical Diagnostic Intelligence & Knowledge Engine", icon: Bot },
  "/audit-logs": { title: "Audit & Access Logs", subtitle: "System Compliance, Tamper-Evident History", icon: Activity },
  "/admin-dashboard": { title: "Admin Dashboard", subtitle: "User Roles, Frappe Backend & Security Permissions", icon: ShieldCheck },
};

export function Header() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { toggleMobile } = useAppSidebar();
  const [currentDateTime, setCurrentDateTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      };
      setCurrentDateTime(now.toLocaleDateString("en-IN", options));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Don't render header on login page or when user is not logged in
  if (pathname === "/login" || !user) {
    return null;
  }

  // Find matching metadata for current path
  const currentMeta = routeMetadata[pathname] || {
    title: "Thangam Hospital ERP",
    subtitle: "Coimbatore Medical Campus",
    icon: Activity,
  };
  const Icon = currentMeta.icon;

  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-3 sm:px-6 shrink-0 z-20 shadow-2xs select-none">
      {/* Left: Mobile Toggle & Page Location Identity */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={toggleMobile}
          className="md:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Current Module Title & Icon */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0 shadow-2xs">
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold text-slate-900 leading-none truncate">
                {currentMeta.title}
              </h1>
              <span className="hidden lg:inline-flex items-center text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200/80 px-1.5 py-0.2 rounded-md">
                Coimbatore Campus
              </span>
            </div>
            <p className="hidden sm:block text-[10px] text-slate-500 font-medium leading-tight truncate mt-0.5">
              {currentMeta.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Operational Status & Live System Indicators */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Live Date Badge */}
        {currentDateTime && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-600 text-xs font-medium rounded-lg border border-slate-200 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-mono">{currentDateTime}</span>
          </div>
        )}

        {/* System Online Status Indicator */}
        <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[11px] font-semibold rounded-lg border border-emerald-200 shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="hidden xs:inline">System Live</span>
        </div>
      </div>
    </header>
  );
}
