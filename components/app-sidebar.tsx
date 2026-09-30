"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useAppSidebar } from "@/components/sidebar-context";
import { ProfileModal } from "@/components/profile-modal";
import {
  ClipboardList,
  Stethoscope,
  Pill,
  Receipt,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  Users,
  Bot,
  Wallet,
  LogOut,
  ShieldCheck,
  Activity,
  User as UserIcon,
  ChevronsUpDown,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Core main menu items with role & granular permission requirements
const mainNavigation = [
  { name: "Overview Dashboard", href: "/", icon: LayoutDashboard, role: "Hospital Admin", permission: "Overview" },
  { name: "Reception Desk", href: "/reception", icon: ClipboardList, role: "Receptionist", permission: "Patient Registration" },
  { name: "Patient Registry", href: "/patient-registry", icon: Users, role: "Receptionist", permission: "Patient Registration" },
  { name: "Consultation", href: "/consultation", icon: Stethoscope, role: "Doctor", permission: "Doctor Consultations" },
  { name: "Pharmacy", href: "/pharmacy", icon: Pill, role: "Pharmacist", permission: "Pharmacy Dispensing" },
  { name: "Billing & Pay", href: "/billing", icon: Receipt, role: "Billing Clerk", permission: "Billing & Invoicing" },
  { name: "Finance Ledger", href: "/finance", icon: Wallet, role: "Billing Clerk", permission: "Billing & Invoicing" },
  { name: "AI Copilot", href: "/ai-assistant", icon: Bot, role: "Doctor", permission: "Doctor Consultations" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, hasRole, hasPermission } = useAuth();
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useAppSidebar();
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);

  // Don't render sidebar on login page or when user is not logged in
  if (pathname === "/login" || !user) {
    return null;
  }

  // Permission check for audit logs
  const canViewAuditLogs = Boolean(
    hasRole?.("Hospital Admin") ||
    hasRole?.("System Manager") ||
    hasPermission?.("Audit Logs") ||
    hasPermission?.("Audit") ||
    user?.permissions?.includes("*") ||
    user?.roles?.includes("Hospital Admin") ||
    user?.roles?.includes("System Manager")
  );

  const isAdmin = Boolean(
    user?.roles?.includes("Hospital Admin") ||
    user?.roles?.includes("System Manager") ||
    hasRole?.("Hospital Admin") ||
    hasRole?.("System Manager")
  );

  // Filter navigation links based on user roles and permissions
  const allowedNav = mainNavigation.filter((item) => {
    if (!item.role || hasRole("Hospital Admin") || hasRole("System Manager")) {
      return true;
    }
    if (hasRole(item.role)) {
      return true;
    }
    if (item.permission && hasPermission(item.permission)) {
      return true;
    }
    return false;
  });

  const sidebarWidth = collapsed ? 64 : 240;

  const displayName = user?.full_name || user?.name || "Surya Prakash";
  const displayRole = user?.roles?.length ? user.roles[0] : "Hospital Admin";
  const userInitials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "SP";

  // Reusable Navigation Link Renderer
  const renderNavLinks = (isMobileView = false) => (
    <ul className="space-y-1 px-2">
      {allowedNav.map((item) => {
        const Icon = item.icon;
        const isParentActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

        const linkContent = (
          <Link
            href={item.href}
            onClick={() => {
              if (isMobileView) setMobileOpen(false);
            }}
            className={`flex items-center gap-3 rounded-lg text-xs transition-colors duration-150 ${
              !isMobileView && collapsed ? "justify-center p-2.5" : "px-3 py-2.5"
            } ${
              isParentActive
                ? "bg-indigo-600 text-white font-semibold shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {(isMobileView || !collapsed) && (
              <span className="truncate leading-tight text-[12px]">{item.name}</span>
            )}
          </Link>
        );

        if (!isMobileView && collapsed) {
          return (
            <li key={item.name}>
              <Tooltip>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={12} className="text-xs font-semibold">
                  {item.name}
                </TooltipContent>
              </Tooltip>
            </li>
          );
        }

        return <li key={item.name}>{linkContent}</li>;
      })}
    </ul>
  );

  // Reusable User Profile Dropdown Button
  const renderUserProfile = (isMobileView = false) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`w-full flex items-center rounded-xl p-2 transition-all duration-150 outline-none cursor-pointer border border-transparent hover:border-slate-200 hover:bg-slate-100/80 group ${
            !isMobileView && collapsed ? "justify-center" : "justify-between gap-2.5"
          }`}
          title={!isMobileView && collapsed ? `${displayName} (${displayRole})` : undefined}
          aria-label="User account and profile menu"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar Circle */}
            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-gradient-to-br from-indigo-600 to-purple-700 text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
              {user?.avatar || user?.doctor_image ? (
                <img
                  src={user.avatar || user.doctor_image}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{userInitials}</span>
              )}
            </div>

            {/* Name & Role (Expanded / Mobile) */}
            {(isMobileView || !collapsed) && (
              <div className="text-left min-w-0 flex-1">
                <div className="font-bold text-slate-900 text-xs leading-tight truncate group-hover:text-indigo-600 transition-colors">
                  {displayName}
                </div>
                <div className="text-[10px] text-slate-500 font-medium leading-tight truncate mt-0.5">
                  {displayRole}
                </div>
              </div>
            )}
          </div>

          {(isMobileView || !collapsed) && (
            <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-60 rounded-xl p-1.5 shadow-xl border border-slate-200 bg-white z-[100]"
        align={!isMobileView && collapsed ? "start" : "end"}
        side={!isMobileView && collapsed ? "right" : "top"}
        sideOffset={8}
      >
        <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-slate-900 border-b border-slate-100 mb-1">
          <div className="font-bold text-slate-900 text-sm leading-tight truncate">{displayName}</div>
          <div className="text-[11px] font-normal text-slate-500 mt-0.5 truncate">{user?.email || "user@thangamhospital.com"}</div>
          <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            {displayRole}
          </span>
        </DropdownMenuLabel>

        {isAdmin && (
          <DropdownMenuItem
            onClick={() => {
              if (isMobileView) setMobileOpen(false);
              router.push("/admin-dashboard");
            }}
            className="flex items-center gap-2.5 px-3 py-2 text-xs text-indigo-950 font-semibold hover:bg-indigo-50 hover:text-indigo-700 rounded-lg cursor-pointer transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Admin Dashboard</span>
          </DropdownMenuItem>
        )}

        {canViewAuditLogs && (
          <DropdownMenuItem
            onClick={() => {
              if (isMobileView) setMobileOpen(false);
              router.push("/audit-logs");
            }}
            className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-800 font-semibold hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
          >
            <Activity className="w-4 h-4 text-slate-600 shrink-0" />
            <span>Audit &amp; Access Logs</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onClick={() => {
            if (isMobileView) setMobileOpen(false);
            setIsProfileModalOpen(true);
          }}
          className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-800 font-semibold hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
        >
          <UserIcon className="w-4 h-4 text-slate-600 shrink-0" />
          <span>Account &amp; Profile Details</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1 border-slate-100" />

        <DropdownMenuItem
          onClick={() => {
            if (isMobileView) setMobileOpen(false);
            logout();
          }}
          className="flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 font-bold hover:bg-rose-50 hover:text-rose-700 rounded-lg cursor-pointer transition-colors"
        >
          <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <TooltipProvider delayDuration={150}>
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          DESKTOP SIDEBAR
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <aside
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          transition: "width 200ms cubic-bezier(0.4, 0, 0.2, 1), min-width 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        className="hidden md:flex fixed top-0 left-0 bottom-0 z-30 flex-col border-r border-slate-200 bg-white shadow-2xs overflow-hidden select-none"
      >
        {/* Top Header with Brand and Toggle Button */}
        <div className="h-14 border-b border-slate-200 px-3 flex items-center justify-between shrink-0 bg-slate-50/40">
          {/* Logo & Branding */}
          <Link
            href="/"
            className="flex items-center gap-2.5 min-w-0 overflow-hidden outline-none group"
            title="Thangam Hospital ERP"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-1 shrink-0 shadow-2xs group-hover:border-indigo-300 transition-colors">
              <img
                src="/thangam_logo.png"
                alt="Thangam Hospital Logo"
                className="w-full h-full object-contain"
              />
            </div>
            {!collapsed && (
              <div className="whitespace-nowrap overflow-hidden">
                <h1 className="text-xs font-black leading-tight text-slate-900 tracking-wider font-sans">
                  THANGAM
                </h1>
                <p className="text-[9px] text-indigo-600 uppercase font-bold tracking-widest leading-none mt-0.5">
                  Hospital ERP
                </p>
              </div>
            )}
          </Link>

          {/* Top Sidebar Toggle Button (Icon-Only, No "Collapse" / "Expand" text) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggleCollapsed}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer outline-none shrink-0"
                aria-label={collapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
              >
                {collapsed ? (
                  <PanelLeftOpen className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12} className="text-xs font-semibold">
              {collapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto min-h-0 py-3 space-y-3">
          <div>
            {!collapsed && (
              <p className="px-3.5 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                Main Menu
              </p>
            )}
            {renderNavLinks(false)}
          </div>
        </div>

        {/* Pinned Bottom User Profile Section (ChatGPT-Style) */}
        <div className="border-t border-slate-200 p-2 bg-slate-50/60 shrink-0">
          {renderUserProfile(false)}
        </div>
      </aside>

      {/* Spacer div to keep main content perfectly aligned without jumping */}
      <div
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          transition: "width 200ms cubic-bezier(0.4, 0, 0.2, 1), min-width 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        className="hidden md:block shrink-0"
        aria-hidden="true"
      />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MOBILE DRAWER SIDEBAR (Slide-Out on Mobile Devices)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Slide-out Drawer */}
          <aside className="relative w-72 max-w-[80vw] bg-white h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {/* Mobile Header */}
            <div className="h-14 border-b border-slate-200 px-4 flex items-center justify-between shrink-0 bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-1 shrink-0 shadow-2xs">
                  <img
                    src="/thangam_logo.png"
                    alt="Thangam Hospital Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xs font-black leading-tight text-slate-900 tracking-wider">
                    THANGAM
                  </h1>
                  <p className="text-[9px] text-indigo-600 uppercase font-bold tracking-widest leading-none mt-0.5">
                    Hospital ERP
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <div className="flex-1 overflow-y-auto min-h-0 py-3 space-y-3">
              <p className="px-3.5 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                Main Menu
              </p>
              {renderNavLinks(true)}
            </div>

            {/* Mobile Pinned Profile */}
            <div className="border-t border-slate-200 p-2.5 bg-slate-50/60 shrink-0">
              {renderUserProfile(true)}
            </div>
          </aside>
        </div>
      )}

      {/* Comprehensive Profile & Account Details Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </TooltipProvider>
  );
}
