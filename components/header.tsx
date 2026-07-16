"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const handleRefresh = () => {
    // Simply reload the window to pull fresh data on the current page
    window.location.reload();
  };

  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
      <span className="text-sm font-semibold text-slate-700 tracking-wide font-sans">Thangam Hospitals ERP</span>
      
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleRefresh} 
          className="w-8 h-8 text-slate-600 hover:text-slate-900 border-slate-200"
          title="Refresh current page"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>
    </header>
  );
}
