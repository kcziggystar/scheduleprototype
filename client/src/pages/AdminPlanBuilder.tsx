/**
 * BrightSmiles – Admin Plan Builder
 * Design: Warm Professional
 *
 * Admins can:
 *  - Select a shift plan
 *  - See all cycle weeks/months as columns
 *  - Add template slots to each cycle position
 *  - Remove slots
 *  - See which providers are assigned to each slot
 */

import { useState } from "react";
import { AdminLayout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  SHIFT_PLANS,
  SHIFT_PLAN_SLOTS,
  SHIFT_TEMPLATES,
  PROVIDER_ASSIGNMENTS,
  PROVIDERS,
  type ShiftPlan,
  type ShiftPlanSlot,
  addShiftPlanSlot,
  deleteShiftPlanSlot,
  getShiftTemplate,
  getLocation,
} from "@/lib/data";
import { Plus, Trash2, Wrench, Clock, MapPin, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDuration(iso: string): string {
  const match = iso.match(/PT(\d+)H/);
  if (!match) return iso;
  const h = parseInt(match[1]);
  return `${h}h`;
}

function cycleLabel(plan: ShiftPlan, cycleIndex: number): string {
  if (plan.shiftCycleUnit === "Week(s)") {
    return cycleIndex === 1 ? "Week A" : cycleIndex === 2 ? "Week B" : `Week ${cycleIndex}`;
  }
  return `Month ${cycleIndex}`;
}

// ─── Add Slot Dialog ──────────────────────────────────────────────────────────

interface AddSlotDialogProps {
  open: boolean;
  plan: ShiftPlan;
  cycleIndex: number;
  onClose: () => void;
  onSaved: () => void;
}

function AddSlotDialog({ open, plan, cycleIndex, onClose, onSaved }: AddSlotDialogProps) {
  const [templateId, setTemplateId] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) { setTemplateId(""); setError(null); }
    else onClose();
  }

  function handleAdd() {
    if (!templateId) { setError("Please select a template."); return; }
    addShiftPlanSlot({ shiftPlanId: plan.id, cycleIndex, templateId });
    toast.success("Slot added to plan");
    onSaved();
    onClose();
  }

  const selectedTemplate = SHIFT_TEMPLATES.find((t) => t.id === templateId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Add Slot to {cycleLabel(plan, cycleIndex)}</DialogTitle>
          <DialogDescription>{plan.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Shift Template</label>
            <Select value={templateId} onValueChange={(v) => { setTemplateId(v); setError(null); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template…" />
              </SelectTrigger>
              <SelectContent>
                {SHIFT_TEMPLATES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", t.color)} />
                      {t.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && (
            <div className="p-3 rounded-lg bg-secondary/50 space-y-1.5 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {selectedTemplate.startTime} · {parseDuration(selectedTemplate.duration)}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                {getLocation(selectedTemplate.locationId)?.name}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedTemplate.weekDays.map((d) => (
                  <span key={d} className="text-xs px-1.5 py-0.5 rounded bg-secondary font-medium">{d}</span>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAdd}>Add Slot</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Slot Card ────────────────────────────────────────────────────────────────

function SlotCard({ slot, onDelete }: { slot: ShiftPlanSlot; onDelete: () => void }) {
  const template = getShiftTemplate(slot.templateId);
  const loc = template ? getLocation(template.locationId) : null;
  const assignees = PROVIDER_ASSIGNMENTS.filter((a) => a.shiftPlanSlotId === slot.id);
  const assignedProviders = assignees.map((a) => PROVIDERS.find((p) => p.id === a.providerId)).filter(Boolean);

  if (!template) {
    return (
      <div className="p-3 rounded-lg border border-dashed border-border text-xs text-muted-foreground">
        Template not found: {slot.templateId}
      </div>
    );
  }

  return (
    <div className="group relative rounded-lg border border-border bg-white overflow-hidden shadow-sm">
      <div className={cn("h-1 w-full", template.color)} />
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className={cn("w-2 h-2 rounded-full shrink-0", template.color)} />
            <p className="font-medium text-xs text-foreground">{template.name}</p>
          </div>
          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:text-destructive text-muted-foreground"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {template.startTime} · {parseDuration(template.duration)}
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {loc?.name?.replace(" Clinic", "") ?? "—"}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {template.weekDays.map((d) => (
            <span key={d} className="text-xs px-1 py-0.5 rounded bg-secondary font-medium">{d}</span>
          ))}
        </div>

        {assignedProviders.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Users className="w-3 h-3" />
              <span>Assigned</span>
            </div>
            <div className="flex -space-x-1">
              {assignedProviders.slice(0, 3).map((p) => p && (
                <img
                  key={p.id}
                  src={p.photoUrl}
                  alt={p.name}
                  title={p.name}
                  className="w-6 h-6 rounded-full object-cover object-top border-2 border-white"
                />
              ))}
              {assignedProviders.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-secondary border-2 border-white flex items-center justify-center text-xs font-medium">
                  +{assignedProviders.length - 3}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPlanBuilder() {
  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate((n) => n + 1);

  const [selectedPlanId, setSelectedPlanId] = useState<string>(SHIFT_PLANS[0]?.id ?? "");
  const [addSlotCycle, setAddSlotCycle] = useState<number | null>(null);

  const plan = SHIFT_PLANS.find((p) => p.id === selectedPlanId);

  // Build cycle indices array
  const cycleCount = plan?.shiftCycle ?? 1;
  const cycleIndices = Array.from({ length: cycleCount }, (_, i) => i + 1);

  function handleDeleteSlot(slotId: string) {
    deleteShiftPlanSlot(slotId);
    toast.success("Slot removed");
    refresh();
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
              <Wrench className="w-6 h-6 text-primary" />
              Plan Builder
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Assemble shift templates into rotation plans. Each column is one cycle position (Week A, Week B, etc.).
            </p>
          </div>

          {/* Plan selector */}
          <div className="w-72">
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a plan…" />
              </SelectTrigger>
              <SelectContent>
                {SHIFT_PLANS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {plan && (
          <>
            {/* Plan metadata */}
            <div className="flex flex-wrap gap-3 text-sm">
              <Badge variant="outline">
                Cycle: {plan.shiftCycle} {plan.shiftCycleUnit}
              </Badge>
              <Badge variant="outline">
                Effective: {plan.effectiveDate.split("T")[0]}
              </Badge>
              <span className="font-mono text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded self-center">
                {plan.id}
              </span>
            </div>

            {/* Cycle columns */}
            <div className={cn(
              "grid gap-6",
              cycleIndices.length === 1 ? "grid-cols-1" :
              cycleIndices.length === 2 ? "md:grid-cols-2" :
              "md:grid-cols-3"
            )}>
              {cycleIndices.map((ci) => {
                const slots = SHIFT_PLAN_SLOTS.filter(
                  (s) => s.shiftPlanId === plan.id && s.cycleIndex === ci
                );
                return (
                  <div key={ci} className="space-y-3">
                    {/* Column header */}
                    <div className="flex items-center justify-between">
                      <h2 className="font-display font-semibold text-sm text-foreground">
                        {cycleLabel(plan, ci)}
                      </h2>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => setAddSlotCycle(ci)}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Slot
                      </Button>
                    </div>

                    {/* Slots */}
                    <div className="space-y-2">
                      {slots.length === 0 ? (
                        <div
                          className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed border-border text-muted-foreground/60 cursor-pointer hover:border-primary/40 transition-colors"
                          onClick={() => setAddSlotCycle(ci)}
                        >
                          <Plus className="w-5 h-5 mb-1" />
                          <span className="text-xs">Add first slot</span>
                        </div>
                      ) : (
                        slots.map((slot) => (
                          <SlotCard
                            key={slot.id}
                            slot={slot}
                            onDelete={() => handleDeleteSlot(slot.id)}
                          />
                        ))
                      )}
                    </div>

                    {/* Summary */}
                    {slots.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {slots.length} slot{slots.length !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Add Slot dialog */}
      {plan && addSlotCycle !== null && (
        <AddSlotDialog
          open={addSlotCycle !== null}
          plan={plan}
          cycleIndex={addSlotCycle}
          onClose={() => setAddSlotCycle(null)}
          onSaved={refresh}
        />
      )}
    </AdminLayout>
  );
}
