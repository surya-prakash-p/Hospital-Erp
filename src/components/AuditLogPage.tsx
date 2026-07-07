import { ScrollText } from "lucide-react"
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
import { useStore } from "@/store"

export function AuditLogPage() {
  const { audit } = useStore()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ScrollText className="size-4" /> Audit Trail
        </CardTitle>
        <CardDescription>
          Every clinical and billing mutation, newest first. Persisted to Frappe when connected.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Record</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {audit.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No activity recorded this session
                </TableCell>
              </TableRow>
            )}
            {audit.map((e) => (
              <TableRow key={e.name}>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(e.timestamp ?? "").toLocaleString("en-IN")}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{e.role}</Badge>
                </TableCell>
                <TableCell className="font-medium">{e.action}</TableCell>
                <TableCell className="text-xs">
                  {e.entity_type}: {e.entity_name}
                </TableCell>
                <TableCell className="max-w-72 truncate text-xs text-muted-foreground">
                  {e.details}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
