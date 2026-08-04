"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  ClipboardList,
  Stethoscope,
  FlaskConical,
  Pill,
  Receipt,
  UserRound,
  PanelLeft,
  ChevronLeft,
  LayoutDashboard,
  Users,
  Bot,
  Wallet
} from "lucide-react"

// Core main menu items with role requirements
const mainNavigation = [
  { name: "Overview Dashboard", href: "/", icon: LayoutDashboard, role: "Hospital Admin" },
  { name: "Reception Desk", href: "/reception", icon: ClipboardList, role: "Receptionist" },
  { name: "Patient Registry", href: "/patient-registry", icon: Users, role: "Receptionist" },
  { name: "Consultation", href: "/consultation", icon: Stethoscope, role: "Doctor" },
  { name: "Lab Station", href: "/lab", icon: FlaskConical, role: "Lab Technician" },
  { name: "Pharmacy", href: "/pharmacy", icon: Pill, role: "Pharmacist" },
  { name: "Billing & Pay", href: "/billing", icon: Receipt, role: "Billing Clerk" },
  { name: "Finance Ledger", href: "/finance", icon: Wallet, role: "Billing Clerk" },
  { name: "Doctors Registry", href: "/doctors", icon: UserRound, role: "Doctor" },
  { name: "AI Copilot", href: "/ai-assistant", icon: Bot, role: "Doctor" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, hasRole } = useAuth()
  const [collapsed, setCollapsed] = React.useState(false)

  // Don't render sidebar on login page or when user is not logged in
  if (pathname === '/login' || !user) {
    return null
  }

  // Filter navigation links based on logged in user's roles
  const allowedNav = mainNavigation.filter((item) => {
    // Admin / System Manager gets everything
    if (!item.role || hasRole("Hospital Admin") || hasRole("System Manager")) {
      return true
    }
    return hasRole(item.role)
  })

  const sidebarWidth = collapsed ? 64 : 220

  return (
    <>
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          transition: "width 200ms ease, min-width 200ms ease",
        }}
        className="fixed top-0 left-0 bottom-0 z-30 flex flex-col border-r border-slate-200 bg-white shadow-xs"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-slate-200 shrink-0 overflow-hidden bg-slate-50/50">
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center p-1 shrink-0 shadow-2xs">
            <img
              src="/thangam_logo.png"
              alt="Thangam Hospital Logo"
              className="w-full h-full object-contain"
            />
          </div>
          {!collapsed && (
            <div className="whitespace-nowrap">
              <h1 className="text-sm font-extrabold leading-tight text-slate-900 tracking-wider font-sans">
                THANGAM
              </h1>
              <p className="text-[9px] text-blue-600 uppercase font-bold tracking-widest">
                Hospital ERP
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4">
          <div>
            {!collapsed && (
              <p className="px-4 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                Main Menu
              </p>
            )}
            <ul className="space-y-0.5 px-2">
              {allowedNav.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-md text-sm font-medium transition-colors
                        ${collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2"}
                        ${
                          isActive
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      title={collapsed ? item.name : undefined}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span className="text-[11px] font-semibold">{item.name}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        {/* Collapse toggle */}
        <div className="border-t border-slate-200 p-2 shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 rounded-md px-2 py-2 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            {collapsed ? (
              <PanelLeft className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-xs font-semibold">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Spacer div */}
      <div
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          transition: "width 200ms ease, min-width 200ms ease",
        }}
        className="shrink-0"
        aria-hidden="true"
      />
    </>
  )
}
