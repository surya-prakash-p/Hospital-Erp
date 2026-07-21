"use client";

import React, { useState, useEffect } from "react";
import { Search, UserRound, Stethoscope, Pill, Receipt, Sparkles, X, Clock, Command } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function GlobalSearchModal({ isOpen, onClose, onSelectSearch }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dynamicSuggestions, setDynamicSuggestions] = useState([]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (searchTerm.trim().length >= 1) {
      fetch(`/api/copilot/autocomplete?q=${encodeURIComponent(searchTerm.trim())}`)
        .then(res => res.json())
        .then(data => setDynamicSuggestions(data.suggestions || []))
        .catch(() => setDynamicSuggestions([]));
    } else {
      setDynamicSuggestions([]);
    }
  }, [searchTerm]);

  if (!isOpen) return null;

  const defaultQuickQueries = [
    { title: "Search Patient by Name", type: "Search Instruction", icon: UserRound, desc: "Type any patient name (e.g. Yokesh, Arun)" },
    { title: "Search Patient ID or Mobile", type: "Search Instruction", icon: UserRound, desc: "Type PAT-00025 or 9876543210" },
    { title: "How many patients are waiting?", type: "Operations", icon: Stethoscope, desc: "Check waiting queues" },
    { title: "Show low stock medicines", type: "Pharmacy", icon: Pill, desc: "Check inventory alerts" },
    { title: "Show today's report", type: "Analytics", icon: Receipt, desc: "Generate financial report" }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150">
      <Card className="max-w-2xl w-full border-slate-200 shadow-2xl rounded-2xl bg-white overflow-hidden flex flex-col">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/70">
          <Search className="w-5 h-5 text-indigo-600 shrink-0" />
          <Input
            autoFocus
            type="text"
            placeholder="Type any Patient Name, Patient ID, Mobile Number, or operational query..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchTerm.trim()) {
                onSelectSearch(searchTerm);
                onClose();
              }
            }}
            className="border-none shadow-none focus-visible:ring-0 text-sm bg-transparent h-9 flex-1"
          />
          <span className="text-[10px] font-mono text-slate-400 border border-slate-200 bg-white px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
            <Command className="w-3 h-3" /> K
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Patient & Operations Suggestions */}
        <CardContent className="p-4 space-y-2 max-h-[60vh] overflow-y-auto divide-y divide-slate-100 text-xs">
          {dynamicSuggestions.length > 0 ? (
            dynamicSuggestions.map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  onSelectSearch(item.query);
                  onClose();
                }}
                className="py-2.5 px-3 rounded-xl hover:bg-indigo-50/60 cursor-pointer transition-colors flex justify-between items-center group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100/70 text-indigo-700 flex items-center justify-center shrink-0">
                    <UserRound className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-sm group-hover:text-indigo-900 block">{item.title}</span>
                    <span className="text-[10px] text-slate-500">{item.subtitle}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                  {item.type}
                </span>
              </div>
            ))
          ) : (
            defaultQuickQueries.map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  if (!item.title.startsWith("Search Patient")) {
                    onSelectSearch(item.title);
                    onClose();
                  }
                }}
                className="py-2.5 px-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors flex justify-between items-center group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">{item.title}</span>
                    <span className="text-[10px] text-slate-500">{item.desc}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  {item.type}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
