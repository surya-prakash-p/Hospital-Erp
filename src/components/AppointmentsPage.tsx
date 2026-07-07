import { useState } from "react"
import { CalendarPlus, LogIn, X } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useStore } from "@/store"

export function AppointmentsPage({ readOnly }: { readOnly: boolean }) {
  const { appointments, doctors, scheduleAppointment, cancelAppointment, checkInAppointment } =
    useStore()
  const [name, setName] = useState("")
  const [mobile, setMobile] = useState("")
  const [doctor, setDoctor] = useState(doctors[0]?.doctor_name ?? "")
  const [date, setDate] = useState<Date | undefined>()
  const [time, setTime] = useState("10:00")
  const [notes, setNotes] = useState("")
  const [busy, setBusy] = useState(false)

  async function handleBook() {
    if (!name.trim()) return toast.error("Patient name is required")
    if (!/^\d{10}$/.test(mobile)) return toast.error("Mobile number must be exactly 10 digits")
    if (!date) return toast.error("Pick an appointment date")
    if (!doctor) return toast.error("Select a doctor")
    setBusy(true)
    try {
      await scheduleAppointment({
        patient_name: name,
        mobile_number: mobile,
        doctor,
        appointment_date: date.toISOString().slice(0, 10),
        appointment_time: time,
        notes,
      })
      setName("")
      setMobile("")
      setNotes("")
      setDate(undefined)
    } catch (e) {
      toast.error(`Booking failed: ${e instanceof Error ? e.message : e}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarPlus className="size-4" /> Book Appointment
          </CardTitle>
          <CardDescription>Schedule a future visit slot.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="a-name">Patient Name *</Label>
            <Input id="a-name" value={name} onChange={(e) => setName(e.target.value)} disabled={readOnly} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="a-mobile">Mobile Number *</Label>
            <Input
              id="a-mobile"
              inputMode="numeric"
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
              disabled={readOnly}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Doctor *</Label>
            <Select value={doctor} onValueChange={setDoctor} disabled={readOnly}>
              <SelectTrigger>
                <SelectValue placeholder="Select doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((d) => (
                  <SelectItem key={d.doctor_name} value={d.doctor_name}>
                    {d.doctor_name} — {d.specialization}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start font-normal" disabled={readOnly}>
                    {date ? date.toLocaleDateString("en-IN") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={{ before: new Date() }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="a-time">Time *</Label>
              <Input
                id="a-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={readOnly}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="a-notes">Notes</Label>
            <Input id="a-notes" value={notes} onChange={(e) => setNotes(e.target.value)} disabled={readOnly} />
          </div>
          <Button onClick={handleBook} disabled={readOnly || busy}>
            <CalendarPlus data-slot="icon" />
            {busy ? "Booking…" : "Book Appointment"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming & Recent</CardTitle>
          <CardDescription>
            Check a patient in to convert the appointment into a walk-in queue entry.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Date / Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No appointments scheduled
                  </TableCell>
                </TableRow>
              )}
              {appointments.map((a) => (
                <TableRow key={a.name}>
                  <TableCell>
                    <div className="font-medium">{a.patient_name}</div>
                    <div className="text-xs text-muted-foreground">{a.mobile_number}</div>
                  </TableCell>
                  <TableCell>{a.doctor}</TableCell>
                  <TableCell>
                    {a.appointment_date} · {a.appointment_time}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        a.status === "Scheduled"
                          ? "default"
                          : a.status === "Checked In"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {a.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {a.status === "Scheduled" && (
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={readOnly}
                          onClick={() =>
                            checkInAppointment(a.name).catch((e) => toast.error(String(e)))
                          }
                        >
                          <LogIn data-slot="icon" /> Check In
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Cancel appointment"
                          disabled={readOnly}
                          onClick={() =>
                            cancelAppointment(a.name).catch((e) => toast.error(String(e)))
                          }
                        >
                          <X />
                        </Button>
                      </div>
                    )}
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
