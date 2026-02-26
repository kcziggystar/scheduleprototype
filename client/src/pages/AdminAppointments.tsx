import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, Search, CalendarCheck } from "lucide-react";
import { toast } from "sonner";

export default function AdminAppointments() {
  const utils = trpc.useUtils();
  const { data: appointments = [], isLoading } = trpc.appointments.list.useQuery({});
  const { data: providers = [] } = trpc.providers.list.useQuery();
  const { data: locations = [] } = trpc.locations.list.useQuery();
  const del = trpc.appointments.delete.useMutation({ onSuccess: () => { utils.appointments.list.invalidate(); toast.success("Appointment deleted"); setDeleteId(null); } });
  const updateStatus = trpc.appointments.upsert.useMutation({ onSuccess: () => { utils.appointments.list.invalidate(); toast.success("Status updated"); } });

  const [deleteId, setDeleteId] = useState<string|null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = appointments.filter(a => {
    const matchSearch = a.patientName.toLowerCase().includes(search.toLowerCase()) || a.patientEmail.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusColor = (s: string) => s === "confirmed" ? "default" : s === "completed" ? "secondary" : "destructive";

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Appointments</h1>
          <p className="text-muted-foreground text-sm mt-1">{appointments.length} total appointments</p>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search by patient name or email…" value={search} onChange={e => setSearch(e.target.value)} /></div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isLoading ? <p className="text-muted-foreground">Loading…</p> : (
          <Card className="shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b">
                  {["Patient","Type","Date","Time","Provider","Location","Status","Actions"].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {filtered.map((a, i) => {
                    const prov = providers.find(p => p.id === a.providerId);
                    const loc = locations.find(l => l.id === a.locationId);
                    return (
                      <tr key={a.id} className={i % 2 === 0 ? "bg-secondary/20" : ""}>
                        <td className="py-3 px-4"><p className="font-medium">{a.patientName}</p><p className="text-xs text-muted-foreground">{a.patientEmail}</p></td>
                        <td className="py-3 px-4">{a.appointmentType}</td>
                        <td className="py-3 px-4 tabular-nums">{a.date}</td>
                        <td className="py-3 px-4 tabular-nums">{a.startTime}–{a.endTime}</td>
                        <td className="py-3 px-4">{prov?.name ?? "—"}</td>
                        <td className="py-3 px-4">{loc?.name ?? "—"}</td>
                        <td className="py-3 px-4">
                          <Select value={a.status} onValueChange={v => updateStatus.mutate({...a, status: v as "confirmed"|"cancelled"|"completed", durationMinutes: a.durationMinutes ?? 30})}>
                            <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3 px-4"><Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(a.id)}><Trash2 className="w-3 h-3" /></Button></td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">No appointments found.</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete appointment?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteId && del.mutate({ id: deleteId })}>Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
