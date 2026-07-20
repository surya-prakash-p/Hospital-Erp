"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
  Heart,
  BedDouble,
  Activity,
  HeartHandshake,
  Droplet,
  Truck,
  ShieldCheck,
  Users,
  Box,
  Calendar,
  DoorOpen
} from "lucide-react"

// Core main menu items (with Dashboard first)
const mainNavigation = [
  { name: "Overview Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Reception Desk", href: "/reception", icon: ClipboardList },
  // { name: "Room Management", href: "/rooms", icon: DoorOpen },
  { name: "Consultation", href: "/consultation", icon: Stethoscope },
  { name: "Lab Station", href: "/lab", icon: FlaskConical },
  { name: "Pharmacy", href: "/pharmacy", icon: Pill },
  { name: "Billing & Pay", href: "/billing", icon: Receipt },
  { name: "Doctors Catalog", href: "/doctors", icon: UserRound },
]

// Extended hospital operations modules
const extendedNavigation = [
  { name: "Inpatient Care (IPD)", href: "/ipd", icon: Heart },
  { name: "Bed Management", href: "/bed-management", icon: BedDouble },
  { name: "Radiology Scans", href: "/radiology", icon: Activity },
  { name: "OT Scheduler", href: "/ot", icon: HeartHandshake },
  { name: "Blood Bank", href: "/blood-bank", icon: Droplet },
  { name: "Ambulance Dispatch", href: "/ambulance", icon: Truck },
  { name: "Insurance Claims", href: "/insurance", icon: ShieldCheck },
  { name: "Staff Directory", href: "/staff", icon: Users },
  { name: "Inventory Logistics", href: "/inventory", icon: Box },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)

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
        className="fixed top-0 left-0 bottom-0 z-30 flex flex-col border-r border-slate-200 bg-white"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-slate-200 shrink-0 overflow-hidden">
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
            <img
              src="/thangam_logo.png"
              alt="Logo"
              className="w-8 h-8 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
          </div>
          {!collapsed && (
            <div className="whitespace-nowrap">
              <h1 className="text-sm font-bold leading-tight text-slate-900 tracking-wide font-serif">
                THANGAM
              </h1>
              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">
                Hospital ERP
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4">
          {/* Main Core Menu */}
          <div>
            {!collapsed && (
              <p className="px-4 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                Main Menu
              </p>
            )}
            <ul className="space-y-0.5 px-2">
              {mainNavigation.map((item) => {
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

          {/* Extended Operations Menu */}
          {/*
          <div>
            {!collapsed && (
              <p className="px-4 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                More Operations
              </p>
            )}
            <ul className="space-y-0.5 px-2">
              {extendedNavigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-md text-sm font-medium transition-colors
                        ${collapsed ? "justify-center px-2 py-2" : "px-3 py-1.5"}
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
          */}
        </div>

        {/* Collapse toggle */}
        <div className="border-t border-slate-200 p-2 shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 rounded-md px-2 py-2 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
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
