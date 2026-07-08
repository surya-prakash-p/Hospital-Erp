import { CheckCircle2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useStore } from "@/store"

export function CompletePanel() {
  const { selected } = useStore()
  if (!selected) return null

  const rows: [string, string][] = [
    ["Patient", `${selected.patient_name} (${selected.mobile_number})`],
    ["Doctor", selected.doctor],
    ["Diagnosis", selected.diagnosis || "—"],
    ["Prescription", selected.prescription || "None"],
    [
      "Lab Report",
      selected.need_lab_test ? `${selected.lab_test_name}: ${selected.lab_result}` : "None",
    ],
    ["Bill", `₹${selected.bill_amount.toLocaleString("en-IN")} via ${selected.payment_method}`],
  ]

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <CheckCircle2 className="mx-auto size-12 text-primary" />
        <CardTitle>Visit Completed</CardTitle>
        <CardDescription>
          Record saved and appended to the patient's medical history.
        </CardDescription>
      </CardHeader>
      <CardContent className="mx-auto grid max-w-md gap-2 text-sm">
        <Separator />
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[110px_1fr] gap-2">
            <span className="text-muted-foreground">{k}</span>
            <span className="whitespace-pre-wrap">{v}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
