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

export default function AdminProviders() {
  const utils = trpc.useUtils();
  const { data: providers = [], isLoading } = trpc.providers.list.useQuery();
  const { data: locations = [] } = trpc.locations.list.useQuery();
  const upsert = trpc.providers.upsert.useMutation({ onSuccess: () => { utils.providers.list.invalidate(); toast.success("Provider saved"); setOpen(false); } });
  const del = trpc.providers.delete.useMutation({ onSuccess: () => { utils.providers.list.invalidate(); toast.success("Provider deleted"); setDeleteId(null); } });

  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string|null>(null);
  const [form, setForm] = useState({ id: undefined as string|undefined, name:"", role:"Dentist" as "Dentist"|"Hygienist", primaryLocationId:"", bio:"", photoUrl:"", ptoCalendarId:"", holidayCalendarId:"" });

  const openAdd = () => { setForm({ id:undefined, name:"", role:"Dentist", primaryLocationId: locations[0]?.id ?? "", bio:"", photoUrl:"", ptoCalendarId:"", holidayCalendarId:"" }); setOpen(true); };
  const openEdit = (p: typeof providers[0]) => { setForm({ id: p.id, name: p.name, role: p.role, primaryLocationId: p.primaryLocationId, bio: p.bio ?? "", photoUrl: p.photoUrl ?? "", ptoCalendarId: p.ptoCalendarId, holidayCalendarId: p.holidayCalendarId }); setOpen(true); };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="font-display text-2xl font-semibold">Providers</h1><p className="text-muted-foreground text-sm mt-1">{providers.length} providers</p></div>
          <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Add Provider</Button>
        </div>
        {isLoading ? <p className="text-muted-foreground">Loading…</p> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map(p => {
              const loc = locations.find(l => l.id === p.primaryLocationId);
              return (
                <Card key={p.id} className="shadow-sm overflow-hidden">
                  {p.photoUrl && <div className="h-40 overflow-hidden"><img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover object-[center_15%]" /></div>}
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display font-semibold">{p.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{loc?.name}</p>
                      </div>
                      <Badge variant={p.role === "Dentist" ? "default" : "secondary"} className="text-xs shrink-0">{p.role}</Badge>
                    </div>
                    {p.bio && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.bio}</p>}
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => openEdit(p)}><Pencil className="w-3 h-3" /> Edit</Button>
                      <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "Edit Provider" : "Add Provider"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} /></div>
              <div><Label>Role</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({...f, role: v as "Dentist"|"Hygienist"}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Dentist">Dentist</SelectItem><SelectItem value="Hygienist">Hygienist</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Primary Location</Label>
                <Select value={form.primaryLocationId} onValueChange={v => setForm(f => ({...f, primaryLocationId: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Bio</Label><Input value={form.bio} onChange={e => setForm(f => ({...f, bio: e.target.value}))} /></div>
              <div><Label>Photo URL</Label><Input value={form.photoUrl} onChange={e => setForm(f => ({...f, photoUrl: e.target.value}))} /></div>

            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => upsert.mutate(form)} disabled={upsert.isPending || !form.name}>{upsert.isPending ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete provider?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteId && del.mutate({ id: deleteId })}>Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
