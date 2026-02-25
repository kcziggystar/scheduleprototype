/**
 * BrightSmiles – Admin PTO Editor
 * Design: Warm Professional
 *
 * Allows admins to:
 *  - View all PTO entries per provider
 *  - Add new PTO entries (full-day, multi-day, or partial-day)
 *  - Edit existing entries inline
 *  - Delete entries with confirmation
 */

import { useState, useCallback } from "react";
import { AdminLayout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  PTO_CALENDARS,
  PTO_ENTRIES,
  type PtoEntry,
  addPtoEntry,
  updatePtoEntry,
  deletePtoEntry,
  getLocation,
} from "@/lib/data";
import {
  Plane,
  Plus,
  Pencil,
  Trash2,
  CalendarRange,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateTimeDisplay(iso: string): string {
  // "2026-02-16T00:00" → "Feb 16, 2026 00:00"
  const [datePart, timePart] = iso.split("T");
  if (!datePart) return iso;
  const [y, m, d] = datePart.split("-").map(Number);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[m - 1]} ${d}, ${y}${timePart ? ` ${timePart}` : ""}`;
}

function isFullDay(start: string, end: string): boolean {
  return start.endsWith("T00:00") && end.endsWith("T23:59");
}

function durationLabel(start: string, end: string): string {
  const s = new Date(start.replace("T", " "));
  const e = new Date(end.replace("T", " "));
  const diffMs = e.getTime() - s.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays >= 1) return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  return `${diffHours} hour${diffHours !== 1 ? "s" : ""}`;
}

// ─── PTO Form ─────────────────────────────────────────────────────────────────

interface PtoFormValues {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  notes: string;
  fullDay: boolean;
}

const EMPTY_FORM: PtoFormValues = {
  startDate: "",
  startTime: "00:00",
  endDate: "",
  endTime: "23:59",
  notes: "",
  fullDay: true,
};

function ptoEntryToForm(entry: PtoEntry): PtoFormValues {
  const [startDate, startTime] = entry.start.split("T");
  const [endDate, endTime] = entry.end.split("T");
  return {
    startDate,
    startTime: startTime ?? "00:00",
    endDate,
    endTime: endTime ?? "23:59",
    notes: entry.notes,
    fullDay: isFullDay(entry.start, entry.end),
  };
}

function formToIso(form: PtoFormValues): { start: string; end: string } {
  if (form.fullDay) {
    return {
      start: `${form.startDate}T00:00`,
      end: `${form.endDate}T23:59`,
    };
  }
  return {
    start: `${form.startDate}T${form.startTime}`,
    end: `${form.endDate}T${form.endTime}`,
  };
}

function validateForm(form: PtoFormValues): string | null {
  if (!form.startDate) return "Start date is required.";
  if (!form.endDate) return "End date is required.";
  if (!form.notes.trim()) return "A description / reason is required.";
  const { start, end } = formToIso(form);
  if (end <= start) return "End must be after start.";
  return null;
}

interface PtoDialogProps {
  open: boolean;
  mode: "add" | "edit";
  calendarId: string;
  providerName: string;
  initialValues?: PtoFormValues;
  entryId?: string;
  onClose: () => void;
  onSaved: () => void;
}

function PtoDialog({
  open,
  mode,
  calendarId,
  providerName,
  initialValues,
  entryId,
  onClose,
  onSaved,
}: PtoDialogProps) {
  const [form, setForm] = useState<PtoFormValues>(initialValues ?? EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens with new values
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        setForm(initialValues ?? EMPTY_FORM);
        setError(null);
      } else {
        onClose();
      }
    },
    [initialValues, onClose]
  );

  function patch(p: Partial<PtoFormValues>) {
    setForm((f) => ({ ...f, ...p }));
    setError(null);
  }

  function handleSave() {
    const err = validateForm(form);
    if (err) { setError(err); return; }
    const { start, end } = formToIso(form);
    if (mode === "add") {
      addPtoEntry({ calendarId, start, end, notes: form.notes.trim() });
      toast.success(`PTO added for ${providerName}`);
    } else if (entryId) {
      updatePtoEntry(entryId, { start, end, notes: form.notes.trim() });
      toast.success("PTO entry updated");
    }
    onSaved();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {mode === "add" ? "Add PTO Entry" : "Edit PTO Entry"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add" ? `Adding leave for ${providerName}` : `Editing leave for ${providerName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Full-day toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => patch({ fullDay: true, startTime: "00:00", endTime: "23:59" })}
              className={cn(
                "flex-1 py-2 rounded-lg border text-sm font-medium transition-colors",
                form.fullDay ? "bg-primary text-white border-primary" : "border-border hover:border-primary/40"
              )}
            >
              Full Day(s)
            </button>
            <button
              type="button"
              onClick={() => patch({ fullDay: false })}
              className={cn(
                "flex-1 py-2 rounded-lg border text-sm font-medium transition-colors",
                !form.fullDay ? "bg-primary text-white border-primary" : "border-border hover:border-primary/40"
              )}
            >
              Partial Day
            </button>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pto-start-date">Start Date</Label>
              <Input
                id="pto-start-date"
                type="date"
                value={form.startDate}
                onChange={(e) => {
                  patch({ startDate: e.target.value });
                  // Auto-fill end date if empty
                  if (!form.endDate) patch({ endDate: e.target.value });
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pto-end-date">End Date</Label>
              <Input
                id="pto-end-date"
                type="date"
                value={form.endDate}
                min={form.startDate}
                onChange={(e) => patch({ endDate: e.target.value })}
              />
            </div>
          </div>

          {/* Times (partial day only) */}
          {!form.fullDay && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pto-start-time">Start Time</Label>
                <Input
                  id="pto-start-time"
                  type="time"
                  value={form.startTime}
                  onChange={(e) => patch({ startTime: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pto-end-time">End Time</Label>
                <Input
                  id="pto-end-time"
                  type="time"
                  value={form.endTime}
                  onChange={(e) => patch({ endTime: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="pto-notes">Reason / Description</Label>
            <Input
              id="pto-notes"
              placeholder="e.g. Vacation, Conference, Personal"
              value={form.notes}
              onChange={(e) => patch({ notes: e.target.value })}
            />
          </div>

          {/* Error */}
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
            {mode === "add" ? "Add Entry" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Provider PTO Card ────────────────────────────────────────────────────────

function ProviderPtoCard({ provider }: { provider: (typeof PROVIDERS)[0] }) {
  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate((n) => n + 1);

  const ptoCal = PTO_CALENDARS.find((c) => c.id === provider.ptoCalendarId);
  const entries = PTO_ENTRIES.filter((e) => e.calendarId === provider.ptoCalendarId)
    .sort((a, b) => a.start.localeCompare(b.start));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<PtoEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loc = getLocation(provider.primaryLocationId);

  function handleDelete() {
    if (!deleteId) return;
    deletePtoEntry(deleteId);
    toast.success("PTO entry removed");
    setDeleteId(null);
    refresh();
  }

  return (
    <>
      <Card className="shadow-sm">
        {/* Provider header */}
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <img
              src={provider.photoUrl}
              alt={provider.name}
              className="w-10 h-10 rounded-full object-cover object-top shrink-0"
            />
            <div className="flex-1 min-w-0">
              <CardTitle className="font-display text-base">{provider.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{loc?.name} · {ptoCal?.name}</p>
            </div>
            <Button
              size="sm"
              onClick={() => { setEditEntry(null); setDialogOpen(true); }}
              className="shrink-0"
            >
              <Plus className="w-4 h-4 mr-1" /> Add PTO
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {entries.length === 0 ? (
            <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground/60">
              <Plane className="w-5 h-5" />
              <span className="text-sm">No PTO entries</span>
            </div>
          ) : (
            entries.map((entry) => {
              const full = isFullDay(entry.start, entry.end);
              const dur = durationLabel(entry.start, entry.end);
              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100 group"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    {full ? <CalendarRange className="w-4 h-4 text-amber-600" /> : <Clock className="w-4 h-4 text-amber-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-foreground">{entry.notes}</span>
                      <Badge variant="outline" className="text-xs border-amber-200 text-amber-700 bg-amber-50">
                        {dur}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDateTimeDisplay(entry.start)}
                      {" → "}
                      {formatDateTimeDisplay(entry.end)}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground/50 mt-0.5">{entry.id}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => { setEditEntry(entry); setDialogOpen(true); }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteId(entry.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Add / Edit dialog */}
      <PtoDialog
        open={dialogOpen}
        mode={editEntry ? "edit" : "add"}
        calendarId={provider.ptoCalendarId}
        providerName={provider.name}
        initialValues={editEntry ? ptoEntryToForm(editEntry) : EMPTY_FORM}
        entryId={editEntry?.id}
        onClose={() => { setDialogOpen(false); setEditEntry(null); }}
        onSaved={refresh}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete PTO Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the PTO entry. Available slots on those dates
              will open up immediately for patient booking.
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
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPto() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
              <Plane className="w-6 h-6 text-amber-500" />
              PTO Editor
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Add, edit, or remove time-off entries for each provider. Changes affect slot
              availability immediately.
            </p>
          </div>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-100 text-blue-800 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Hover over any entry to reveal the <strong>edit</strong> and <strong>delete</strong> controls.
            Full-day entries block the entire day; partial entries only block the specified hours.
          </span>
        </div>

        {/* One card per provider */}
        <div className="space-y-6">
          {PROVIDERS.map((p) => (
            <ProviderPtoCard key={p.id} provider={p} />
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
