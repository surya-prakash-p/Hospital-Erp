import { DatabaseZap } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStore } from "@/store"

export function RecordsPage() {
  const { patients, queue, appointments, connected } = useStore()

  const sections = [
    { key: "patients", label: `Patients (${Object.keys(patients).length})`, data: patients },
    { key: "walkins", label: `Walk-Ins (${queue.length})`, data: queue },
    { key: "appointments", label: `Appointments (${appointments.length})`, data: appointments },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <DatabaseZap className="size-4" /> Record Inspector
        </CardTitle>
        <CardDescription>
          Live JSON view of {connected ? "Frappe Bench records" : "the offline simulator database"}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="patients">
          <TabsList>
            {sections.map((s) => (
              <TabsTrigger key={s.key} value={s.key}>
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {sections.map((s) => (
            <TabsContent key={s.key} value={s.key}>
              <ScrollArea className="max-h-[480px] rounded-md border bg-muted/30">
                <pre className="p-4 font-mono text-xs leading-relaxed">
                  {JSON.stringify(s.data, null, 2)}
                </pre>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
