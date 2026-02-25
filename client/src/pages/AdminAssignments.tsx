/**
 * BrightSmiles – Admin Provider Assignments
 * Design: Warm Professional
 *
 * Admins can:
 *  - View all provider assignments grouped by provider
 *  - Add new assignments (provider → plan slot, effective date, optional end date)
 *  - Edit existing assignments
 *  - End (close) an assignment by setting an end date
 *  - Delete assignments
 */

import { useState } from "react";
import { AdminLayout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  PROVIDERS,
  SHIFT_PLANS,
  SHIFT_PLAN_SLOTS,
  PROVIDER_ASSIGNMENTS,
  type ProviderAssignment,
  addProviderAssignment,
  updateProviderAssignment,
  deleteProviderAssignment,
  getShiftTemplate,
  getLocation,
} from "@/lib/data";
import {
  Plus,
  Pencil,
  Trash2,
  UserCheck,
  CalendarRange,
  AlertCircle,
  Clock,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(d: string | null): string {
  if (!d) return "Open-ended";
  const [y, m, day] = d.split("-").map(Number);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[m - 1]} ${day}, ${y}`;
}

function isActive(a: ProviderAssignment): boolean {
  if (!a.endDate) return true;
  return a.endDate >= new Date().toISOString().slice(0, 10);
}

function parseDuration(iso: string): string {
  const m = iso.match(/PT(\d+)H/);
  return m ? `${m[1]}h` : iso;
}

// ─── Assignment Form ──────────────────────────────────────────────────────────

interface AssignmentForm {
  providerId: string;
  shiftPlanId: string;
  shiftPlanSlotId: string;
  effectiveDate: string;
  endDate: string;
  hasEndDate: boolean;
}

const EMPTY_FORM: AssignmentForm = {
  providerId: "",
  shiftPlanId: "",
  shiftPlanSlotId: "",
  effectiveDate: new Date().toISOString().slice(0, 10),
  endDate: "",
  hasEndDate: false,
};

interface AssignmentDialogProps {
  open: boolean;
  mode: "add" | "edit";
  initialValues?: AssignmentForm;
  entryId?: string;
  fixedProviderId?: string;
  onClose: () => void;
  onSaved: () => void;
}

function AssignmentDialog({
  open,
  mode,
  initialValues,
  entryId,
  fixedProviderId,
  onClose,
  onSaved,
}: AssignmentDialogProps) {
  const [form, setForm] = useState<AssignmentForm>(initialValues ?? EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) {
      const base = initialValues ?? EMPTY_FORM;
      setForm(fixedProviderId ? { ...base, providerId: fixedProviderId } : base);
      setError(null);
    } else {
      onClose();
    }
  }

  function patch(p: Partial<AssignmentForm>) {
    setForm((f) => ({ ...f, ...p }));
    setError(null);
  }

  // Slots for the selected plan
  const availableSlots = SHIFT_PLAN_SLOTS.filter((s) => s.shiftPlanId === form.shiftPlanId);

  function validate(): string | null {
    if (!form.providerId) return "Select a provider.";
    if (!form.shiftPlanSlotId) return "Select a plan slot.";
    if (!form.effectiveDate) return "Effective date is required.";
    if (form.hasEndDate && form.endDate && form.endDate < form.effectiveDate)
      return "End date must be on or after the effective date.";
    return null;
  }

  function handleSave() {
    const err = validate();
    if (err) { setError(err); return; }
    const payload = {
      providerId: form.providerId,
      shiftPlanSlotId: form.shiftPlanSlotId,
      effectiveDate: form.effectiveDate,
      endDate: form.hasEndDate && form.endDate ? form.endDate : null,
    };
    if (mode === "add") {
      addProviderAssignment(payload);
      toast.success("Assignment created");
    } else if (entryId) {
      updateProviderAssignment(entryId, payload);
      toast.success("Assignment updated");
    }
    onSaved();
    onClose();
  }

  const selectedSlot = availableSlots.find((s) => s.id === form.shiftPlanSlotId);
  const selectedTemplate = selectedSlot ? getShiftTemplate(selectedSlot.templateId) : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {mode === "add" ? "New Provider Assignment" : "Edit Assignment"}
          </DialogTitle>
          <DialogDescription>
            Link a provider to a plan slot for a specific date range.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
          {/* Provider */}
          {!fixedProviderId && (
            <div className="space-y-1.5">
              <Label>Provider</Label>
              <Select value={form.providerId} onValueChange={(v) => patch({ providerId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider…" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <img src={p.photoUrl} alt={p.name} className="w-5 h-5 rounded-full object-cover object-top" />
                        {p.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Plan */}
          <div className="space-y-1.5">
            <Label>Shift Plan</Label>
            <Select
              value={form.shiftPlanId}
              onValueChange={(v) => patch({ shiftPlanId: v, shiftPlanSlotId: "" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select plan…" />
              </SelectTrigger>
              <SelectContent>
                {SHIFT_PLANS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Slot */}
          {form.shiftPlanId && (
            <div className="space-y-1.5">
              <Label>Plan Slot</Label>
              <Select value={form.shiftPlanSlotId} onValueChange={(v) => patch({ shiftPlanSlotId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select slot…" />
                </SelectTrigger>
                <SelectContent>
                  {availableSlots.map((s) => {
                    const tpl = getShiftTemplate(s.templateId);
                    return (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2">
                          {tpl && <span className={cn("w-2 h-2 rounded-full shrink-0", tpl.color)} />}
                          <span>{tpl?.name ?? s.id}</span>
                          <span className="text-muted-foreground text-xs">
                            (Cycle {s.cycleIndex === 1 ? "A" : s.cycleIndex === 2 ? "B" : s.cycleIndex})
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {/* Slot preview */}
              {selectedTemplate && (
                <div className="p-2.5 rounded-lg bg-secondary/50 text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {selectedTemplate.startTime} · {parseDuration(selectedTemplate.duration)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    {getLocation(selectedTemplate.locationId)?.name}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedTemplate.weekDays.map((d) => (
                      <span key={d} className="px-1 py-0.5 rounded bg-secondary font-medium">{d}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Effective From</Label>
              <Input
                type="date"
                value={form.effectiveDate}
                onChange={(e) => patch({ effectiveDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => patch({ hasEndDate: true })}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                      form.hasEndDate ? "bg-primary text-white border-primary" : "border-border hover:border-primary/40"
                    )}
                  >
                    Set End
                  </button>
                  <button
                    type="button"
                    onClick={() => patch({ hasEndDate: false, endDate: "" })}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                      !form.hasEndDate ? "bg-primary text-white border-primary" : "border-border hover:border-primary/40"
                    )}
                  >
                    Open-ended
                  </button>
                </div>
                {form.hasEndDate && (
                  <Input
                    type="date"
                    value={form.endDate}
                    min={form.effectiveDate}
                    onChange={(e) => patch({ endDate: e.target.value })}
                  />
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>
            {mode === "add" ? "Create Assignment" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Provider Assignment Card ─────────────────────────────────────────────────

function ProviderAssignmentCard({ provider }: { provider: (typeof PROVIDERS)[0] }) {
  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate((n) => n + 1);

  const assignments = PROVIDER_ASSIGNMENTS.filter((a) => a.providerId === provider.id);
  const active = assignments.filter(isActive);
  const expired = assignments.filter((a) => !isActive(a));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAssignment, setEditAssignment] = useState<ProviderAssignment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function handleDelete() {
    if (!deleteId) return;
    deleteProviderAssignment(deleteId);
    toast.success("Assignment removed");
    setDeleteId(null);
    refresh();
  }

  function AssignmentRow({ a }: { a: ProviderAssignment }) {
    const slot = SHIFT_PLAN_SLOTS.find((s) => s.id === a.shiftPlanSlotId);
    const plan = slot ? SHIFT_PLANS.find((p) => p.id === slot.shiftPlanId) : null;
    const template = slot ? getShiftTemplate(slot.templateId) : null;
    const active = isActive(a);

    return (
      <div className={cn(
        "flex items-start gap-3 p-3 rounded-lg border group",
        active ? "bg-green-50 border-green-100" : "bg-secondary/30 border-border opacity-60"
      )}>
        {template && (
          <div className={cn("w-2.5 h-2.5 rounded-full shrink-0 mt-1", template.color)} />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{template?.name ?? a.shiftPlanSlotId}</span>
            <Badge variant="outline" className="text-xs">
              {plan?.name ?? "—"}
            </Badge>
            {active ? (
              <Badge className="text-xs bg-green-100 text-green-700 border-green-200">Active</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Ended</Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
            <CalendarRange className="w-3 h-3" />
            <span>{formatDate(a.effectiveDate)} → {formatDate(a.endDate)}</span>
          </div>
          {template && (
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{template.startTime} · {parseDuration(template.duration)}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{getLocation(template.locationId)?.name?.replace(" Clinic", "")}</span>
            </div>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => {
              const slot = SHIFT_PLAN_SLOTS.find((s) => s.id === a.shiftPlanSlotId);
              setEditAssignment(a);
              setDialogOpen(true);
            }}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => setDeleteId(a.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  function assignmentToForm(a: ProviderAssignment): AssignmentForm {
    const slot = SHIFT_PLAN_SLOTS.find((s) => s.id === a.shiftPlanSlotId);
    return {
      providerId: a.providerId,
      shiftPlanId: slot?.shiftPlanId ?? "",
      shiftPlanSlotId: a.shiftPlanSlotId,
      effectiveDate: a.effectiveDate,
      endDate: a.endDate ?? "",
      hasEndDate: !!a.endDate,
    };
  }

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <img
              src={provider.photoUrl}
              alt={provider.name}
              className="w-10 h-10 rounded-full object-cover object-top shrink-0"
            />
            <div className="flex-1 min-w-0">
              <CardTitle className="font-display text-base">{provider.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{provider.role}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{active.length} active</Badge>
              <Button
                size="sm"
                onClick={() => { setEditAssignment(null); setDialogOpen(true); }}
              >
                <Plus className="w-4 h-4 mr-1" /> Assign
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {assignments.length === 0 ? (
            <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground/60">
              <UserCheck className="w-5 h-5" />
              <span className="text-sm">No assignments yet</span>
            </div>
          ) : (
            <>
              {active.map((a) => <AssignmentRow key={a.id} a={a} />)}
              {expired.length > 0 && (
                <>
                  <p className="text-xs text-muted-foreground pt-1">Past assignments</p>
                  {expired.map((a) => <AssignmentRow key={a.id} a={a} />)}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit dialog */}
      <AssignmentDialog
        open={dialogOpen}
        mode={editAssignment ? "edit" : "add"}
        initialValues={editAssignment ? assignmentToForm(editAssignment) : { ...EMPTY_FORM, providerId: provider.id }}
        entryId={editAssignment?.id}
        fixedProviderId={provider.id}
        onClose={() => { setDialogOpen(false); setEditAssignment(null); }}
        onSaved={refresh}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the assignment. The provider will no longer be
              scheduled for this slot. Existing booked appointments are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminAssignments() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-primary" />
            Provider Assignments
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Assign providers to plan slots with effective date ranges. Active assignments drive the schedule grid.
          </p>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-100 text-blue-800 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Hover any row to reveal <strong>edit</strong> and <strong>remove</strong> controls.
            Open-ended assignments remain active until an end date is set.
          </span>
        </div>

        <div className="space-y-6">
          {PROVIDERS.map((p) => (
            <ProviderAssignmentCard key={p.id} provider={p} />
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
