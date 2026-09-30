"use client";

import React, { Suspense } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/header";

export function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPharmacy = pathname?.startsWith("/pharmacy");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Suspense fallback={null}>
        <AppSidebar />
      </Suspense>
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {!isPharmacy && <Header />}
        <div
          className={`flex-1 min-h-0 ${
            isPharmacy
              ? "p-0 overflow-hidden flex flex-col h-full w-full"
              : "p-3 sm:p-5 overflow-y-auto"
          }`}
        >
          <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading module...</div>}>
            {children}
          </Suspense>
        </div>
      </main>
    </div>
  );
}
