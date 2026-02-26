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
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

export default function AdminAssignments() {
  const utils = trpc.useUtils();
  const { data: assignments = [], isLoading } = trpc.providerAssignments.listAll.useQuery();
  const { data: providers = [] } = trpc.providers.list.useQuery();
  const { data: slots = [] } = trpc.shiftPlanSlots.list.useQuery({});
  const { data: plans = [] } = trpc.shiftPlans.list.useQuery();
  const { data: templates = [] } = trpc.shiftTemplates.list.useQuery();
  const upsert = trpc.providerAssignments.upsert.useMutation({ onSuccess: () => { utils.providerAssignments.listAll.invalidate(); toast.success("Assignment saved"); setOpen(false); } });
  const del = trpc.providerAssignments.delete.useMutation({ onSuccess: () => { utils.providerAssignments.listAll.invalidate(); toast.success("Assignment deleted"); setDeleteId(null); } });

  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string|null>(null);
  const [form, setForm] = useState({ id: undefined as string|undefined, providerId:"", shiftPlanSlotId:"", effectiveDate:"", endDate:"" as string|null });

  const openAdd = () => { setForm({ id:undefined, providerId: providers[0]?.id ?? "", shiftPlanSlotId: slots[0]?.id ?? "", effectiveDate:"", endDate:null }); setOpen(true); };
  const openEdit = (a: typeof assignments[0]) => { setForm({ id: a.id, providerId: a.providerId, shiftPlanSlotId: a.shiftPlanSlotId, effectiveDate: a.effectiveDate, endDate: a.endDate ?? null }); setOpen(true); };

  const today = new Date().toISOString().slice(0,10);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="font-display text-2xl font-semibold">Provider Assignments</h1><p className="text-muted-foreground text-sm mt-1">Link providers to shift plan slots</p></div>
          <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Add Assignment</Button>
        </div>
        {isLoading ? <p className="text-muted-foreground">Loading…</p> : (
          <Card className="shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b">{["Provider","Plan","Slot","Effective","End","Status","Actions"].map(h => <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">{h}</th>)}</tr></thead>
                <tbody>
                  {assignments.map((a, i) => {
                    const prov = providers.find(p => p.id === a.providerId);
                    const slot = slots.find(s => s.id === a.shiftPlanSlotId);
                    const plan = plans.find(p => p.id === slot?.shiftPlanId);
                    const tmpl = templates.find(t => t.id === slot?.templateId);
                    const active = !a.endDate || a.endDate >= today;
                    return (
                      <tr key={a.id} className={i % 2 === 0 ? "bg-secondary/20" : ""}>
                        <td className="py-3 px-4 font-medium">{prov?.name ?? "—"}</td>
                        <td className="py-3 px-4">{plan?.name ?? "—"}</td>
                        <td className="py-3 px-4">{tmpl?.name ?? slot?.id ?? "—"} <span className="text-muted-foreground text-xs">(Wk {slot?.cycleIndex})</span></td>
                        <td className="py-3 px-4 tabular-nums">{a.effectiveDate}</td>
                        <td className="py-3 px-4 tabular-nums">{a.endDate ?? "Open"}</td>
                        <td className="py-3 px-4"><Badge variant={active ? "default" : "secondary"} className="text-xs">{active ? "Active" : "Ended"}</Badge></td>
                        <td className="py-3 px-4 flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(a)}><Pencil className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(a.id)}><Trash2 className="w-3 h-3" /></Button>
                        </td>
                      </tr>
                    );
                  })}
                  {assignments.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No assignments yet.</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{form.id ? "Edit Assignment" : "Add Assignment"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div><Label>Provider</Label>
                <Select value={form.providerId} onValueChange={v => setForm(f => ({...f, providerId: v}))}>
                  <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                  <SelectContent>{providers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Shift Plan Slot</Label>
                <Select value={form.shiftPlanSlotId} onValueChange={v => setForm(f => ({...f, shiftPlanSlotId: v}))}>
                  <SelectTrigger><SelectValue placeholder="Select slot" /></SelectTrigger>
                  <SelectContent>{slots.map(s => { const tmpl = templates.find(t => t.id === s.templateId); const plan = plans.find(p => p.id === s.shiftPlanId); return <SelectItem key={s.id} value={s.id}>{plan?.name} – {tmpl?.name} (Wk {s.cycleIndex})</SelectItem>; })}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Effective Date</Label><Input type="date" value={form.effectiveDate} onChange={e => setForm(f => ({...f, effectiveDate: e.target.value}))} /></div>
                <div><Label>End Date (optional)</Label><Input type="date" value={form.endDate ?? ""} onChange={e => setForm(f => ({...f, endDate: e.target.value || null}))} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => upsert.mutate(form)} disabled={upsert.isPending || !form.providerId || !form.shiftPlanSlotId || !form.effectiveDate}>{upsert.isPending ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete assignment?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteId && del.mutate({ id: deleteId })}>Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
