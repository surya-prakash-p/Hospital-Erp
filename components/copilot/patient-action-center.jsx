"use client";

import React from "react";
import { 
  UserRound, PlusCircle, Activity, Pill, FlaskConical, 
  FileText, Receipt, Download, Printer, Calendar, ExternalLink,
  CheckCircle, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PatientActionCenter({ data, onActionClick }) {
  if (!data || !data.patient) return null;

  const { patient, quick_actions } = data;
  const pDocName = patient.patient_doc_name || patient.patient_id;

  const iconMap = {
    PlusCircle, UserRound, Activity, Pill, FlaskConical,
    FileText, Receipt, Download, Printer, Calendar
  };

  return (
    <Card className="border-l-4 border-l-indigo-600 border-slate-200 shadow-md rounded-2xl overflow-hidden bg-gradient-to-r from-slate-50 via-white to-indigo-50/20 my-4 animate-in fade-in zoom-in-95 duration-200 relative">
      {/* Hidden Metadata for Frappe Desk & Copilot Actions */}
      <div 
        className="hidden" 
        data-doctype="Hospital Patient" 
        data-docname={pDocName}
        data-patient-id={patient.patient_id}
        data-mobile={patient.mobile_number}
      />

      {/* Patient Header Bar */}
      <CardHeader className="py-4 px-6 border-b border-slate-200/80 bg-slate-50/80 flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md border-2 border-white">
            {patient.patient_name?.[0]?.toUpperCase() || "P"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold text-slate-900">{patient.patient_name}</CardTitle>
              <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {patient.status || "Active"}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Doc Name: <span className="font-mono font-bold text-slate-800">{pDocName}</span> • Gender: <strong>{patient.gender}</strong> • Age: <strong>{patient.age}</strong> • Mobile: <strong className="text-slate-800">{patient.mobile_number}</strong>
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => onActionClick?.({ url: `/patient/${encodeURIComponent(pDocName)}`, doc_name: pDocName })}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 gap-1.5 shadow-sm rounded-xl"
        >
          Open Profile <ExternalLink className="w-3.5 h-3.5" />
        </Button>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Patient Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-100/70 text-xs border border-slate-200/60">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Blood Group</span>
            <span className="font-extrabold text-rose-600">{patient.blood_group}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Assigned Doctor</span>
            <span className="font-bold text-slate-800">{patient.assigned_doctor}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Department</span>
            <span className="font-semibold text-slate-700">{patient.department}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Next Check-up Date</span>
            <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              {patient.next_checkup_date || "Not Scheduled"}
            </span>
          </div>
        </div>

        {/* Dynamic Prescriptions & Lab Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 💊 Prescriptions */}
          <Card className="border-slate-200 shadow-sm rounded-xl">
            <CardHeader className="py-2.5 px-4 bg-slate-50 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-pink-500" /> Prescriptions & Medications
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 text-xs divide-y divide-slate-100">
              {patient.prescriptions?.map((p, i) => (
                <div key={i} className="py-1.5 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 block">{p.medicine}</span>
                    <span className="text-[10px] text-slate-500">{p.dosage} ({p.duration})</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{p.rate}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 💳 Billing */}
          <Card className="border-slate-200 shadow-sm rounded-xl">
            <CardHeader className="py-2.5 px-4 bg-slate-50 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-teal-600" /> Billing & Invoice
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Invoice ID:</span>
                <span className="font-mono font-bold text-slate-800">{patient.billing?.invoice_id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Paid Amount:</span>
                <span className="font-bold text-emerald-600">{patient.billing?.paid}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 📈 Patient Clinical Journey Timeline */}
        {patient.timeline && (
          <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="py-2.5 px-4 bg-slate-50 border-b">
              <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-600" /> Patient Station Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0" />
                {patient.timeline.map((step, idx) => (
                  <div key={idx} className="relative z-10 flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shadow ${
                      step.completed 
                        ? "bg-emerald-600 text-white" 
                        : "bg-white border-2 border-indigo-600 text-indigo-600"
                    }`}>
                      {step.completed ? <CheckCircle className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                    <span className="text-[10px] font-bold text-slate-800 mt-1.5 text-center max-w-[85px] leading-tight">
                      {step.stage}
                    </span>
                    <span className="text-[9px] text-slate-400">{step.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 11 Quick Action Buttons */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-indigo-600" /> Patient Direct Quick Actions
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {quick_actions?.map((act) => {
              const IconComp = iconMap[act.icon] || ExternalLink;
              return (
                <Button
                  key={act.id}
                  size="sm"
                  variant="outline"
                  onClick={() => onActionClick?.(act)}
                  className="h-9 text-xs font-semibold text-slate-700 border-slate-200 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all justify-start px-3 rounded-xl gap-2 shadow-sm"
                >
                  <IconComp className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate">{act.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
