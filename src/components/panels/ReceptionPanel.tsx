import { useState } from "react"
import { Search, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Patient } from "@/lib/types"
import { useStore } from "@/store"

const EMPTY: Patient = {
  patient_name: "",
  mobile_number: "",
  email: "",
  gender: "Male",
  age: "",
  medical_history: "",
}

export function ReceptionPanel({ readOnly }: { readOnly: boolean }) {
  const { patients, doctors, registerWalkIn } = useStore()
  const [query, setQuery] = useState("")
  const [form, setForm] = useState<Patient>(EMPTY)
  const [isExisting, setIsExisting] = useState(false)
  const [doctor, setDoctor] = useState(doctors[0]?.doctor_name ?? "")
  const [busy, setBusy] = useState(false)

  const set = (patch: Partial<Patient>) => setForm((f) => ({ ...f, ...patch }))

  function handleSearch() {
    const q = query.trim().toLowerCase()
    if (!q) return
    const found =
      patients[q] ??
      Object.values(patients).find((p) => p.patient_name.toLowerCase().includes(q))
    if (found) {
      setForm(found)
      setIsExisting(true)
      toast.success(`Existing patient found: ${found.patient_name}`)
    } else {
      setForm({ ...EMPTY, mobile_number: /^\d+$/.test(q) ? q : "" })
      setIsExisting(false)
      toast.info("No record found — register as new patient")
    }
  }

  async function handleRegister() {
    if (!form.patient_name.trim()) return toast.error("Patient name is required")
    if (!/^\d{10}$/.test(form.mobile_number))
      return toast.error("Mobile number must be exactly 10 digits")
    if (form.age !== "" && (Number(form.age) < 0 || Number(form.age) > 130))
      return toast.error("Age must be between 0 and 130")
    if (!doctor) return toast.error("Assign a doctor")
    setBusy(true)
    try {
      await registerWalkIn({ ...form, age: form.age === "" ? "" : Number(form.age) }, doctor)
      setForm(EMPTY)
      setQuery("")
      setIsExisting(false)
    } catch (e) {
      toast.error(`Registration failed: ${e instanceof Error ? e.message : e}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="size-5" /> Reception — Patient Registry
        </CardTitle>
        <CardDescription>
          Search existing patients by mobile or name, or register a walk-in.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search by mobile number or name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            disabled={readOnly}
          />
          <Button variant="secondary" onClick={handleSearch} disabled={readOnly}>
            <Search data-slot="icon" /> Search
          </Button>
        </div>

        {isExisting && (
          <Badge variant="outline" className="w-fit">
            Existing patient — details prefilled, history on record
          </Badge>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="p-name">Patient Name *</Label>
            <Input
              id="p-name"
              value={form.patient_name}
              onChange={(e) => set({ patient_name: e.target.value })}
              disabled={readOnly}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="p-mobile">Mobile Number *</Label>
            <Input
              id="p-mobile"
              inputMode="numeric"
              maxLength={10}
              value={form.mobile_number}
              onChange={(e) => set({ mobile_number: e.target.value.replace(/\D/g, "") })}
              disabled={readOnly || isExisting}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="p-email">Email</Label>
            <Input
              id="p-email"
              type="email"
              value={form.email}
              onChange={(e) => set({ email: e.target.value })}
              disabled={readOnly}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="p-age">Age</Label>
            <Input
              id="p-age"
              type="number"
              min={0}
              max={130}
              value={form.age}
              onChange={(e) => set({ age: e.target.value === "" ? "" : Number(e.target.value) })}
              disabled={readOnly}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Gender</Label>
            <Select
              value={form.gender}
              onValueChange={(v) => set({ gender: v as Patient["gender"] })}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Male", "Female", "Other"].map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Assign Doctor *</Label>
            <Select value={doctor} onValueChange={setDoctor} disabled={readOnly}>
              <SelectTrigger>
                <SelectValue placeholder="Select doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((d) => (
                  <SelectItem key={d.doctor_name} value={d.doctor_name}>
                    {d.doctor_name} — {d.specialization} (₹{d.consultation_fee})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {form.medical_history && (
          <div className="grid gap-1.5">
            <Label>Medical History</Label>
            <Textarea value={form.medical_history} readOnly rows={6} className="text-xs" />
          </div>
        )}

        <Button onClick={handleRegister} disabled={readOnly || busy} className="w-fit">
          <UserPlus data-slot="icon" />
          {busy ? "Registering…" : "Register & Queue for Consultation"}
        </Button>
      </CardContent>
    </Card>
  )
}
