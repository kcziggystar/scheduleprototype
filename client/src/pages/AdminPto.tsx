import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Plus, Plane } from "lucide-react";
import { toast } from "sonner";

export default function AdminPto() {
  const utils = trpc.useUtils();
  const { data: providers = [] } = trpc.providers.list.useQuery();
  const { data: ptoEntries = [], isLoading } = trpc.ptoEntries.list.useQuery({});
  const upsert = trpc.ptoEntries.upsert.useMutation({ onSuccess: () => { utils.ptoEntries.list.invalidate(); toast.success("PTO saved"); setOpen(false); } });
  const del = trpc.ptoEntries.delete.useMutation({ onSuccess: () => { utils.ptoEntries.list.invalidate(); toast.success("PTO deleted"); setDeleteId(null); } });

  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string|null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [form, setForm] = useState({ id: undefined as string|undefined, calendarId:"", startDate:"", endDate:"", startTime:"" as string|null, endTime:"" as string|null, reason:"" as string|null });

  const openAdd = (calendarId: string) => { setForm({ id: undefined, calendarId, startDate:"", endDate:"", startTime:null, endTime:null, reason:"" }); setOpen(true); };
  const openEdit = (e: typeof ptoEntries[0]) => { setForm({ id: e.id, calendarId: e.calendarId, startDate: e.startDate, endDate: e.endDate, startTime: e.startTime ?? null, endTime: e.endTime ?? null, reason: e.reason ?? "" }); setOpen(true); };

  const providersByCalendar = providers.reduce((acc, p) => { acc[p.ptoCalendarId] = p; return acc; }, {} as Record<string, typeof providers[0]>);

  const filteredEntries = selectedProvider === "all" ? ptoEntries : ptoEntries.filter(e => {
    const prov = providersByCalendar[e.calendarId];
    return prov?.id === selectedProvider;
  });

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="font-display text-2xl font-semibold">PTO Editor</h1><p className="text-muted-foreground text-sm mt-1">Manage provider time-off entries</p></div>
        </div>
        <div className="flex gap-3">
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Filter by provider" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All providers</SelectItem>
              {providers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {isLoading ? <p className="text-muted-foreground">Loading…</p> : (
          <div className="space-y-4">
            {providers.filter(p => selectedProvider === "all" || p.id === selectedProvider).map(prov => {
              const entries = ptoEntries.filter(e => e.calendarId === prov.ptoCalendarId);
              return (
                <Card key={prov.id} className="shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-display text-base flex items-center gap-2">
                        <Plane className="w-4 h-4 text-amber-500" /> {prov.name}
                        <Badge variant="secondary" className="text-xs">{entries.length} entries</Badge>
                      </CardTitle>
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => openAdd(prov.ptoCalendarId)}><Plus className="w-3 h-3" /> Add PTO</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {entries.length === 0 ? <p className="text-sm text-muted-foreground">No PTO entries.</p> : (
                      <div className="space-y-2">
                        {entries.map(e => (
                          <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
                            <div>
                              <p className="text-sm font-medium">{e.reason ?? "PTO"}</p>
                              <p className="text-xs text-muted-foreground">{e.startDate}{e.startTime ? ` ${e.startTime}` : ""} → {e.endDate}{e.endTime ? ` ${e.endTime}` : ""}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openEdit(e)}><Pencil className="w-3 h-3" /></Button>
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(e.id)}><Trash2 className="w-3 h-3" /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{form.id ? "Edit PTO" : "Add PTO"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={e => setForm(f => ({...f, startDate: e.target.value}))} /></div>
                <div><Label>End Date</Label><Input type="date" value={form.endDate} onChange={e => setForm(f => ({...f, endDate: e.target.value}))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start Time (optional)</Label><Input type="time" value={form.startTime ?? ""} onChange={e => setForm(f => ({...f, startTime: e.target.value || null}))} /></div>
                <div><Label>End Time (optional)</Label><Input type="time" value={form.endTime ?? ""} onChange={e => setForm(f => ({...f, endTime: e.target.value || null}))} /></div>
              </div>
              <div><Label>Reason</Label><Input value={form.reason ?? ""} onChange={e => setForm(f => ({...f, reason: e.target.value}))} placeholder="e.g. Vacation, Medical leave" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => upsert.mutate(form)} disabled={upsert.isPending || !form.startDate || !form.endDate}>{upsert.isPending ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete PTO entry?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteId && del.mutate({ id: deleteId })}>Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
