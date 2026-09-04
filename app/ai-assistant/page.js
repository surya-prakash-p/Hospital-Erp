"use client";

import { useState, useEffect } from "react";
import { 
  Bot, Sparkles, Command, ShieldCheck, Layers, LayoutDashboard, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopilotDashboard } from "@/components/copilot/copilot-dashboard";
import { CopilotChat } from "@/components/copilot/copilot-chat";
import { GlobalSearchModal } from "@/components/copilot/global-search-modal";

export default function RAGAIAssistantPage() {
  const [activeView, setActiveView] = useState("copilot"); // "copilot" or "dashboard"
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [activeQuery, setActiveQuery] = useState("");

  const handleGlobalSearchSelect = (query) => {
    setActiveQuery(query);
    setActiveView("copilot");
  };

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto h-[calc(100vh-4.5rem)]">
      {/* Copilot controls */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-3 shadow-xl flex justify-end items-center shrink-0 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-3 z-10">
          <Button
            variant="outline"
            onClick={() => setIsSearchModalOpen(true)}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs h-9 gap-2 shadow-sm rounded-xl"
          >
            <Command className="w-3.5 h-3.5" />
            <span>AI Search</span>
            <kbd className="bg-white/20 px-1.5 py-0.5 text-[9px] rounded font-mono">Ctrl+K</kbd>
          </Button>

          <div className="flex bg-white/10 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveView("copilot")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeView === "copilot" ? "bg-indigo-600 text-white shadow" : "text-slate-300 hover:text-white"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Copilot
            </button>
            <button
              onClick={() => setActiveView("dashboard")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeView === "dashboard" ? "bg-indigo-600 text-white shadow" : "text-slate-300 hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> AI Insights
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {activeView === "dashboard" ? (
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <CopilotDashboard onQuickSearch={handleGlobalSearchSelect} />
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <CopilotChat initialQuery={activeQuery} />
        </div>
      )}

      {/* Ctrl + K Command Palette Modal */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectSearch={handleGlobalSearchSelect}
      />
    </div>
  );
}
