/**
 * BrightSmiles – Admin Holiday Editor
 * Design: Warm Professional
 *
 * Allows admins to:
 *  - View all holiday dates grouped by calendar
 *  - Add new holidays (date + name)
 *  - Edit existing holiday names/dates inline
 *  - Delete holidays with confirmation
 */

import { useState } from "react";
import { AdminLayout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  HOLIDAY_CALENDARS,
  HOLIDAY_DATES,
  type HolidayDate,
  addHolidayDate,
  updateHolidayDate,
  deleteHolidayDate,
} from "@/lib/data";
import { CalendarOff, Plus, Pencil, Trash2, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function formatDateDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${d}, ${y}`;
}

function getDayOfWeek(dateStr: string): string {
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const [y, m, d] = dateStr.split("-").map(Number);
  return days[new Date(y, m - 1, d).getDay()];
}

// ─── Holiday Form Dialog ──────────────────────────────────────────────────────

interface HolidayFormValues {
  date: string;
  name: string;
}

const EMPTY_HOLIDAY_FORM: HolidayFormValues = { date: "", name: "" };

interface HolidayDialogProps {
  open: boolean;
  mode: "add" | "edit";
  calendarId: string;
  calendarName: string;
  initialValues?: HolidayFormValues;
  entryId?: string;
  onClose: () => void;
  onSaved: () => void;
}

function HolidayDialog({
  open,
  mode,
  calendarId,
  calendarName,
  initialValues,
  entryId,
  onClose,
  onSaved,
}: HolidayDialogProps) {
  const [form, setForm] = useState<HolidayFormValues>(initialValues ?? EMPTY_HOLIDAY_FORM);
  const [error, setError] = useState<string | null>(null);

  function patch(p: Partial<HolidayFormValues>) {
    setForm((f) => ({ ...f, ...p }));
    setError(null);
  }

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) {
      setForm(initialValues ?? EMPTY_HOLIDAY_FORM);
      setError(null);
    } else {
      onClose();
    }
  }

  function validate(): string | null {
    if (!form.date) return "Date is required.";
    if (!form.name.trim()) return "Holiday name is required.";
    // Check for duplicate date in same calendar
    const existing = HOLIDAY_DATES.find(
      (h) => h.calendarId === calendarId && h.date === form.date && h.id !== entryId
    );
    if (existing) return `A holiday already exists on ${formatDateDisplay(form.date)} (${existing.name}).`;
    return null;
  }

  function handleSave() {
    const err = validate();
    if (err) { setError(err); return; }
    if (mode === "add") {
      addHolidayDate({ calendarId, date: form.date, name: form.name.trim() });
      toast.success("Holiday added");
    } else if (entryId) {
      updateHolidayDate(entryId, { date: form.date, name: form.name.trim() });
      toast.success("Holiday updated");
    }
    onSaved();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">
            {mode === "add" ? "Add Holiday" : "Edit Holiday"}
          </DialogTitle>
          <DialogDescription>{calendarName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="hol-date">Date</Label>
            <Input
              id="hol-date"
              type="date"
              value={form.date}
              onChange={(e) => patch({ date: e.target.value })}
            />
            {form.date && (
              <p className="text-xs text-muted-foreground">
                {getDayOfWeek(form.date)}, {formatDateDisplay(form.date)}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hol-name">Holiday Name</Label>
            <Input
              id="hol-name"
              placeholder="e.g. Labor Day"
              value={form.name}
              onChange={(e) => patch({ name: e.target.value })}
            />
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
            {mode === "add" ? "Add Holiday" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Calendar Section ─────────────────────────────────────────────────────────

function HolidayCalendarSection({ calendarId, calendarName }: { calendarId: string; calendarName: string }) {
  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate((n) => n + 1);

  const entries = HOLIDAY_DATES
    .filter((h) => h.calendarId === calendarId)
    .sort((a, b) => a.date.localeCompare(b.date));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<HolidayDate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Group by month
  const byMonth: Record<number, HolidayDate[]> = {};
  for (const h of entries) {
    const month = Number(h.date.split("-")[1]);
    if (!byMonth[month]) byMonth[month] = [];
    byMonth[month].push(h);
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteHolidayDate(deleteId);
    toast.success("Holiday removed");
    setDeleteId(null);
    refresh();
  }

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarOff className="w-4 h-4 text-destructive" />
              <CardTitle className="font-display text-base">{calendarName}</CardTitle>
              <Badge variant="secondary" className="text-xs">{entries.length} holidays</Badge>
            </div>
            <Button
              size="sm"
              onClick={() => { setEditEntry(null); setDialogOpen(true); }}
            >
              <Plus className="w-4 h-4 mr-1" /> Add Holiday
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {entries.length === 0 ? (
            <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground/60">
              <CalendarOff className="w-5 h-5" />
              <span className="text-sm">No holidays defined</span>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(byMonth).map(([monthNum, monthEntries]) => (
                <div key={monthNum}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {MONTH_NAMES[Number(monthNum) - 1]}
                  </p>
                  <div className="space-y-1.5">
                    {monthEntries.map((h) => {
                      const dow = getDayOfWeek(h.date);
                      return (
                        <div
                          key={h.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-100 group"
                        >
                          {/* Date badge */}
                          <div className="w-12 text-center shrink-0">
                            <p className="text-lg font-bold text-red-600 leading-none">
                              {h.date.split("-")[2]}
                            </p>
                            <p className="text-xs text-red-400">{dow.slice(0, 3)}</p>
                          </div>

                          {/* Name */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground">{h.name}</p>
                            <p className="text-xs text-muted-foreground">{formatDateDisplay(h.date)}</p>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setEditEntry(h);
                                setDialogOpen(true);
                              }}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteId(h.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit dialog */}
      <HolidayDialog
        open={dialogOpen}
        mode={editEntry ? "edit" : "add"}
        calendarId={calendarId}
        calendarName={calendarName}
        initialValues={editEntry ? { date: editEntry.date, name: editEntry.name } : EMPTY_HOLIDAY_FORM}
        entryId={editEntry?.id}
        onClose={() => { setDialogOpen(false); setEditEntry(null); }}
        onSaved={refresh}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Holiday?</AlertDialogTitle>
            <AlertDialogDescription>
              Removing this holiday will make the date bookable again for all providers
              who use this calendar. This cannot be undone.
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

export default function AdminHolidays() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
            <CalendarOff className="w-6 h-6 text-destructive" />
            Holiday Calendar Editor
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage clinic-wide holiday dates. Holidays block all providers who share the calendar.
          </p>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-100 text-blue-800 text-sm">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Hover over any entry to reveal <strong>edit</strong> and <strong>delete</strong> controls.
            All providers assigned to a calendar are blocked on its holiday dates.
          </span>
        </div>

        {/* One section per calendar */}
        <div className="space-y-6">
          {HOLIDAY_CALENDARS.map((cal) => (
            <HolidayCalendarSection
              key={cal.id}
              calendarId={cal.id}
              calendarName={cal.name}
            />
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
