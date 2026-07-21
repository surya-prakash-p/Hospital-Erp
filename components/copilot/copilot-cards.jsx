"use client";

import React from "react";
import { Pill, CheckCircle, ExternalLink, Download, Printer, UserRound, Stethoscope, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function CopilotCards({ cardType, cardData, smartButtons, onButtonClick }) {
  if (!cardData && (!smartButtons || smartButtons.length === 0)) return null;

  return (
    <div className="space-y-3 my-3">
      {/* 💊 Medicine Inventory Card */}
      {cardType === "medicine_card" && Array.isArray(cardData) && (
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-slate-50/50">
          <CardHeader className="py-2.5 px-4 bg-slate-100/70 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-pink-500" /> Pharmacy Inventory Stock Levels
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 divide-y divide-slate-200/60 text-xs">
            {cardData.map((item, idx) => (
              <div key={idx} className="py-2 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 block">{item.medicine}</span>
                  <span className="text-[10px] text-slate-500">Unit Rate: <strong className="text-slate-800">{item.rate}</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.stock < 100 ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  }`}>
                    {item.stock} units
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ⚡ Action Result Card */}
      {cardType === "action_result" && (
        <Card className="border-emerald-200 bg-emerald-50/40 shadow-sm rounded-xl overflow-hidden p-4 flex gap-4 items-center">
          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <h4 className="font-bold text-slate-900 text-sm">{cardData.title}</h4>
            <p className="text-slate-600 mt-0.5">{cardData.details}</p>
            {cardData.record_id && (
              <span className="inline-block mt-1 font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                ID: {cardData.record_id}
              </span>
            )}
          </div>
        </Card>
      )}

      {/* 🔘 Smart Action Buttons Row */}
      {smartButtons && smartButtons.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {smartButtons.map((btn, i) => (
            <Button
              key={i}
              size="sm"
              variant="outline"
              onClick={() => onButtonClick?.(btn)}
              className="h-8 text-xs font-semibold text-indigo-700 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 hover:border-indigo-300 transition-all gap-1.5 shadow-sm rounded-lg"
            >
              {btn.action === "download_invoice" && <Download className="w-3.5 h-3.5 text-teal-600" />}
              {btn.action === "print_invoice" && <Printer className="w-3.5 h-3.5 text-slate-600" />}
              {!btn.action && <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />}
              <span>{btn.label}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
