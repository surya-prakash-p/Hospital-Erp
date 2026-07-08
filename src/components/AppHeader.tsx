import { useState } from "react"
import { Database, LogOut, Plug } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useStore } from "@/store"
import { ROLES, type Role } from "@/lib/types"

export function AppHeaderControls() {
  const { connected, connect, disconnect, role, setRole } = useStore()
  const [open, setOpen] = useState(false)
  const [usr, setUsr] = useState("Administrator")
  const [pwd, setPwd] = useState("")
  const [busy, setBusy] = useState(false)

  async function handleLogin() {
    setBusy(true)
    try {
      await connect(usr, pwd)
      setOpen(false)
    } catch (e) {
      toast.error(`Login failed: ${e instanceof Error ? e.message : e}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={connected ? "default" : "secondary"} className="hidden sm:inline-flex">
        <Database data-slot="icon" />
        {connected ? "Frappe Bench" : "Offline"}
      </Badge>

      <Select value={role} onValueChange={(v) => setRole(v as Role)}>
        <SelectTrigger size="sm" className="w-36" aria-label="Active role">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROLES.map((r) => (
            <SelectItem key={r} value={r}>
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {connected ? (
        <Button variant="outline" size="sm" onClick={disconnect}>
          <LogOut data-slot="icon" /> Disconnect
        </Button>
      ) : (
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plug data-slot="icon" /> Connect
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Connect to Frappe Bench</DialogTitle>
            <DialogDescription>
              Sign in to the Frappe server proxied at /api (localhost:8000).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="usr">Username</Label>
              <Input id="usr" value={usr} onChange={(e) => setUsr(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pwd">Password</Label>
              <Input
                id="pwd"
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogin} disabled={busy}>
              {busy ? "Connecting…" : "Connect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
