import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Plus, CalendarOff, Info } from "lucide-react";
import { toast } from "sonner";

export default function AdminHolidays() {
  const utils = trpc.useUtils();
  const { data: calendars = [] } = trpc.holidayCalendars.list.useQuery();
  const { data: dates = [], isLoading } = trpc.holidayDates.list.useQuery({});
  const upsert = trpc.holidayDates.upsert.useMutation({ onSuccess: () => { utils.holidayDates.list.invalidate(); toast.success("Holiday saved"); setOpen(false); } });
  const del = trpc.holidayDates.delete.useMutation({ onSuccess: () => { utils.holidayDates.list.invalidate(); toast.success("Holiday deleted"); setDeleteId(null); } });

  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string|null>(null);
  const [form, setForm] = useState({ id: undefined as string|undefined, calendarId:"", date:"", name:"" });

  const openAdd = () => { setForm({ id: undefined, calendarId: calendars[0]?.id ?? "", date:"", name:"" }); setOpen(true); };
  const openEdit = (h: typeof dates[0]) => { setForm({ id: h.id, calendarId: h.calendarId, date: h.date, name: h.name }); setOpen(true); };

  const byMonth = dates.reduce((acc, h) => {
    const month = h.date.slice(0, 7);
    if (!acc[month]) acc[month] = [];
    acc[month].push(h);
    return acc;
  }, {} as Record<string, typeof dates>);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="font-display text-2xl font-semibold">Holiday Calendar</h1><p className="text-muted-foreground text-sm mt-1">Manage clinic holiday dates</p></div>
          <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Add Holiday</Button>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sky-800">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-sky-600" />
          <p className="text-sm">Holiday dates apply to <strong>all providers and resources</strong> across the clinic. When a holiday is added here, no appointments can be booked on that day for any provider.</p>
        </div>
        {isLoading ? <p className="text-muted-foreground">Loading…</p> : (
          <div className="space-y-4">
            {Object.entries(byMonth).sort().map(([month, hs]) => (
              <Card key={month} className="shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="font-display text-sm font-semibold text-muted-foreground">{new Date(month + "-01").toLocaleDateString("en-US", { month:"long", year:"numeric" })}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {hs.map(h => (
                    <div key={h.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium text-sm">{h.name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(h.date + "T12:00:00").toLocaleDateString("en-US", { weekday:"long", month:"short", day:"numeric" })}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(h)}><Pencil className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(h.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
            {dates.length === 0 && <p className="text-muted-foreground text-center py-8">No holidays defined yet.</p>}
          </div>
        )}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{form.id ? "Edit Holiday" : "Add Holiday"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Independence Day" /></div>
              <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => upsert.mutate(form)} disabled={upsert.isPending || !form.name || !form.date}>{upsert.isPending ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete holiday?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteId && del.mutate({ id: deleteId })}>Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
