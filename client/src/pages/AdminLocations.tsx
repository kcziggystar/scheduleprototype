import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Plus, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";

export default function AdminLocations() {
  const utils = trpc.useUtils();
  const { data: locations = [], isLoading } = trpc.locations.list.useQuery();
  const upsert = trpc.locations.upsert.useMutation({ onSuccess: () => { utils.locations.list.invalidate(); toast.success("Location saved"); setOpen(false); } });
  const del = trpc.locations.delete.useMutation({ onSuccess: () => { utils.locations.list.invalidate(); toast.success("Location deleted"); setDeleteId(null); } });

  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string|null>(null);
  const [form, setForm] = useState({ id: undefined as string|undefined, name:"", address:"", phone:"", timezone:"America/New_York" });

  const openAdd = () => { setForm({ id: undefined, name:"", address:"", phone:"", timezone:"America/New_York" }); setOpen(true); };
  const openEdit = (l: typeof locations[0]) => { setForm({ id: l.id, name: l.name, address: l.address, phone: l.phone, timezone: l.timezone }); setOpen(true); };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="font-display text-2xl font-semibold">Locations</h1><p className="text-muted-foreground text-sm mt-1">Manage clinic locations</p></div>
          <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Add Location</Button>
        </div>
        {isLoading ? <p className="text-muted-foreground">Loading…</p> : (
          <div className="grid sm:grid-cols-2 gap-4">
            {locations.map(loc => (
              <Card key={loc.id} className="shadow-sm">
                <CardContent className="p-5 flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><MapPin className="w-5 h-5 text-primary" /></div>
                  <div className="flex-1">
                    <h3 className="font-display font-semibold text-sm">{loc.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{loc.address}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground"><Phone className="w-3 h-3" />{loc.phone}</div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openEdit(loc)}><Pencil className="w-3 h-3" /></Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteId(loc.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{form.id ? "Edit Location" : "Add Location"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} /></div>
              <div><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} /></div>
              <div><Label>Timezone</Label><Input value={form.timezone} onChange={e => setForm(f => ({...f, timezone: e.target.value}))} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => upsert.mutate(form)} disabled={upsert.isPending || !form.name}>{upsert.isPending ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete location?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteId && del.mutate({ id: deleteId })}>Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
