import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2, CalendarDays, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function AdminPlanBuilder() {
  const utils = trpc.useUtils();
  const { data: plans = [], isLoading: plansLoading } = trpc.shiftPlans.list.useQuery();
  const { data: templates = [] } = trpc.shiftTemplates.list.useQuery();
  const { data: locations = [] } = trpc.locations.list.useQuery();
  const { data: slots = [] } = trpc.shiftPlanSlots.list.useQuery({});

  const addSlot = trpc.shiftPlanSlots.upsert.useMutation({
    onSuccess: () => { utils.shiftPlanSlots.list.invalidate(); toast.success("Slot added"); setAddTemplate(""); },
  });
  const delSlot = trpc.shiftPlanSlots.delete.useMutation({
    onSuccess: () => { utils.shiftPlanSlots.list.invalidate(); toast.success("Slot removed"); setDeleteId(null); },
  });
  const createPlan = trpc.shiftPlans.upsert.useMutation({
    onSuccess: (data) => {
      utils.shiftPlans.list.invalidate();
      toast.success("Shift plan created");
      setNewPlanOpen(false);
      setSelectedPlan(data.id);
    },
  });

  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [addWeek, setAddWeek] = useState(1);
  const [addTemplate, setAddTemplate] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newPlanOpen, setNewPlanOpen] = useState(false);
  const [newPlanForm, setNewPlanForm] = useState({
    name: "", shiftCycle: 2, shiftCycleUnit: "weeks",
    effectiveDate: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (!selectedPlan && plans.length > 0) setSelectedPlan(plans[0].id);
  }, [plans, selectedPlan]);

  const plan = plans.find((p) => p.id === selectedPlan);
  const planSlots = slots.filter((s) => s.shiftPlanId === selectedPlan);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold">Plan Builder</h1>
            <p className="text-muted-foreground text-sm mt-1">Assemble templates into rotation plan slots</p>
          </div>
          <Button onClick={() => { setNewPlanForm({ name: "", shiftCycle: 2, shiftCycleUnit: "weeks", effectiveDate: new Date().toISOString().slice(0, 10) }); setNewPlanOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> New Shift Plan
          </Button>
        </div>

        {plansLoading ? (
          <p className="text-muted-foreground">Loading plans...</p>
        ) : plans.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-xl">
            <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No shift plans yet</p>
            <p className="text-sm mt-1 mb-4">Create your first shift plan to start building schedules.</p>
            <Button onClick={() => setNewPlanOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> New Shift Plan</Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {plans.map((p) => {
                const slotCount = slots.filter((s) => s.shiftPlanId === p.id).length;
                return (
                  <button key={p.id} onClick={() => setSelectedPlan(p.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${selectedPlan === p.id ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40 text-foreground"}`}>
                    <CalendarDays className="w-4 h-4" />
                    {p.name}
                    <Badge variant="secondary" className="text-xs ml-1">{slotCount}</Badge>
                  </button>
                );
              })}
            </div>

            {plan && (
              <div className="space-y-5">
                <Card className="shadow-sm">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <h2 className="font-display font-semibold text-lg">{plan.name}</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {plan.shiftCycle}-{plan.shiftCycleUnit} rotation · effective {plan.effectiveDate}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">{planSlots.length} slots</Badge>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-dashed">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Add a Slot to {plan.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3 flex-wrap items-end">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Cycle Week</p>
                        <Select value={String(addWeek)} onValueChange={(v) => setAddWeek(Number(v))}>
                          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: plan.shiftCycle }, (_, i) => (
                              <SelectItem key={i + 1} value={String(i + 1)}>Week {String.fromCharCode(64 + i + 1)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 min-w-48">
                        <p className="text-xs text-muted-foreground mb-1">Template</p>
                        <Select value={addTemplate} onValueChange={setAddTemplate}>
                          <SelectTrigger><SelectValue placeholder="Select template..." /></SelectTrigger>
                          <SelectContent>
                            {templates.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${t.color} shrink-0`} />
                                  {t.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={() => {
                        if (!addTemplate) return;
                        addSlot.mutate({ shiftPlanId: selectedPlan, cycleIndex: addWeek, templateId: addTemplate });
                      }} disabled={!addTemplate || addSlot.isPending} className="gap-2">
                        <Plus className="w-4 h-4" /> Add Slot
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-4">
                  {Array.from({ length: plan.shiftCycle }, (_, i) => {
                    const weekSlots = planSlots.filter((s) => s.cycleIndex === i + 1);
                    return (
                      <Card key={i} className="shadow-sm">
                        <CardHeader className="pb-3">
                          <CardTitle className="font-display text-base flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                              {String.fromCharCode(65 + i)}
                            </span>
                            Week {String.fromCharCode(65 + i)}
                            <Badge variant="secondary" className="text-xs ml-auto">{weekSlots.length} slots</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {weekSlots.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground text-xs border-2 border-dashed border-border rounded-lg">
                              No slots yet - add one above
                            </div>
                          ) : weekSlots.map((slot) => {
                            const tmpl = templates.find((t) => t.id === slot.templateId);
                            const loc = locations.find((l) => l.id === tmpl?.locationId);
                            const days = (tmpl?.weekDays ?? "").split(",").filter(Boolean);
                            return (
                              <div key={slot.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/50 hover:bg-secondary/70 transition-colors group">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className={`w-3 h-3 rounded-full ${tmpl?.color ?? "bg-sky-500"} shrink-0`} />
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{tmpl?.name ?? "Unknown template"}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {loc?.name ?? "-"} · {tmpl?.startTime}-{tmpl?.endTime} · {days.join(", ")}
                                    </p>
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                  onClick={() => setDeleteId(slot.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        <Dialog open={newPlanOpen} onOpenChange={setNewPlanOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">New Shift Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Plan Name *</Label>
                <Input className="mt-1" value={newPlanForm.name}
                  onChange={(e) => setNewPlanForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. 2-Week Dentist Rotation" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cycle Length *</Label>
                  <Select value={String(newPlanForm.shiftCycle)} onValueChange={(v) => setNewPlanForm((f) => ({ ...f, shiftCycle: Number(v) }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((n) => <SelectItem key={n} value={String(n)}>{n} {n === 1 ? "week" : "weeks"}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Effective Date *</Label>
                  <Input type="date" className="mt-1" value={newPlanForm.effectiveDate}
                    onChange={(e) => setNewPlanForm((f) => ({ ...f, effectiveDate: e.target.value }))} />
                </div>
              </div>
              <div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground flex items-start gap-2">
                <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" />
                <span>After creating the plan, add template slots to each cycle week using the builder below.</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewPlanOpen(false)}>Cancel</Button>
              <Button onClick={() => createPlan.mutate(newPlanForm)} disabled={!newPlanForm.name || createPlan.isPending}>
                {createPlan.isPending ? "Creating..." : "Create Plan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove slot?</AlertDialogTitle>
              <AlertDialogDescription>This will remove the slot from the plan.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground"
                onClick={() => deleteId && delSlot.mutate({ id: deleteId })}>Remove</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
