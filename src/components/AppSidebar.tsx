import {
  Activity,
  CalendarDays,
  CalendarPlus,
  ClipboardList,
  CreditCard,
  DatabaseZap,
  FlaskConical,
  Hospital,
  Pill,
  ScrollText,
  Stethoscope,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { WorkflowStatus } from "@/lib/types"
import { useStore } from "@/store"

export type PageKey =
  | "front-desk"
  | "consultation"
  | "lab"
  | "pharmacy"
  | "billing"
  | "appointments"
  | "dashboard"
  | "records"
  | "audit"

interface NavItem {
  key: PageKey
  label: string
  icon: LucideIcon
  stage?: WorkflowStatus
}

const STATIONS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: Activity },
  { key: "front-desk", label: "Front Desk", icon: ClipboardList },
  { key: "consultation", label: "Consultations", icon: Stethoscope, stage: "Doctor Consultation" },
  { key: "lab", label: "Lab", icon: FlaskConical, stage: "Lab Test" },
  { key: "pharmacy", label: "Pharmacy", icon: Pill, stage: "Pharmacy" },
  { key: "billing", label: "Billing", icon: CreditCard, stage: "Billing" },
  { key: "appointments", label: "Appointments", icon: CalendarDays },
]

const ADMIN: NavItem[] = [
  { key: "records", label: "Records", icon: DatabaseZap },
  { key: "audit", label: "Audit Log", icon: ScrollText },
]

export function AppSidebar({
  page,
  onNavigate,
}: {
  page: PageKey
  onNavigate: (p: PageKey) => void
}) {
  const { queue, appointments, role } = useStore()

  const pendingCount = (item: NavItem) => {
    if (item.stage) return queue.filter((q) => q.appointment_status === item.stage).length
    if (item.key === "appointments")
      return appointments.filter((a) => a.status === "Scheduled").length
    return 0
  }

  const adminItems = role === "Admin" ? ADMIN : ADMIN.filter((i) => i.key !== "audit")

  return (
    <Sidebar>
      <SidebarHeader className="px-3 pt-4">
        {/* Logo slot — brand mark image to replace the icon tile later */}
        <div className="flex items-center gap-3 px-1">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Hospital className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="font-heading truncate text-base font-semibold text-foreground">
              Thangam Hospitals
            </div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Medical Suite v1.0
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Clinic</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {STATIONS.map((item) => {
                const n = pendingCount(item)
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      isActive={page === item.key}
                      onClick={() => onNavigate(item.key)}
                      className="data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-sidebar-accent-foreground"
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    {n > 0 && <SidebarMenuBadge>{n}</SidebarMenuBadge>}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    isActive={page === item.key}
                    onClick={() => onNavigate(item.key)}
                    className="data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-sidebar-accent-foreground"
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-3">
        <Button className="w-full" onClick={() => onNavigate("appointments")}>
          <CalendarPlus data-slot="icon" /> New Appointment
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
