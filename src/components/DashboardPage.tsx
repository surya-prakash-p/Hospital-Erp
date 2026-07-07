import { useMemo } from "react"
import {
  CalendarDays,
  FlaskConical,
  IndianRupee,
  LogIn,
  TrendingUp,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { WORKFLOW_STEPS, type WorkflowStatus } from "@/lib/types"
import { useStore } from "@/store"

const stageChartConfig = {
  count: { label: "Patients", color: "var(--chart-1)" },
} satisfies ChartConfig

const revenueConfig = {
  revenue: { label: "Revenue (₹)", color: "var(--chart-2)" },
} satisfies ChartConfig

// Tinted status pills per the Stitch design (utility classes on the default Badge)
const STAGE_PILL: Record<WorkflowStatus, string> = {
  Reception: "bg-slate-100 text-slate-700",
  "Doctor Consultation": "bg-blue-100 text-blue-800",
  "Lab Test": "bg-cyan-100 text-cyan-800",
  Pharmacy: "bg-violet-100 text-violet-800",
  Billing: "bg-amber-100 text-amber-800",
  Completed: "bg-emerald-100 text-emerald-800",
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

export function DashboardPage() {
  const { patients, queue, appointments, checkInAppointment } = useStore()

  const stats = useMemo(() => {
    const completed = queue.filter((q) => q.appointment_status === "Completed")
    return {
      patients: Object.keys(patients).length,
      active: queue.length - completed.length,
      completed: completed.length,
      labPending: queue.filter((q) => q.appointment_status === "Lab Test").length,
      revenue: completed.reduce((s, q) => s + (q.bill_amount || 0), 0),
    }
  }, [patients, queue])

  const byStage = useMemo(
    () =>
      WORKFLOW_STEPS.filter((s) => s !== "Completed").map((s) => ({
        stage: s === "Doctor Consultation" ? "Consult" : s,
        count: queue.filter((q) => q.appointment_status === s).length,
      })),
    [queue]
  )

  const revenueByDoctor = useMemo(() => {
    const map = new Map<string, number>()
    for (const q of queue) {
      if (q.appointment_status === "Completed")
        map.set(q.doctor, (map.get(q.doctor) ?? 0) + (q.bill_amount || 0))
    }
    return [...map.entries()].map(([doctor, revenue]) => ({ doctor, revenue }))
  }, [queue])

  const scheduled = appointments.filter((a) => a.status === "Scheduled")
  const progress = queue.length ? Math.round((stats.completed / queue.length) * 100) : 0

  const kpis = [
    {
      label: "Total Patients",
      value: stats.patients.toLocaleString("en-IN"),
      icon: Users,
      chip: "bg-blue-100 text-blue-700",
      foot: "registered on file",
      trend: null as string | null,
    },
    {
      label: "Visits Today",
      value: String(queue.length),
      icon: CalendarDays,
      chip: "bg-emerald-100 text-emerald-700",
      foot: `${stats.active} in progress`,
      trend: null,
      progress,
    },
    {
      label: "Lab Orders Pending",
      value: String(stats.labPending).padStart(2, "0"),
      icon: FlaskConical,
      chip: "bg-orange-100 text-orange-700",
      foot: stats.labPending ? "awaiting results" : "all clear",
      trend: null,
    },
    {
      label: "Revenue Collected",
      value: `₹${stats.revenue.toLocaleString("en-IN")}`,
      icon: IndianRupee,
      chip: "bg-indigo-100 text-indigo-700",
      foot: `${stats.completed} completed visits`,
      trend: stats.revenue > 0 ? "today" : null,
    },
  ]

  return (
    <div className="grid gap-6">
      {/* Overview heading */}
      <div>
        <h2 className="font-heading text-2xl font-semibold">Clinic Overview</h2>
        <p className="text-sm text-muted-foreground">
          Real-time status of Thangam Hospitals operations.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="gap-2">
            <CardHeader className="flex-row items-start justify-between">
              <span className={`rounded-lg p-2 ${k.chip}`}>
                <k.icon className="size-5" />
              </span>
              {k.trend && (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <TrendingUp className="size-3.5" /> {k.trend}
                </span>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {k.label}
              </p>
              <div className="mt-1 text-3xl font-bold tracking-tight">{k.value}</div>
              {"progress" in k && k.progress !== undefined && (
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${k.progress}%` }}
                  />
                </div>
              )}
              <p className="mt-2 text-xs text-muted-foreground">{k.foot}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent visits + pending appointments */}
      <div className="grid items-start gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Recent Visits</CardTitle>
            <CardDescription>Latest walk-ins across all stations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Practitioner</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                      No visits yet today
                    </TableCell>
                  </TableRow>
                )}
                {queue.slice(0, 6).map((w) => (
                  <TableRow key={w.name}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-secondary text-[10px] font-bold text-secondary-foreground">
                            {initials(w.patient_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{w.patient_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{w.doctor}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`border-transparent ${STAGE_PILL[w.appointment_status]}`}
                      >
                        {w.appointment_status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Upcoming Appointments</CardTitle>
            <CardDescription>
              {scheduled.length ? `${scheduled.length} scheduled` : "Nothing scheduled"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {scheduled.slice(0, 5).map((a) => (
              <div
                key={a.name}
                className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{a.patient_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.doctor} · {a.appointment_date} {a.appointment_time}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => checkInAppointment(a.name).catch((e) => toast.error(String(e)))}
                >
                  <LogIn data-slot="icon" /> Check In
                </Button>
              </div>
            ))}
            {scheduled.length === 0 && (
              <div className="rounded-lg border border-dashed py-8 text-center text-xs text-muted-foreground">
                Book appointments from the sidebar button
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Patients by Stage</CardTitle>
            <CardDescription>Where patients are in the pipeline right now</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={stageChartConfig} className="h-56 w-full">
              <BarChart data={byStage}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="stage" tickLine={false} axisLine={false} fontSize={11} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Revenue by Doctor</CardTitle>
            <CardDescription>Collected payments from completed visits</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueByDoctor.length === 0 ? (
              <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                No completed visits yet
              </p>
            ) : (
              <ChartContainer config={revenueConfig} className="h-56 w-full">
                <BarChart data={revenueByDoctor}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="doctor" tickLine={false} axisLine={false} fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
