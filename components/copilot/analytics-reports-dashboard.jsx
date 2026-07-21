"use client";

import React, { useState } from "react";
import { 
  BarChart3, Download, Printer, TrendingUp, Calendar, 
  Receipt, Stethoscope, Pill, FileText, ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AnalyticsReportsDashboard({ data, onTimeframeChange }) {
  const [activeTimeframe, setActiveTimeframe] = useState(data?.timeframe || "Daily");

  if (!data || !data.summary) return null;

  const { summary, top_doctors, chart_data, actions } = data;
  const timeframes = ["Daily", "Weekly", "Monthly", "Yearly"];

  const handleTimeframeClick = (tf) => {
    setActiveTimeframe(tf);
    onTimeframeChange?.(tf);
  };

  const handleExport = (type) => {
    if (type === "print_report") {
      window.print();
    } else {
      alert(`Exporting ${activeTimeframe} Hospital Report as ${type.toUpperCase().replace('_', ' ')}...`);
    }
  };

  return (
    <div className="space-y-5 my-4 animate-in fade-in zoom-in-95 duration-200">
      {/* Timeframe Bar & Export Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-100/80 p-3 rounded-2xl border border-slate-200 gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          <span className="text-xs font-bold text-slate-800">Hospital Analytics Report</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeClick(tf)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTimeframe === tf 
                    ? "bg-indigo-600 text-white shadow" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" onClick={() => handleExport("pdf")} className="h-8 text-xs font-bold bg-white text-slate-700">
              <Download className="w-3.5 h-3.5 mr-1 text-rose-500" /> PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExport("excel")} className="h-8 text-xs font-bold bg-white text-slate-700">
              <Download className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Excel
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExport("print_report")} className="h-8 text-xs font-bold bg-white text-slate-700">
              <Printer className="w-3.5 h-3.5 mr-1 text-slate-600" /> Print
            </Button>
          </div>
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-slate-200 shadow-sm rounded-xl p-3 bg-gradient-to-br from-indigo-50/50 to-white">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Total Revenue</span>
          <span className="text-lg font-extrabold text-slate-900 mt-1 block">{summary.total_revenue}</span>
        </Card>
        <Card className="border-slate-200 shadow-sm rounded-xl p-3 bg-gradient-to-br from-purple-50/50 to-white">
          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">Appointments</span>
          <span className="text-lg font-extrabold text-slate-900 mt-1 block">{summary.total_appointments}</span>
        </Card>
        <Card className="border-slate-200 shadow-sm rounded-xl p-3 bg-gradient-to-br from-blue-50/50 to-white">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Consultations</span>
          <span className="text-lg font-extrabold text-slate-900 mt-1 block">{summary.total_consultations}</span>
        </Card>
        <Card className="border-slate-200 shadow-sm rounded-xl p-3 bg-gradient-to-br from-emerald-50/50 to-white">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Walk-Ins</span>
          <span className="text-lg font-extrabold text-slate-900 mt-1 block">{summary.total_walkins}</span>
        </Card>
        <Card className="border-slate-200 shadow-sm rounded-xl p-3 bg-gradient-to-br from-pink-50/50 to-white">
          <span className="text-[10px] font-bold text-pink-600 uppercase tracking-wider block">Medicine Sales</span>
          <span className="text-lg font-extrabold text-slate-900 mt-1 block">{summary.medicine_sales}</span>
        </Card>
        <Card className="border-slate-200 shadow-sm rounded-xl p-3 bg-gradient-to-br from-amber-50/50 to-white">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Outstanding Bills</span>
          <span className="text-lg font-extrabold text-slate-900 mt-1 block">{summary.outstanding_bills}</span>
        </Card>
      </div>

      {/* Top Doctors & Visual Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Doctor Performance */}
        <Card className="border-slate-200 shadow-sm rounded-xl">
          <CardHeader className="py-3 px-4 bg-slate-50 border-b">
            <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-indigo-600" /> Top Performing Doctors
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 divide-y divide-slate-100 text-xs">
            {top_doctors?.map((doc, i) => (
              <div key={i} className="py-2 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 block">{doc.doctor}</span>
                  <span className="text-[10px] text-slate-500">{doc.consultations} Consultations</span>
                </div>
                <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  {doc.revenue}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Visual Trend Bar Chart Representation */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm rounded-xl flex flex-col">
          <CardHeader className="py-3 px-4 bg-slate-50 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-600" /> Revenue & Visit Trend Analysis ({activeTimeframe})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col justify-end">
            <div className="h-40 flex items-end justify-between gap-3 pt-6 border-b border-slate-200 pb-2">
              {chart_data?.labels?.map((label, idx) => {
                const val = chart_data.revenue[idx] || 10000;
                const maxVal = Math.max(...chart_data.revenue);
                const heightPct = Math.round((val / maxVal) * 100);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[9px] font-bold text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      ₹{(val / 1000).toFixed(1)}k
                    </span>
                    <div 
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-md transition-all duration-300 group-hover:from-indigo-700 group-hover:to-indigo-500 shadow-sm"
                    />
                    <span className="text-[10px] font-bold text-slate-500 mt-1">{label}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
