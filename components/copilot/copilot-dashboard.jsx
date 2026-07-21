"use client";

import React, { useState } from "react";
import { 
  Calendar, Receipt, Pill, UserRound, TrendingUp, AlertTriangle, 
  Sparkles, Bell, ShieldAlert, Activity, CheckCircle, Search, ChevronRight 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function CopilotDashboard({ onQuickSearch, onRoleChange }) {
  const [activeRole, setActiveRole] = useState("admin");

  const roles = [
    { id: "admin", label: "👑 Hospital Admin" },
    { id: "doctor", label: "🩺 Doctor View" },
    { id: "receptionist", label: "📋 Receptionist View" },
    { id: "pharmacist", label: "💊 Pharmacist View" },
    { id: "billing", label: "💳 Billing View" }
  ];

  const kpis = [
    { title: "Today's Appointments", value: "14", icon: Calendar, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Pending Bills", value: "3", icon: Receipt, color: "text-teal-600", bg: "bg-teal-50" },
    { title: "Low Stock Medicines", value: "2", icon: Pill, color: "text-amber-500", bg: "bg-amber-50" },
    { title: "Doctors Available", value: "3", icon: UserRound, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Revenue Today", value: "₹18,500", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Emergency Check-Ins", value: "1", icon: ShieldAlert, color: "text-rose-500", bg: "bg-rose-50" }
  ];

  const proactiveInsights = [
    { type: "warning", title: "Medicine Stock Alert", message: "Amoxicillin 500mg (80 units) is below reorder level (100 units).", action: "Restock" },
    { type: "info", title: "High Consultation Load", message: "Dr. Vignesh has 5 pending consultations in queue.", action: "View Queue" },
    { type: "alert", title: "Emergency Patient Check-In", message: "Patient 'Trauma ER' is waiting for doctor assignment.", action: "Assign Doctor" }
  ];

  return (
    <div className="space-y-6 my-2">
      {/* Role Switcher */}
      <div className="flex justify-between items-center bg-slate-100/70 p-2 rounded-xl border border-slate-200/60">
        <span className="text-xs font-bold text-slate-700 pl-2">Role Experience:</span>
        <div className="flex gap-1.5 overflow-x-auto">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setActiveRole(r.id);
                onRoleChange?.(r.id);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeRole === r.id
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi, idx) => (
          <Card key={idx} className="border-slate-200 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center ${kpi.color} shrink-0`}>
                <kpi.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block truncate">{kpi.title}</span>
                <span className="text-base font-extrabold text-slate-900 mt-0.5 block">{kpi.value}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Proactive AI Insights Banner */}
      <Card className="border-amber-200 bg-amber-50/40 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="py-2.5 px-4 bg-amber-100/50 border-b border-amber-200 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" /> Proactive AI Clinical & Operations Insights
          </CardTitle>
          <span className="text-[10px] font-bold bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded-full">
            3 Active Alerts
          </span>
        </CardHeader>
        <CardContent className="p-3 divide-y divide-amber-200/50 text-xs">
          {proactiveInsights.map((item, idx) => (
            <div key={idx} className="py-2 flex justify-between items-center gap-4">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className={`w-4 h-4 shrink-0 ${item.type === "alert" ? "text-rose-500" : "text-amber-600"}`} />
                <div>
                  <span className="font-bold text-slate-900">{item.title}: </span>
                  <span className="text-slate-700">{item.message}</span>
                </div>
              </div>
              <Button size="sm" variant="outline" className="h-6 text-[10px] font-bold text-amber-900 border-amber-300 bg-white hover:bg-amber-100 shrink-0">
                {item.action}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
