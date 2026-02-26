import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminPlanBuilder() {
  const utils = trpc.useUtils();
  const { data: plans = [] } = trpc.shiftPlans.list.useQuery();
  const { data: slots = [] } = trpc.shiftPlanSlots.list.useQuery({});
  const { data: templates = [] } = trpc.shiftTemplates.list.useQuery();
  const { data: locations = [] } = trpc.locations.list.useQuery();
  const addSlot = trpc.shiftPlanSlots.upsert.useMutation({ onSuccess: () => { utils.shiftPlanSlots.list.invalidate(); toast.success("Slot added"); } });
  const delSlot = trpc.shiftPlanSlots.delete.useMutation({ onSuccess: () => { utils.shiftPlanSlots.list.invalidate(); toast.success("Slot removed"); setDeleteId(null); } });

  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [addWeek, setAddWeek] = useState<number>(1);
  const [addTemplate, setAddTemplate] = useState<string>("");
  const [deleteId, setDeleteId] = useState<string|null>(null);

  const plan = plans.find(p => p.id === selectedPlan);
  const planSlots = slots.filter(s => s.shiftPlanId === selectedPlan);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Plan Builder</h1>
          <p className="text-muted-foreground text-sm mt-1">Assemble templates into rotation plan slots</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedPlan} onValueChange={setSelectedPlan}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Select a shift plan…" /></SelectTrigger>
            <SelectContent>{plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {plan && (
          <>
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base">Add Slot to {plan.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 flex-wrap">
                  <Select value={String(addWeek)} onValueChange={v => setAddWeek(Number(v))}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: plan.shiftCycle }, (_, i) => (
                        <SelectItem key={i+1} value={String(i+1)}>Week {String.fromCharCode(64 + i + 1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={addTemplate} onValueChange={setAddTemplate}>
                    <SelectTrigger className="w-64"><SelectValue placeholder="Select template…" /></SelectTrigger>
                    <SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button onClick={() => { if (!addTemplate) return; addSlot.mutate({ shiftPlanId: selectedPlan, cycleIndex: addWeek, templateId: addTemplate }); }} disabled={!addTemplate || addSlot.isPending} className="gap-2">
                    <Plus className="w-4 h-4" /> Add Slot
                  </Button>
                </div>
              </CardContent>
            </Card>
            <div className="grid md:grid-cols-2 gap-4">
              {Array.from({ length: plan.shiftCycle }, (_, i) => {
                const weekSlots = planSlots.filter(s => s.cycleIndex === i + 1);
                return (
                  <Card key={i} className="shadow-sm">
                    <CardHeader className="pb-2"><CardTitle className="font-display text-sm font-semibold">Week {String.fromCharCode(65 + i)}</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {weekSlots.length === 0 ? <p className="text-xs text-muted-foreground">No slots yet.</p> : weekSlots.map(slot => {
                        const tmpl = templates.find(t => t.id === slot.templateId);
                        const loc = locations.find(l => l.id === tmpl?.locationId);
                        const days = JSON.parse(tmpl?.weekDays || "[]");
                        return (
                          <div key={slot.id} className="flex items-center justify-between p-2 rounded bg-secondary/50">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${tmpl?.color ?? "bg-sky-500"}`} />
                              <div>
                                <p className="text-xs font-medium">{tmpl?.name}</p>
                                <p className="text-xs text-muted-foreground">{loc?.name} · {tmpl?.startTime} · {days.join(", ")}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(slot.id)}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Remove slot?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteId && delSlot.mutate({ id: deleteId })}>Remove</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
