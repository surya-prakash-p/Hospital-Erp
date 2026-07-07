import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ReceptionPanel } from "@/components/panels/ReceptionPanel"
import type { WorkflowStatus } from "@/lib/types"
import { useStore } from "@/store"

const STAGE_BADGE: Record<WorkflowStatus, "default" | "secondary" | "outline"> = {
  Reception: "outline",
  "Doctor Consultation": "default",
  "Lab Test": "secondary",
  Pharmacy: "secondary",
  Billing: "default",
  Completed: "outline",
}

export function FrontDeskPage({ readOnly }: { readOnly: boolean }) {
  const { queue } = useStore()

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(420px,1fr)_1fr]">
      <ReceptionPanel readOnly={readOnly} />

      <Card>
        <CardHeader>
          <CardTitle>Today's Visits</CardTitle>
          <CardDescription>Every walk-in and where they are right now.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Stage</TableHead>
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
              {queue.map((w) => (
                <TableRow key={w.name}>
                  <TableCell>
                    <div className="font-medium">{w.patient_name}</div>
                    <div className="text-xs text-muted-foreground">{w.mobile_number}</div>
                  </TableCell>
                  <TableCell>{w.doctor}</TableCell>
                  <TableCell>
                    <Badge variant={STAGE_BADGE[w.appointment_status]}>
                      {w.appointment_status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
