import { useState } from "react"
import { Pill } from "lucide-react"
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
import { PHARMACY_FLAT_FEE } from "@/lib/types"
import { useStore } from "@/store"

export function PharmacyPanel({ readOnly }: { readOnly: boolean }) {
  const { selected, dispensePharmacy } = useStore()
  const [busy, setBusy] = useState(false)

  if (!selected) return null

  async function handleDispense() {
    setBusy(true)
    try {
      await dispensePharmacy()
    } catch (e) {
      toast.error(`Dispense failed: ${e instanceof Error ? e.message : e}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="size-5" /> Pharmacy Counter
        </CardTitle>
        <CardDescription>
          {selected.patient_name} — prescribed by {selected.doctor}. Dispense fee ₹
          {PHARMACY_FLAT_FEE}.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-1.5">
          <Label>Prescribed Regimen</Label>
          <Textarea value={selected.prescription || "No prescription recorded."} readOnly rows={5} />
        </div>
        <Button onClick={handleDispense} disabled={readOnly || busy} className="w-fit">
          <Pill data-slot="icon" />
          {busy ? "Dispensing…" : "Mark Dispensed & Route to Billing"}
        </Button>
      </CardContent>
    </Card>
  )
}
