/**
 * BrightSmiles – Admin Shift Template Library
 * Design: Warm Professional
 *
 * Admins can:
 *  - Browse all reusable shift templates
 *  - Add new templates (days, start time, duration, location, role, colour)
 *  - Edit existing templates
 *  - Delete templates (with usage warning)
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
  SHIFT_TEMPLATES,
  SHIFT_PLAN_SLOTS,
  LOCATIONS,
  type ShiftTemplate,
  type DayOfWeek,
  type ProviderRole,
  addShiftTemplate,
  updateShiftTemplate,
  deleteShiftTemplate,
  getLocation,
} from "@/lib/data";
import { Plus, Pencil, Trash2, Clock, MapPin, AlertCircle, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_DAYS: DayOfWeek[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DURATION_OPTIONS = [
  { value: "PT2H",  label: "2 hours" },
  { value: "PT3H",  label: "3 hours" },
  { value: "PT4H",  label: "4 hours (half day)" },
  { value: "PT5H",  label: "5 hours" },
  { value: "PT6H",  label: "6 hours" },
  { value: "PT7H",  label: "7 hours" },
  { value: "PT8H",  label: "8 hours (full day)" },
  { value: "PT9H",  label: "9 hours" },
  { value: "PT10H", label: "10 hours" },
];

const COLOR_OPTIONS = [
  { value: "bg-blue-500",    label: "Blue",    preview: "bg-blue-500" },
  { value: "bg-sky-400",     label: "Sky",     preview: "bg-sky-400" },
  { value: "bg-indigo-400",  label: "Indigo",  preview: "bg-indigo-400" },
  { value: "bg-emerald-500", label: "Emerald", preview: "bg-emerald-500" },
  { value: "bg-teal-400",    label: "Teal",    preview: "bg-teal-400" },
  { value: "bg-violet-500",  label: "Violet",  preview: "bg-violet-500" },
  { value: "bg-purple-400",  label: "Purple",  preview: "bg-purple-400" },
  { value: "bg-amber-500",   label: "Amber",   preview: "bg-amber-500" },
  { value: "bg-rose-500",    label: "Rose",    preview: "bg-rose-500" },
  { value: "bg-slate-500",   label: "Slate",   preview: "bg-slate-500" },
];

function parseDuration(iso: string): string {
  const match = iso.match(/PT(\d+)H/);
  if (!match) return iso;
  const h = parseInt(match[1]);
  return h === 4 ? "4h (half)" : h === 8 ? "8h (full)" : `${h}h`;
}

// ─── Form ─────────────────────────────────────────────────────────────────────

interface TemplateForm {
  name: string;
  weekDays: DayOfWeek[];
  startTime: string;
  duration: string;
  locationId: string;
  defaultRole: ProviderRole;
  color: string;
}

const EMPTY_FORM: TemplateForm = {
  name: "",
  weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  startTime: "09:00",
  duration: "PT8H",
  locationId: "LOC-001",
  defaultRole: "Dentist",
  color: "bg-blue-500",
};

function templateToForm(t: ShiftTemplate): TemplateForm {
  return {
    name: t.name,
    weekDays: [...t.weekDays],
    startTime: t.startTime,
    duration: t.duration,
    locationId: t.locationId,
    defaultRole: t.defaultRole,
    color: t.color,
  };
}

interface TemplateDialogProps {
  open: boolean;
  mode: "add" | "edit";
  initialValues?: TemplateForm;
  entryId?: string;
  onClose: () => void;
  onSaved: () => void;
}

function TemplateDialog({ open, mode, initialValues, entryId, onClose, onSaved }: TemplateDialogProps) {
  const [form, setForm] = useState<TemplateForm>(initialValues ?? EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) { setForm(initialValues ?? EMPTY_FORM); setError(null); }
    else onClose();
  }

  function patch(p: Partial<TemplateForm>) { setForm((f) => ({ ...f, ...p })); setError(null); }

  function toggleDay(day: DayOfWeek) {
    setForm((f) => ({
      ...f,
      weekDays: f.weekDays.includes(day)
        ? f.weekDays.filter((d) => d !== day)
        : [...f.weekDays, day],
    }));
    setError(null);
  }

  function validate(): string | null {
    if (!form.name.trim()) return "Template name is required.";
    if (form.weekDays.length === 0) return "Select at least one day.";
    if (!form.locationId) return "Location is required.";
    return null;
  }

  function handleSave() {
    const err = validate();
    if (err) { setError(err); return; }
    const payload = { ...form, name: form.name.trim() };
    if (mode === "add") {
      addShiftTemplate(payload);
      toast.success("Template created");
    } else if (entryId) {
      updateShiftTemplate(entryId, payload);
      toast.success("Template updated");
    }
    onSaved();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {mode === "add" ? "New Shift Template" : "Edit Shift Template"}
          </DialogTitle>
          <DialogDescription>
            Templates define the shape of a shift — days, times, and location. They are reusable across multiple plans.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
          {/* Name */}
          <div className="space-y-1.5">
            <Label>Template Name</Label>
            <Input
              placeholder="e.g. Full Day – Downtown"
              value={form.name}
              onChange={(e) => patch({ name: e.target.value })}
            />
          </div>

          {/* Days */}
          <div className="space-y-1.5">
            <Label>Days of Week</Label>
            <div className="flex gap-1.5 flex-wrap">
              {ALL_DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "w-10 h-10 rounded-lg text-xs font-semibold border transition-colors",
                    form.weekDays.includes(day)
                      ? "bg-primary text-white border-primary"
                      : "border-border hover:border-primary/40 text-muted-foreground"
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Time + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) => patch({ startTime: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Duration</Label>
              <Select value={form.duration} onValueChange={(v) => patch({ duration: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location + Role */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Select value={form.locationId} onValueChange={(v) => patch({ locationId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Default Role</Label>
              <Select value={form.defaultRole} onValueChange={(v) => patch({ defaultRole: v as ProviderRole })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dentist">Dentist</SelectItem>
                  <SelectItem value="Hygienist">Hygienist</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Colour */}
          <div className="space-y-1.5">
            <Label>Colour (for schedule grid)</Label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => patch({ color: c.value })}
                  title={c.label}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all",
                    c.preview,
                    form.color === c.value ? "ring-2 ring-offset-2 ring-foreground scale-110" : "opacity-70 hover:opacity-100"
                  )}
                />
              ))}
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
          <Button onClick={handleSave}>{mode === "add" ? "Create Template" : "Save Changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminTemplates() {
  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate((n) => n + 1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<ShiftTemplate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Group by role
  const dentistTemplates = SHIFT_TEMPLATES.filter((t) => t.defaultRole === "Dentist");
  const hygienistTemplates = SHIFT_TEMPLATES.filter((t) => t.defaultRole === "Hygienist");

  function usageCount(templateId: string): number {
    return SHIFT_PLAN_SLOTS.filter((s) => s.templateId === templateId).length;
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteShiftTemplate(deleteId);
    toast.success("Template deleted");
    setDeleteId(null);
    refresh();
  }

  const deleteTemplate = SHIFT_TEMPLATES.find((t) => t.id === deleteId);
  const deleteUsage = deleteId ? usageCount(deleteId) : 0;

  function TemplateGroup({ title, templates }: { title: string; templates: ShiftTemplate[] }) {
    return (
      <div>
        <h2 className="font-display text-base font-semibold text-muted-foreground mb-3">{title}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => {
            const loc = getLocation(t.locationId);
            const usage = usageCount(t.id);
            return (
              <Card key={t.id} className="shadow-sm group overflow-hidden">
                {/* Colour stripe */}
                <div className={cn("h-1.5 w-full", t.color)} />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full shrink-0", t.color)} />
                      <p className="font-display font-semibold text-sm text-foreground">{t.name}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => { setEditTemplate(t); setDialogOpen(true); }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteId(t.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>{t.startTime} · {parseDuration(t.duration)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{loc?.name ?? t.locationId}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {t.weekDays.map((d) => (
                      <span key={d} className="text-xs px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground font-medium">
                        {d}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">{t.defaultRole}</Badge>
                    {usage > 0 && (
                      <span className="text-xs text-muted-foreground">Used in {usage} plan slot{usage !== 1 ? "s" : ""}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
              <LayoutGrid className="w-6 h-6 text-primary" />
              Shift Template Library
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Reusable shift shapes that can be assembled into rotation plans. Hover a card to edit or delete.
            </p>
          </div>
          <Button onClick={() => { setEditTemplate(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> New Template
          </Button>
        </div>

        <TemplateGroup title="Dentist Templates" templates={dentistTemplates} />
        {hygienistTemplates.length > 0 && (
          <TemplateGroup title="Hygienist Templates" templates={hygienistTemplates} />
        )}
      </div>

      {/* Add / Edit dialog */}
      <TemplateDialog
        open={dialogOpen}
        mode={editTemplate ? "edit" : "add"}
        initialValues={editTemplate ? templateToForm(editTemplate) : EMPTY_FORM}
        entryId={editTemplate?.id}
        onClose={() => { setDialogOpen(false); setEditTemplate(null); }}
        onSaved={refresh}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTemplate?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteUsage > 0
                ? `This template is used in ${deleteUsage} plan slot${deleteUsage !== 1 ? "s" : ""}. Deleting it will leave those slots without a template — review the Plan Builder afterwards.`
                : "This template is not used in any plan slots and can be safely deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
