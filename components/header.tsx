"use client";

import { useEffect, useState } from "react";
import { Database, RefreshCw, LogIn, LogOut, CheckCircle, AlertTriangle } from "lucide-react";
import { getDbMode, setDbMode, checkConnection } from "@/lib/hospital-service";
import { Button } from "@/components/ui/button";

export function Header() {
  const [dbMode, setDbModeState] = useState("simulator");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function initMode() {
      const mode = await getDbMode();
      setDbModeState(mode);
    }
    initMode();
  }, []);

  const toggleDbMode = async () => {
    setLoading(true);
    if (dbMode === "frappe") {
      setDbMode("simulator");
      setDbModeState("simulator");
      // Trigger a page reload to refresh all components
      window.location.reload();
    } else {
      const connected = await checkConnection();
      if (connected) {
        setDbMode("frappe");
        setDbModeState("frappe");
        window.location.reload();
      } else {
        alert("Unable to connect to the Frappe Bench server at http://127.0.0.1:8000. Please make sure the bench server is running!");
      }
    }
    setLoading(false);
  };

  const handleRefresh = () => {
    // Simply reload the window to pull fresh data on the current page
    window.location.reload();
  };

  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
      <span className="text-sm font-semibold text-slate-700 tracking-wide font-sans">Thangam Hospitals ERP</span>
      
      <div className="flex items-center gap-3">
        {/* Connection status badge */}
        <div 
          onClick={toggleDbMode}
          className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold cursor-pointer select-none transition-colors
            ${dbMode === "frappe" 
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
              : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"}`}
          title="Click to toggle database mode"
        >
          <span className={`w-2 h-2 rounded-full ${dbMode === "frappe" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
          <span className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5" />
            {dbMode === "frappe" ? "Frappe Bench" : "Simulator Mode"}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh} 
            className="w-8 h-8 text-slate-600 hover:text-slate-900 border-slate-200"
            title="Refresh current page"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>

          {dbMode === "frappe" ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleDbMode} 
              disabled={loading}
              className="h-8 text-xs gap-1.5 text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              Disconnect
            </Button>
          ) : (
            <Button 
              size="sm" 
              onClick={toggleDbMode} 
              disabled={loading}
              className="h-8 text-xs gap-1.5 bg-slate-900 hover:bg-slate-800 text-white"
            >
              <LogIn className="w-3.5 h-3.5" />
              Connect Frappe
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
