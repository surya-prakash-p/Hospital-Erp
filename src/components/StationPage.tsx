import { useEffect } from "react"
import type { ReactNode } from "react"
import { UserRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { WorkflowStatus } from "@/lib/types"
import { useStore } from "@/store"

/**
 * Station layout: pending-patient list on the left, work panel on the right.
 * Selection auto-snaps to a patient at this stage; `keepStatuses` lets a page
 * hold the selection after the stage advances (e.g. Billing shows the receipt).
 */
export function StationPage({
  stage,
  keepStatuses = [],
  emptyHint,
  children,
}: {
  stage: WorkflowStatus
  keepStatuses?: WorkflowStatus[]
  emptyHint: string
  children: ReactNode
}) {
  const { queue, selected, selectedName, setSelectedName } = useStore()
  const pending = queue.filter((q) => q.appointment_status === stage)
  const holdable = [stage, ...keepStatuses]

  useEffect(() => {
    if (!selected || !holdable.includes(selected.appointment_status)) {
      setSelectedName(pending[0]?.name ?? null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, stage])

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[280px_1fr]">
      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="flex items-center justify-between text-sm">
            Waiting
            <Badge variant="secondary">{pending.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <ScrollArea className="max-h-[60vh]">
            <ul className="grid gap-1.5">
              {pending.length === 0 && (
                <li className="rounded-md border border-dashed py-8 text-center text-xs text-muted-foreground">
                  No patients waiting
                </li>
              )}
              {pending.map((w) => (
                <li key={w.name}>
                  <button
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md border px-3 py-2.5 text-left transition-colors hover:bg-accent",
                      w.name === selectedName && "border-primary bg-accent"
                    )}
                    onClick={() => setSelectedName(w.name)}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                      <UserRound className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{w.patient_name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {w.doctor}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="min-w-0">
        {selected && holdable.includes(selected.appointment_status) ? (
          children
        ) : (
          <Card>
            <CardContent className="py-16 text-center text-sm text-muted-foreground">
              {emptyHint}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
