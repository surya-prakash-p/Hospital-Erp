import { useEffect, useState } from "react"
import { FlaskConical } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useStore } from "@/store"

export function LabPanel({ readOnly }: { readOnly: boolean }) {
  const { selected, saveLabResult } = useStore()
  const [result, setResult] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => setResult(selected?.lab_result ?? ""), [selected?.name])

  if (!selected) return null

  async function handleSave() {
    if (!result.trim()) return toast.error("Enter the lab findings")
    setBusy(true)
    try {
      await saveLabResult(result)
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
          <FlaskConical className="size-5" /> Lab Station
        </CardTitle>
        <CardDescription>
          {selected.patient_name} — ordered test: {selected.lab_test_name || "—"}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="lab-result">Findings / Result *</Label>
          <Textarea
            id="lab-result"
            rows={5}
            placeholder="Record diagnostic findings…"
            value={result}
            onChange={(e) => setResult(e.target.value)}
            disabled={readOnly}
          />
        </div>
        <Button onClick={handleSave} disabled={readOnly || busy} className="w-fit">
          {busy ? "Saving…" : "Record Result & Route"}
        </Button>
      </CardContent>
    </Card>
  )
}
