"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const ROUTE_LABELS: Record<string, string> = {
  "/": "Overview Dashboard",
  "/reception": "Reception Desk & Queue",
  "/patient-registry": "Patient Registry",
  "/consultation": "Doctor Consultation Chamber",
  "/lab": "Lab Station & Diagnostics",
  "/pharmacy": "Pharmacy Station & Stock",
  "/billing": "Billing & Invoicing Desk",
  "/finance": "Financial Ledger & Accounts",
  "/doctors": "Doctors Registry",
  "/ai-assistant": "AI Copilot Workspace",
  "/admin-dashboard": "Hospital Admin Dashboard",
  "/audit-logs": "Audit & Activity Logs",
  "/bed-management": "Bed & Ward Management",
  "/ipd": "IPD Inpatient Desk",
  "/ot": "Operation Theatre",
  "/ambulance": "Ambulance Management",
  "/blood-bank": "Blood Bank Registry",
  "/insurance": "Insurance & TPA Claims",
  "/inventory": "Hospital Inventory"
};

export function AuditTracker() {
  const pathname = usePathname();
  const { user } = useAuth();
  const lastTrackedRef = useRef<{ path: string; user: string; time: number } | null>(null);

  useEffect(() => {
    // Skip tracking login page or unauthenticated state
    if (!pathname || pathname === "/login" || !user) {
      return;
    }

    const currentEmpId = user.employeeId || user.employee_id || user.email || user.id || "STAFF";
    const now = Date.now();

    // Prevent duplicate logs for the exact same page within 4 seconds
    if (
      lastTrackedRef.current &&
      lastTrackedRef.current.path === pathname &&
      lastTrackedRef.current.user === currentEmpId &&
      now - lastTrackedRef.current.time < 4000
    ) {
      return;
    }

    lastTrackedRef.current = {
      path: pathname,
      user: currentEmpId,
      time: now
    };

    const pageLabel = ROUTE_LABELS[pathname] || `Portal Page (${pathname})`;
    const actorName = user.full_name || user.name || currentEmpId;
    const actorRole = user.role || (user.roles?.[0]) || "Staff Member";

    // Send page visit record to server in background
    fetch("/api/logs/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "page_visit",
        action: "Page Navigation",
        description: `${actorName} (${currentEmpId}) opened ${pageLabel}`,
        actor: {
          employeeId: currentEmpId,
          name: actorName,
          role: actorRole,
          email: user.email || "",
          department: user.department || ""
        },
        target: pathname,
        metadata: {
          pageTitle: pageLabel,
          path: pathname,
          device: typeof window !== "undefined" ? window.navigator.userAgent.substring(0, 80) : "Browser"
        }
      })
    }).catch((err) => {
      // Non-blocking background log
      console.warn("Audit page tracker notice:", err.message);
    });
  }, [pathname, user]);

  return null;
}
