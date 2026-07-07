import { useState } from "react"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { AppHeaderControls } from "@/components/AppHeader"
import { AppSidebar, type PageKey } from "@/components/AppSidebar"
import { AppointmentsPage } from "@/components/AppointmentsPage"
import { AuditLogPage } from "@/components/AuditLogPage"
import { DashboardPage } from "@/components/DashboardPage"
import { FrontDeskPage } from "@/components/FrontDeskPage"
import { RecordsPage } from "@/components/RecordsPage"
import { StationPage } from "@/components/StationPage"
import { BillingPanel } from "@/components/panels/BillingPanel"
import { CompletePanel } from "@/components/panels/CompletePanel"
import { DoctorPanel } from "@/components/panels/DoctorPanel"
import { LabPanel } from "@/components/panels/LabPanel"
import { PharmacyPanel } from "@/components/panels/PharmacyPanel"
import { ROLE_EDITS, type WorkflowStatus } from "@/lib/types"
import { StoreProvider, useStore } from "@/store"

const PAGE_TITLES: Record<PageKey, string> = {
  "front-desk": "Front Desk",
  consultation: "Consultations",
  lab: "Lab Station",
  pharmacy: "Pharmacy Counter",
  billing: "Billing & Payments",
  appointments: "Appointments",
  dashboard: "Dashboard",
  records: "Record Inspector",
  audit: "Audit Log",
}

function Pages({ page }: { page: PageKey }) {
  const { role, selected } = useStore()
  const canEdit = (stage: WorkflowStatus) => ROLE_EDITS[role].includes(stage)

  switch (page) {
    case "front-desk":
      return <FrontDeskPage readOnly={!canEdit("Reception")} />
    case "consultation":
      return (
        <StationPage
          stage="Doctor Consultation"
          emptyHint="No patient selected — pick one from the waiting list."
        >
          <DoctorPanel readOnly={!canEdit("Doctor Consultation")} />
        </StationPage>
      )
    case "lab":
      return (
        <StationPage
          stage="Lab Test"
          emptyHint="No lab orders pending. Orders appear here when a doctor requests a test."
        >
          <LabPanel readOnly={!canEdit("Lab Test")} />
        </StationPage>
      )
    case "pharmacy":
      return (
        <StationPage
          stage="Pharmacy"
          emptyHint="No prescriptions to dispense right now."
        >
          <PharmacyPanel readOnly={!canEdit("Pharmacy")} />
        </StationPage>
      )
    case "billing":
      return (
        <StationPage
          stage="Billing"
          keepStatuses={["Completed"]}
          emptyHint="No invoices pending payment."
        >
          {selected?.appointment_status === "Completed" ? (
            <CompletePanel />
          ) : (
            <BillingPanel readOnly={!canEdit("Billing")} />
          )}
        </StationPage>
      )
    case "appointments":
      return <AppointmentsPage readOnly={!["Admin", "Receptionist"].includes(role)} />
    case "dashboard":
      return <DashboardPage />
    case "records":
      return <RecordsPage />
    case "audit":
      return role === "Admin" ? <AuditLogPage /> : <DashboardPage />
  }
}

function Shell() {
  const [page, setPage] = useState<PageKey>("dashboard")

  return (
    <SidebarProvider>
      <AppSidebar page={page} onNavigate={setPage} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <h1 className="font-heading text-lg font-semibold">{PAGE_TITLES[page]}</h1>
          <div className="ml-auto">
            <AppHeaderControls />
          </div>
        </header>
        <main className="p-4 lg:p-6">
          <Pages page={page} />
        </main>
      </SidebarInset>
      <Toaster position="bottom-right" richColors />
    </SidebarProvider>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
