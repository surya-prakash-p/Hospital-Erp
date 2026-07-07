import { useState } from "react"
import { CreditCard } from "lucide-react"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useStore } from "@/store"

const METHODS = ["Cash", "Card", "UPI"] as const

export function BillingPanel({ readOnly }: { readOnly: boolean }) {
  const { selected, computeBill, recordPayment } = useStore()
  const [method, setMethod] = useState<(typeof METHODS)[number]>("Cash")
  const [busy, setBusy] = useState(false)

  if (!selected) return null
  const items = computeBill(selected)
  const total = items.reduce((s, i) => s + i.amount, 0)

  async function handlePay() {
    setBusy(true)
    try {
      await recordPayment(method)
    } catch (e) {
      toast.error(`Payment failed: ${e instanceof Error ? e.message : e}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="size-5" /> Billing & Payment
        </CardTitle>
        <CardDescription>
          Invoice for {selected.patient_name} ({selected.mobile_number})
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Amount (₹)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((i) => (
              <TableRow key={i.label}>
                <TableCell>{i.label}</TableCell>
                <TableCell className="text-right">{i.amount.toLocaleString("en-IN")}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="font-semibold">Total</TableCell>
              <TableCell className="text-right font-semibold">
                ₹{total.toLocaleString("en-IN")}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Separator />

        <div className="grid gap-2">
          <Label>Payment Method</Label>
          {/* ponytail: records method only — plug in a gateway (Razorpay/Stripe) when the hospital has merchant credentials */}
          <RadioGroup
            value={method}
            onValueChange={(v) => setMethod(v as typeof method)}
            className="flex gap-6"
            disabled={readOnly}
          >
            {METHODS.map((m) => (
              <label key={m} className="flex items-center gap-2 text-sm">
                <RadioGroupItem value={m} /> {m}
              </label>
            ))}
          </RadioGroup>
        </div>

        <Button onClick={handlePay} disabled={readOnly || busy} className="w-fit">
          <CreditCard data-slot="icon" />
          {busy ? "Recording…" : `Record Payment of ₹${total.toLocaleString("en-IN")}`}
        </Button>
      </CardContent>
    </Card>
  )
}
