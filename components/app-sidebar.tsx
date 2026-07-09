"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Stethoscope,
  FlaskConical,
  Pill,
  Receipt,
  PanelLeft,
  ChevronLeft,
} from "lucide-react"

const navigation = [
  { name: "Reception Desk", href: "/", icon: LayoutDashboard },
  { name: "Consultation", href: "/consultation", icon: Stethoscope },
  { name: "Lab Station", href: "/lab", icon: FlaskConical },
  { name: "Pharmacy", href: "/pharmacy", icon: Pill },
  { name: "Billing & Pay", href: "/billing", icon: Receipt },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)

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
              <h1 className="text-sm font-bold leading-tight text-slate-900 tracking-wide">
                THANGAM
              </h1>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">
                Hospital ERP
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {!collapsed && (
            <p className="px-4 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Menu
            </p>
          )}
          <ul className="space-y-0.5 px-2">
            {navigation.map((item) => {
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
                          ? "bg-slate-900 text-white"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

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
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Spacer div - takes up space equal to sidebar width so content is pushed right */}
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
