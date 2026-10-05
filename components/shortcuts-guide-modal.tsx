"use client";

import React, { useEffect } from "react";
import { X, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShortcutItem {
  keys: Array<{ kbd: string } | string>;
  action: string;
  description: string;
}

interface ShortcutSection {
  title: string;
  items: ShortcutItem[];
}

const SHORTCUT_SECTIONS: ShortcutSection[] = [
  {
    title: "1. Procurement, Inventory & Logistics",
    items: [
      {
        keys: [{ kbd: "Alt" }, "+", { kbd: "I" }],
        action: "Purchase Inward (Supplier Bill)",
        description: "Opens POS-style purchase inward & stock entry with real-time rate variance.",
      },
      {
        keys: [{ kbd: "Alt" }, "+", { kbd: "G" }],
        action: "Generate Purchase Orders",
        description: "Opens bulk/manual Purchase Order creation.",
      },
      {
        keys: [{ kbd: "Alt" }, "+", { kbd: "Shift" }, "+", { kbd: "S" }],
        action: "Add Drug Supplier",
        description: "Opens the verified supplier registration form.",
      },
      {
        keys: [{ kbd: "Alt" }, "+", { kbd: "A" }],
        action: "Add Medicine",
        description: "Opens the new medicine/drug catalog entry form.",
      },
      {
        keys: [{ kbd: "Alt" }, "+", { kbd: "Shift" }, "+", { kbd: "P" }],
        action: "Review Bulk POs",
        description: "Opens/reviews automatically generated purchase orders from reorder suggestions.",
      },
      {
        keys: [{ kbd: "Alt" }, "+", { kbd: "L" }],
        action: "Filter Low Stock",
        description: "Filters inventory/catalog to low or critical stock medicines.",
      },
      {
        keys: [{ kbd: "Alt" }, "+", { kbd: "E" }],
        action: "Filter Expiring",
        description: "Filters medicines that are approaching their expiry/statutory window.",
      },
      {
        keys: [{ kbd: "Alt" }, "+", { kbd: "D" }],
        action: "Download & Export",
        description: "Opens the reports/export interface.",
      },
    ],
  },
  {
    title: "2. Pharmacy Counter & POS Billing",
    items: [
      {
        keys: [{ kbd: "/" }, " or ", { kbd: "Alt" }, "+", { kbd: "M" }],
        action: "Focus Search",
        description: "Focuses the medicine search field.",
      },
      {
        keys: [{ kbd: "Alt" }, "+", { kbd: "B" }],
        action: "View Bills",
        description: "Opens previous invoices/prescription receipts.",
      },
      {
        keys: [{ kbd: "Alt" }, "+", { kbd: "P" }],
        action: "Focus Patient",
        description: "Focuses patient/customer UHID or name input.",
      },
      {
        keys: [{ kbd: "Alt" }, "+", { kbd: "T" }],
        action: "Toggle Doctor",
        description: "Toggles between Walk-in Customer and Hospital Doctor.",
      },
      {
        keys: [{ kbd: "Alt" }, "+", { kbd: "Shift" }, "+", { kbd: "D" }],
        action: "Focus Discount",
        description: "Focuses the discount percentage input.",
      },
      {
        keys: [{ kbd: "Alt" }, "+", { kbd: "I" }],
        action: "Focus Invoice No",
        description: "Focuses the manual invoice/reference number input.",
      },
      {
        keys: [{ kbd: "Alt" }, "+", { kbd: "R" }],
        action: "Sales Return",
        description: "Opens medicine return/refund workflow.",
      },
      {
        keys: [{ kbd: "Alt" }, "+", { kbd: "O" }],
        action: "Outside Purchase",
        description: "Adds a medicine purchased from an external pharmacy.",
      },
      {
        keys: [{ kbd: "Alt" }, "+", { kbd: "U" }],
        action: "Substitute Finder",
        description: "Finds therapeutic-equivalent/generic alternatives.",
      },
      {
        keys: [{ kbd: "Alt" }, "+", { kbd: "Q" }],
        action: "Next Patient",
        description: "Selects the next patient waiting in the OPD/prescription queue.",
      },
      {
        keys: [{ kbd: "Ctrl" }, "+", { kbd: "Enter" }],
        action: "Confirm / Dispense",
        description: "Submits and records the current dispensation/billing entry.",
      },
      {
        keys: [{ kbd: "Delete" }],
        action: "Delete Item",
        description: "Removes the highlighted medicine row from the current bill.",
      },
    ],
  },
  {
    title: "3. System Navigation & Workspace",
    items: [
      {
        keys: [{ kbd: "Mouse Hover" }],
        action: "Expand Sidebar",
        description: "When the sidebar is collapsed, hovering over it expands it.",
      },
      {
        keys: [{ kbd: "Ctrl" }, "+", { kbd: "<" }],
        action: "Toggle / Pin Sidebar",
        description: "Toggles the sidebar between pinned and hover mode.",
      },
      {
        keys: [{ kbd: "Ctrl" }, "+", { kbd: "K" }],
        action: "Global Search",
        description: "Opens the existing global Copilot/patient/module search.",
      },
      {
        keys: [{ kbd: "Alt" }, "+", { kbd: "1" }],
        action: "Pharmacy POS",
        description: "Switches to Pharmacy POS.",
      },
      {
        keys: [{ kbd: "Alt" }, "+", { kbd: "2" }],
        action: "Medicine Master",
        description: "Switches to Inventory / Medicine Master.",
      },
      {
        keys: [{ kbd: "Alt" }, "+", { kbd: "3" }],
        action: "Prescription Queue",
        description: "Switches to the prescription queue.",
      },
      {
        keys: [{ kbd: "Alt" }, "+", { kbd: "4" }],
        action: "Registers",
        description: "Switches to statutory/compliance registers.",
      },
      {
        keys: [{ kbd: "Alt" }, "+", { kbd: "5" }],
        action: "Logistics & POs",
        description: "Switches to Purchase Orders, GRN and supplier management.",
      },
      {
        keys: [{ kbd: "←" }, " / ", { kbd: "→" }],
        action: "Cycle Tabs",
        description: "Moves between the available Pharmacy module tabs where applicable.",
      },
      {
        keys: [{ kbd: "↑" }, " / ", { kbd: "↓" }],
        action: "Navigate Rows",
        description: "Navigates through queue rows, tables and dropdown options.",
      },
      {
        keys: [{ kbd: "Enter" }],
        action: "Select / Open",
        description: "Opens/selects the currently highlighted item.",
      },
      {
        keys: [{ kbd: "Esc" }],
        action: "Close / Dismiss",
        description: "Closes active modals, dropdowns, search results or temporary overlays.",
      },
      {
        keys: [{ kbd: "?" }, " or ", { kbd: "F1" }],
        action: "Shortcuts Guide",
        description: "Opens the complete Keyboard Shortcuts Guide.",
      },
    ],
  },
];

interface ShortcutsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsGuideModal({ isOpen, onClose }: ShortcutsGuideModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "F1" || e.key === "?") {
        const target = e.target as HTMLElement;
        const isInput =
          target &&
          (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
        if (!isInput) {
          e.preventDefault();
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-guide-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="shortcuts-guide-title"
                className="text-base font-bold text-slate-900 leading-tight"
              >
                Keyboard Shortcuts Guide
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Standard hotkey reference for hospital pharmacy staff
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close shortcuts guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content with Exactly 3 Sections in Table Format */}
        <div className="p-6 overflow-y-auto space-y-7 text-xs">
          {SHORTCUT_SECTIONS.map((section, sIdx) => (
            <div key={sIdx} className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                <span>{section.title}</span>
              </h3>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-2.5 px-4 w-[240px]">Shortcut</th>
                      <th className="py-2.5 px-4 w-[220px]">Action</th>
                      <th className="py-2.5 px-4">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {section.items.map((item, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-indigo-50/40 transition-colors"
                      >
                        <td className="py-2 px-4 whitespace-nowrap align-middle">
                          <div className="inline-flex items-center gap-1 font-mono text-[11px]">
                            {item.keys.map((k, kIdx) => {
                              if (typeof k === "string") {
                                return (
                                  <span key={kIdx} className="text-slate-400 font-sans text-xs px-0.5">
                                    {k}
                                  </span>
                                );
                              }
                              return (
                                <kbd
                                  key={kIdx}
                                  className="px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-300 rounded font-semibold text-[11px] shadow-2xs leading-none"
                                >
                                  {k.kbd}
                                </kbd>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-2 px-4 font-bold text-slate-900 text-xs align-middle">
                          {item.action}
                        </td>
                        <td className="py-2 px-4 text-slate-600 text-xs leading-relaxed align-middle">
                          {item.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Tip: Press <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300 font-bold text-slate-800">?</kbd> or <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300 font-bold text-slate-800">F1</kbd> anytime to open or close this guide.
          </span>
          <Button
            type="button"
            onClick={onClose}
            className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 rounded-lg cursor-pointer"
          >
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}
