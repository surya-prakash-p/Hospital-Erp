"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  ClipboardList,
  Stethoscope,
  Pill,
  Receipt,
  PanelLeft,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Users,
  Bot,
  Wallet,
  Package,
  FileCheck2,
  Truck
} from "lucide-react"

// Core main menu items with role & granular permission requirements
const mainNavigation = [
  { name: "Overview Dashboard", href: "/", icon: LayoutDashboard, role: "Hospital Admin", permission: "Overview" },
  { name: "Reception Desk", href: "/reception", icon: ClipboardList, role: "Receptionist", permission: "Patient Registration" },
  { name: "Patient Registry", href: "/patient-registry", icon: Users, role: "Receptionist", permission: "Patient Registration" },
  { name: "Consultation", href: "/consultation", icon: Stethoscope, role: "Doctor", permission: "Doctor Consultations" },
  { 
    name: "Pharmacy", 
    href: "/pharmacy", 
    icon: Pill, 
    role: "Pharmacist", 
    permission: "Pharmacy Dispensing",
    children: [
      { name: "Pharmacy", href: "/pharmacy?tab=dashboard", tab: "dashboard", icon: Pill },
      { name: "Inventory", href: "/pharmacy?tab=inventory", tab: "inventory", icon: Package },
      { name: "Prescriptions Queue", href: "/pharmacy?tab=dispensing", tab: "dispensing", icon: ClipboardList },
      { name: "Compliance Records", href: "/pharmacy?tab=registers", tab: "registers", icon: FileCheck2 },
      { name: "Purchase & Receiving", href: "/pharmacy?tab=logistics", tab: "logistics", icon: Truck },
    ]
  },
  { name: "Billing & Pay", href: "/billing", icon: Receipt, role: "Billing Clerk", permission: "Billing & Invoicing" },
  { name: "Finance Ledger", href: "/finance", icon: Wallet, role: "Billing Clerk", permission: "Billing & Invoicing" },
  { name: "AI Copilot", href: "/ai-assistant", icon: Bot, role: "Doctor", permission: "Doctor Consultations" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, hasRole, hasPermission } = useAuth()
  const [collapsed, setCollapsed] = React.useState(false)
  const [pharmacyOpen, setPharmacyOpen] = React.useState(true)

  const isPharmacyRoute = pathname === "/pharmacy" || pathname.startsWith("/pharmacy/")
  const currentPharmacyTab = isPharmacyRoute ? (searchParams.get("tab") || "dashboard") : null

  React.useEffect(() => {
    if (isPharmacyRoute) {
      setPharmacyOpen(true)
    }
  }, [isPharmacyRoute])

  // Don't render sidebar on login page or when user is not logged in
  if (pathname === '/login' || !user) {
    return null
  }

  // Filter navigation links based on logged in user's roles & granted permissions
  const allowedNav = mainNavigation.filter((item) => {
    // Admin / System Manager gets everything
    if (!item.role || hasRole("Hospital Admin") || hasRole("System Manager")) {
      return true
    }

    // Check if user has explicit role OR granted granular permission
    if (hasRole(item.role)) {
      return true
    }

    if (item.permission && hasPermission(item.permission)) {
      return true
    }

    return false
  })

  const sidebarWidth = collapsed ? 64 : 240

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
            <ul className="space-y-1 px-2">
              {allowedNav.map((item) => {
                const Icon = item.icon
                const hasChildren = Boolean(item.children && item.children.length > 0)
                const isParentActive = pathname === item.href || (hasChildren && pathname.startsWith(item.href))

                if (hasChildren) {
                  return (
                    <li key={item.name} className="space-y-0.5">
                      {/* Parent expandable button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (collapsed) {
                            setCollapsed(false)
                            setPharmacyOpen(true)
                          } else {
                            setPharmacyOpen(!pharmacyOpen)
                          }
                        }}
                        className={`w-full flex items-center gap-3 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                          collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2 justify-between"
                        } ${
                          isParentActive && !pharmacyOpen
                            ? "bg-indigo-600 text-white shadow-xs"
                            : isParentActive
                            ? "bg-slate-100 text-slate-900 font-semibold"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                        title={collapsed ? item.name : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 flex-shrink-0 ${isParentActive && !pharmacyOpen ? "text-white" : isParentActive ? "text-indigo-600" : ""}`} />
                          {!collapsed && <span className="text-[11px] font-semibold">{item.name}</span>}
                        </div>
                        {!collapsed && (
                          <div className="text-slate-400 hover:text-slate-600">
                            {pharmacyOpen ? (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </div>
                        )}
                      </button>

                      {/* Expandable Child Sub-Menu */}
                      {!collapsed && pharmacyOpen && item.children && (
                        <ul className="ml-4 pl-2 space-y-0.5 border-l border-slate-200/80 my-1 py-0.5">
                          {item.children.map((child) => {
                            const ChildIcon = child.icon
                            const isChildActive = isPharmacyRoute && currentPharmacyTab === child.tab

                            return (
                              <li key={child.name}>
                                <Link
                                  href={child.href}
                                  className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs transition-all ${
                                    isChildActive
                                      ? "bg-indigo-600 text-white font-semibold shadow-2xs"
                                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
                                  }`}
                                >
                                  <ChildIcon className={`w-3.5 h-3.5 shrink-0 ${isChildActive ? "text-white" : "text-slate-400"}`} />
                                  <span className="text-[11px] truncate">{child.name}</span>
                                </Link>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </li>
                  )
                }

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-md text-sm font-medium transition-colors ${
                        collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2"
                      } ${
                        isParentActive
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
