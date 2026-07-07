import { useEffect, useState } from "react"
import { Stethoscope } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useStore } from "@/store"

export function DoctorPanel({ readOnly }: { readOnly: boolean }) {
  const { selected, patients, labTests, saveConsultation } = useStore()
  const [diagnosis, setDiagnosis] = useState("")
  const [prescription, setPrescription] = useState("")
  const [needLab, setNeedLab] = useState(false)
  const [labTest, setLabTest] = useState("")
  const [needMeds, setNeedMeds] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setDiagnosis(selected?.diagnosis ?? "")
    setPrescription(selected?.prescription ?? "")
    setNeedLab(Boolean(selected?.need_lab_test))
    setLabTest(selected?.lab_test_name ?? "")
    setNeedMeds(Boolean(selected?.need_medicines))
  }, [selected?.name])

  if (!selected) return null
  const history = patients[selected.mobile_number]?.medical_history

  async function handleSave() {
    if (!diagnosis.trim()) return toast.error("Diagnosis is required")
    if (needLab && !labTest) return toast.error("Select the lab test to order")
    if (needMeds && !prescription.trim())
      return toast.error("Prescription is required when medicines are needed")
    setBusy(true)
    try {
      await saveConsultation({
        diagnosis,
        prescription,
        need_lab_test: needLab ? 1 : 0,
        lab_test_name: needLab ? labTest : "",
        need_medicines: needMeds ? 1 : 0,
      })
    } catch (e) {
      toast.error(`Save failed: ${e instanceof Error ? e.message : e}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="size-5" /> Doctor Consultation
        </CardTitle>
        <CardDescription>
          {selected.patient_name} ({selected.mobile_number}) — assigned to {selected.doctor}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {history && (
          <div className="grid gap-1.5">
            <Label>Patient Medical History</Label>
            <Textarea value={history} readOnly rows={5} className="text-xs" />
          </div>
        )}

        <div className="grid gap-1.5">
          <Label htmlFor="diagnosis">Diagnosis *</Label>
          <Textarea
            id="diagnosis"
            rows={3}
            placeholder="Clinical findings and diagnosis…"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            disabled={readOnly}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="prescription">Prescription</Label>
          <Textarea
            id="prescription"
            rows={4}
            placeholder={"Medicine — dosage — frequency — duration\ne.g. Paracetamol 650mg — twice daily — 3 days"}
            value={prescription}
            onChange={(e) => setPrescription(e.target.value)}
            disabled={readOnly}
          />
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={needLab}
              onCheckedChange={(v) => setNeedLab(v === true)}
              disabled={readOnly}
            />
            Order lab test
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={needMeds}
              onCheckedChange={(v) => setNeedMeds(v === true)}
              disabled={readOnly}
            />
            Needs medicines (pharmacy)
          </label>
        </div>

        {needLab && (
          <div className="grid max-w-sm gap-1.5">
            <Label>Lab Test *</Label>
            <Select value={labTest} onValueChange={setLabTest} disabled={readOnly}>
              <SelectTrigger>
                <SelectValue placeholder="Select test" />
              </SelectTrigger>
              <SelectContent>
                {labTests.map((t) => (
                  <SelectItem key={t.test_name} value={t.test_name}>
                    {t.test_name} (₹{t.fee})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button onClick={handleSave} disabled={readOnly || busy} className="w-fit">
          {busy ? "Saving…" : "Save Consultation & Route"}
        </Button>
      </CardContent>
    </Card>
  )
}
