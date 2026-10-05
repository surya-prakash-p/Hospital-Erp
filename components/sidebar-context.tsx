"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  toggleCollapsed: () => void;
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleMobile: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Default to closed (collapsed = true) as requested by user
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Initialize from localStorage (default to closed if not set)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("thangam_sidebar_collapsed_v2");
      if (stored !== null) {
        setCollapsed(stored === "true");
      } else {
        setCollapsed(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("thangam_sidebar_collapsed_v2", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const toggleMobile = () => {
    setMobileOpen((prev) => !prev);
  };

  // Keyboard shortcut Ctrl + < (or legacy Ctrl+\ / Cmd+\) to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const isCtrlLess = isCtrlOrMeta && (
        e.key === "<" ||
        (e.shiftKey && (e.key === "," || e.code === "Comma")) ||
        e.key === "\\" ||
        e.code === "Backslash"
      );

      if (isCtrlLess) {
        const target = e.target as HTMLElement;
        const isInput =
          target &&
          (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
        if (!isInput) {
          e.preventDefault();
          toggleCollapsed();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        setCollapsed,
        toggleCollapsed,
        mobileOpen,
        setMobileOpen,
        toggleMobile,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useAppSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useAppSidebar must be used within SidebarProvider");
  }
  return context;
}
