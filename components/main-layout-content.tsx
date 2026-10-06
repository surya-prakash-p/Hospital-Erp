"use client";

import React, { Suspense, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/header";
import { GlobalSearchModal } from "@/components/copilot/global-search-modal";
import { ShortcutsGuideModal } from "@/components/shortcuts-guide-modal";

export function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPharmacy = pathname?.startsWith("/pharmacy");

  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isShortcutsGuideOpen, setIsShortcutsGuideOpen] = useState(false);

  // Global keyboard shortcuts (Ctrl + K, Alt + 1-5, Alt + G, Alt + Shift + S, ? / F1)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      const isAlt = e.altKey;
      const isShift = e.shiftKey;
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const key = e.key;

      const target = e.target as HTMLElement;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      // Ctrl + K -> Global Search (Works everywhere)
      if (isCtrlOrMeta && key.toLowerCase() === "k") {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
        return;
      }

      // If on /pharmacy, let pharmacy module's specialized handler manage pharmacy internal hotkeys
      if (pathname?.startsWith("/pharmacy")) {
        return;
      }

      // ? or F1 -> Shortcuts Guide when not typing
      if (!isInput && (key === "?" || key === "F1")) {
        e.preventDefault();
        setIsShortcutsGuideOpen((prev) => !prev);
        return;
      }

      // Alt + 1..5 -> Direct Navigation to Pharmacy Sub-Modules
      if (isAlt && !isCtrlOrMeta && ["1", "2", "3", "4", "5"].includes(key)) {
        e.preventDefault();
        const tabMap: Record<string, string> = {
          "1": "dashboard",
          "2": "inventory",
          "3": "dispensing",
          "4": "registers",
          "5": "logistics",
        };
        const targetTab = tabMap[key];
        if (targetTab) {
          router.push(`/pharmacy?tab=${targetTab}`);
        }
        return;
      }

      // Alt + I -> Navigate to Pharmacy Purchase Inward & Stock Entry
      if (isAlt && !isCtrlOrMeta && !isShift && key.toLowerCase() === "i") {
        e.preventDefault();
        router.push("/pharmacy?tab=purchase-inward");
        return;
      }

      // Alt + G -> Navigate to Pharmacy Purchase Orders
      if (isAlt && !isCtrlOrMeta && !isShift && key.toLowerCase() === "g") {
        e.preventDefault();
        router.push("/pharmacy?tab=logistics&action=generate_po");
        return;
      }

      // Alt + Shift + S -> Navigate to Pharmacy Add Drug Supplier
      if (isAlt && isShift && !isCtrlOrMeta && key.toLowerCase() === "s") {
        e.preventDefault();
        router.push("/pharmacy?tab=logistics&action=add_supplier");
        return;
      }

      // Alt + A -> Navigate to Add Medicine
      if (isAlt && !isCtrlOrMeta && !isShift && key.toLowerCase() === "a") {
        e.preventDefault();
        router.push("/pharmacy?tab=inventory&action=add_medicine");
        return;
      }

      // Alt + L -> Low Stock Filter
      if (isAlt && !isCtrlOrMeta && !isShift && key.toLowerCase() === "l") {
        e.preventDefault();
        router.push("/pharmacy?tab=inventory&filter=low_stock");
        return;
      }

      // Alt + E -> Expiring Filter
      if (isAlt && !isCtrlOrMeta && !isShift && key.toLowerCase() === "e") {
        e.preventDefault();
        router.push("/pharmacy?tab=inventory&filter=expiring");
        return;
      }

      // Alt + D -> Download Reports
      if (isAlt && !isCtrlOrMeta && !isShift && key.toLowerCase() === "d") {
        e.preventDefault();
        router.push("/pharmacy?tab=inventory&action=download_reports");
        return;
      }
    };

    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, [pathname, router]);

  const handleGlobalSearchSelect = (query: string) => {
    setIsGlobalSearchOpen(false);
    router.push(`/ai-assistant?q=${encodeURIComponent(query)}`);
  };

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

      {/* Global Copilot / Patient / System Search Modal */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        onSelectSearch={handleGlobalSearchSelect}
      />

      {/* Global Keyboard Shortcuts Guide Modal */}
      <ShortcutsGuideModal
        isOpen={isShortcutsGuideOpen}
        onClose={() => setIsShortcutsGuideOpen(false)}
      />
    </div>
  );
}
