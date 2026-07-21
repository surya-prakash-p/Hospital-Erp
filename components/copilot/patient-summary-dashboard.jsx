"use client";

import React from "react";
import { 
  UserRound, Calendar, Pill, FlaskConical, Receipt, 
  Activity, CheckCircle, Clock, ExternalLink, Download, PlusCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PatientSummaryDashboard({ data, onButtonClick }) {
  if (!data || !data.patient_info) return null;

  const { patient_info, appointments, prescriptions, lab_reports, billing, timeline } = data;

  return (
    <div className="space-y-6 my-4 animate-in fade-in zoom-in-95 duration-200">
      {/* 👤 Patient Information Bar */}
      <Card className="border-l-4 border-l-indigo-600 border-slate-200 shadow-md rounded-xl overflow-hidden bg-gradient-to-r from-slate-50 to-indigo-50/30">
        <CardHeader className="py-3 px-5 border-b border-slate-200/60 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow">
              {patient_info.name?.[0] || "P"}
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                {patient_info.name}
                <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-emerald-200">
                  {patient_info.status || "Active"}
                </span>
              </CardTitle>
              <p className="text-xs text-slate-500 font-medium">
                {patient_info.gender} • {patient_info.age} Yrs • Mobile: {patient_info.mobile}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => onButtonClick?.({ url: `/patient/${patient_info.mobile}` })}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-8 gap-1.5 shadow-sm"
          >
            Open Patient Record <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </CardHeader>

        <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Blood Group</span>
            <span className="font-bold text-rose-600">{patient_info.blood_group}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Attending Doctor</span>
            <span className="font-bold text-slate-800">{patient_info.doctor}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Department</span>
            <span className="font-semibold text-slate-700">{patient_info.department}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Next Check-up Date</span>
            <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              {appointments.next_checkup_date || "Not Scheduled"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Grid of 4 Core Cards: Appointments, Prescriptions, Lab Reports, Billing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 📅 Appointments */}
        <Card className="border-slate-200 shadow-sm rounded-xl">
          <CardHeader className="py-2.5 px-4 bg-slate-50 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" /> Appointments & Follow-ups
            </CardTitle>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {appointments.completed} Completed
            </span>
          </CardHeader>
          <CardContent className="p-3 text-xs space-y-2">
            <div className="bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase text-indigo-600">Upcoming Visit</span>
                <p className="font-bold text-slate-800 mt-0.5">{appointments.upcoming}</p>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onButtonClick?.({ action: "book_followup" })} 
                className="h-7 text-[10px] font-bold text-indigo-700 border-indigo-200 bg-white hover:bg-indigo-50"
              >
                <PlusCircle className="w-3 h-3 mr-1" /> Follow-up
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 💊 Prescriptions */}
        <Card className="border-slate-200 shadow-sm rounded-xl">
          <CardHeader className="py-2.5 px-4 bg-slate-50 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-pink-500" /> Prescribed Medications
            </CardTitle>
            <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">
              {prescriptions?.length || 0} Items
            </span>
          </CardHeader>
          <CardContent className="p-3 text-xs divide-y divide-slate-100">
            {prescriptions?.map((med, i) => (
              <div key={i} className="py-1.5 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-800 block">{med.medicine}</span>
                  <span className="text-[10px] text-slate-500">{med.dosage} ({med.duration})</span>
                </div>
                <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px]">{med.rate}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 🧪 Lab Reports */}
        <Card className="border-slate-200 shadow-sm rounded-xl">
          <CardHeader className="py-2.5 px-4 bg-slate-50 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-purple-600" /> Diagnostic Lab Reports
            </CardTitle>
            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
              {lab_reports?.length || 0} Scans
            </span>
          </CardHeader>
          <CardContent className="p-3 text-xs divide-y divide-slate-100">
            {lab_reports?.map((lab, i) => (
              <div key={i} className="py-1.5 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-800 block">{lab.test_name}</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">{lab.result}</span>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => onButtonClick?.({ url: "/lab" })} 
                  className="h-6 text-[10px] text-purple-700 hover:bg-purple-50 px-2"
                >
                  View Scan
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 💳 Billing */}
        <Card className="border-slate-200 shadow-sm rounded-xl">
          <CardHeader className="py-2.5 px-4 bg-slate-50 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-teal-600" /> Billing & Payment Status
            </CardTitle>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Paid: {billing.paid}
            </span>
          </CardHeader>
          <CardContent className="p-3 text-xs flex justify-between items-center">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Invoice ID</span>
              <span className="font-mono font-bold text-slate-800">{billing.invoice_id}</span>
            </div>
            <Button 
              size="sm" 
              onClick={() => onButtonClick?.({ url: "/billing" })} 
              className="bg-teal-600 hover:bg-teal-700 text-white h-7 text-[10px] font-bold gap-1 shadow-sm"
            >
              <Download className="w-3 h-3" /> Download Invoice
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 📈 Interactive Patient Journey Timeline */}
      <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="py-3 px-5 bg-slate-50 border-b">
          <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            Patient Clinical Journey & Station Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0" />
            {timeline?.map((step, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center group">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow transition-all ${
                  step.completed 
                    ? "bg-emerald-600 text-white ring-4 ring-emerald-50" 
                    : "bg-white border-2 border-indigo-600 text-indigo-600"
                }`}>
                  {step.completed ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                </div>
                <span className="text-[10px] font-bold text-slate-800 mt-2 text-center max-w-[90px] leading-tight">
                  {step.stage}
                </span>
                <span className="text-[9px] text-slate-400 font-medium">{step.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
