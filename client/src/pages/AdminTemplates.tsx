import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const COLORS = ["bg-sky-500","bg-teal-500","bg-violet-500","bg-amber-500","bg-rose-500","bg-emerald-500"];

export default function AdminTemplates() {
  const utils = trpc.useUtils();
  const { data: templates = [], isLoading } = trpc.shiftTemplates.list.useQuery();
  const { data: locations = [] } = trpc.locations.list.useQuery();
  const upsert = trpc.shiftTemplates.upsert.useMutation({ onSuccess: () => { utils.shiftTemplates.list.invalidate(); toast.success("Template saved"); setOpen(false); } });
  const del = trpc.shiftTemplates.delete.useMutation({ onSuccess: () => { utils.shiftTemplates.list.invalidate(); toast.success("Template deleted"); setDeleteId(null); } });

  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string|null>(null);
  const [form, setForm] = useState({ id: undefined as string|undefined, name:"", locationId:"", weekDays:"[]", startTime:"09:00", duration:"8h", defaultRole:"Dentist" as "Dentist"|"Hygienist", color:"bg-sky-500" });
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const openAdd = () => { setSelectedDays([]); setForm({ id:undefined, name:"", locationId: locations[0]?.id ?? "", weekDays:"[]", startTime:"09:00", duration:"8h", defaultRole:"Dentist", color:"bg-sky-500" }); setOpen(true); };
  const openEdit = (t: typeof templates[0]) => {
    const days = JSON.parse(t.weekDays || "[]");
    setSelectedDays(days);
    setForm({ id: t.id, name: t.name, locationId: t.locationId, weekDays: t.weekDays, startTime: t.startTime, duration: t.duration, defaultRole: t.defaultRole, color: t.color });
    setOpen(true);
  };
  const toggleDay = (d: string) => { const next = selectedDays.includes(d) ? selectedDays.filter(x => x !== d) : [...selectedDays, d]; setSelectedDays(next); setForm(f => ({...f, weekDays: JSON.stringify(next)})); };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="font-display text-2xl font-semibold">Shift Templates</h1><p className="text-muted-foreground text-sm mt-1">Reusable shift shapes for building plans</p></div>
          <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Add Template</Button>
        </div>
        {isLoading ? <p className="text-muted-foreground">Loading…</p> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(t => {
              const loc = locations.find(l => l.id === t.locationId);
              const days = JSON.parse(t.weekDays || "[]");
              return (
                <Card key={t.id} className="shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${t.color}`} />
                        <h3 className="font-display font-semibold text-sm">{t.name}</h3>
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">{t.defaultRole}</Badge>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>{loc?.name}</p>
                      <p>{t.startTime} · {t.duration}</p>
                      <div className="flex gap-1 flex-wrap mt-2">{days.map((d: string) => <Badge key={d} variant="outline" className="text-xs px-1.5 py-0">{d}</Badge>)}</div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => openEdit(t)}><Pencil className="w-3 h-3" /> Edit</Button>
                      <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteId(t.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{form.id ? "Edit Template" : "Add Template"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} /></div>
              <div><Label>Location</Label>
                <Select value={form.locationId} onValueChange={v => setForm(f => ({...f, locationId: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Days</Label>
                <div className="flex gap-2 flex-wrap mt-1">{DAYS.map(d => <Button key={d} type="button" size="sm" variant={selectedDays.includes(d) ? "default" : "outline"} className="text-xs px-2 py-1 h-7" onClick={() => toggleDay(d)}>{d}</Button>)}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start Time</Label><Input type="time" value={form.startTime} onChange={e => setForm(f => ({...f, startTime: e.target.value}))} /></div>
                <div><Label>Duration (e.g. 8h)</Label><Input value={form.duration} onChange={e => setForm(f => ({...f, duration: e.target.value}))} /></div>
              </div>
              <div><Label>Role</Label>
                <Select value={form.defaultRole} onValueChange={v => setForm(f => ({...f, defaultRole: v as "Dentist"|"Hygienist"}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Dentist">Dentist</SelectItem><SelectItem value="Hygienist">Hygienist</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Color</Label>
                <div className="flex gap-2 mt-1">{COLORS.map(c => <button key={c} type="button" className={`w-6 h-6 rounded-full ${c} ${form.color === c ? "ring-2 ring-offset-2 ring-foreground" : ""}`} onClick={() => setForm(f => ({...f, color: c}))} />)}</div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => upsert.mutate(form)} disabled={upsert.isPending || !form.name}>{upsert.isPending ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete template?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteId && del.mutate({ id: deleteId })}>Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
