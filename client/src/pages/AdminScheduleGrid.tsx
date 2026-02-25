/**
 * BrightSmiles – Admin Schedule Grid
 * Design: Warm Professional
 *
 * Visual calendar grid showing generated shift occurrences.
 * Rows = providers, Columns = days of the selected week/month.
 * Admins can cancel or swap individual occurrences.
 *
 * Occurrence generation logic:
 *  1. For each ProviderAssignment that is active on a given date:
 *     a. Find the ShiftPlanSlot → ShiftTemplate
 *     b. Determine which cycle index applies to the date (based on plan effectiveDate + shiftCycle)
 *     c. If the template's weekDays includes the date's day-of-week → generate an occurrence
 *  2. Apply any stored ShiftOccurrence overrides (cancelled / swapped)
 */

import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/Layout";
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
  PROVIDERS,
  SHIFT_PLANS,
  SHIFT_PLAN_SLOTS,
  PROVIDER_ASSIGNMENTS,
  SHIFT_OCCURRENCES,
  type ShiftOccurrence,
  type ProviderAssignment,
  addShiftOccurrence,
  updateShiftOccurrence,
  getShiftTemplate,
  getLocation,
} from "@/lib/data";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  X,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Date helpers ─────────────────────────────────────────────────────────────

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DOW_SHORT  = ["Su",  "Mo",  "Tu",  "We",  "Th",  "Fr",  "Sa"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function startOfWeek(d: Date): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay()); // Sunday
  return r;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function getDaysInRange(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  let cur = new Date(start);
  while (cur <= end) {
    days.push(new Date(cur));
    cur = addDays(cur, 1);
  }
  return days;
}

// ─── Occurrence generation ────────────────────────────────────────────────────

interface GeneratedOccurrence {
  date: string;
  providerId: string;
  assignmentId: string;
  slotId: string;
  templateId: string;
  templateName: string;
  templateColor: string;
  startTime: string;
  duration: string;
  locationName: string;
  override: ShiftOccurrence | null;
}

function getCycleIndexForDate(planId: string, date: string): number {
  const plan = SHIFT_PLANS.find((p) => p.id === planId);
  if (!plan) return 1;
  const effectiveDate = new Date(plan.effectiveDate.slice(0, 10));
  const targetDate = new Date(date);
  const diffDays = Math.floor((targetDate.getTime() - effectiveDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return -1; // before plan starts
  const cycleUnit = plan.shiftCycleUnit;
  const cycleLengthDays = cycleUnit === "Week(s)" ? plan.shiftCycle * 7 : plan.shiftCycle * 30;
  const posInCycle = diffDays % cycleLengthDays;
  const weekLengthDays = cycleUnit === "Week(s)" ? 7 : 30;
  return Math.floor(posInCycle / weekLengthDays) + 1;
}

function generateOccurrences(dates: string[]): GeneratedOccurrence[] {
  const results: GeneratedOccurrence[] = [];

  for (const dateStr of dates) {
    const dow = DOW_LABELS[new Date(dateStr + "T12:00:00").getDay()].slice(0, 3) as any;

    for (const assignment of PROVIDER_ASSIGNMENTS) {
      // Check date range
      if (dateStr < assignment.effectiveDate) continue;
      if (assignment.endDate && dateStr > assignment.endDate) continue;

      const slot = SHIFT_PLAN_SLOTS.find((s) => s.id === assignment.shiftPlanSlotId);
      if (!slot) continue;

      const cycleIndex = getCycleIndexForDate(slot.shiftPlanId, dateStr);
      if (cycleIndex !== slot.cycleIndex) continue;

      const template = getShiftTemplate(slot.templateId);
      if (!template) continue;

      // Check day of week
      if (!template.weekDays.includes(dow)) continue;

      const loc = getLocation(template.locationId);
      const override = SHIFT_OCCURRENCES.find(
        (o) => o.assignmentId === assignment.id && o.date === dateStr
      ) ?? null;

      results.push({
        date: dateStr,
        providerId: assignment.providerId,
        assignmentId: assignment.id,
        slotId: slot.id,
        templateId: template.id,
        templateName: template.name,
        templateColor: template.color,
        startTime: template.startTime,
        duration: template.duration,
        locationName: loc?.name?.replace(" Clinic", "") ?? "—",
        override,
      });
    }
  }

  return results;
}

function parseDuration(iso: string): string {
  const m = iso.match(/PT(\d+)H/);
  return m ? `${m[1]}h` : iso;
}

// ─── Occurrence Cell ──────────────────────────────────────────────────────────

interface OccurrenceCellProps {
  occ: GeneratedOccurrence;
  onCancel: () => void;
  onSwap: () => void;
  onRestore: () => void;
}

function OccurrenceCell({ occ, onCancel, onSwap, onRestore }: OccurrenceCellProps) {
  const status = occ.override?.status ?? "scheduled";

  if (status === "cancelled") {
    return (
      <div className="group relative rounded border border-dashed border-red-200 bg-red-50 p-1.5 text-xs">
        <p className="text-red-400 line-through text-center leading-tight">{occ.templateName}</p>
        <button
          onClick={onRestore}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-white/80 rounded text-xs text-primary font-medium transition-opacity"
        >
          Restore
        </button>
      </div>
    );
  }

  const substituteId = occ.override?.substituteProviderId;
  const substitute = substituteId ? PROVIDERS.find((p) => p.id === substituteId) : null;

  return (
    <div className={cn(
      "group relative rounded overflow-hidden text-white text-xs shadow-sm",
      occ.templateColor
    )}>
      <div className="p-1.5 leading-tight">
        <p className="font-semibold truncate">{occ.templateName.replace(" – ", " ")}</p>
        <p className="opacity-80">{occ.startTime} · {parseDuration(occ.duration)}</p>
        <p className="opacity-70 truncate">{occ.locationName}</p>
        {substitute && (
          <p className="opacity-90 font-medium truncate">↔ {substitute.name.split(" ")[1]}</p>
        )}
      </div>
      {/* Hover actions */}
      <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity rounded">
        <button
          onClick={onSwap}
          title="Swap provider"
          className="p-1 rounded bg-white/20 hover:bg-white/40 transition-colors"
        >
          <RefreshCw className="w-3 h-3 text-white" />
        </button>
        <button
          onClick={onCancel}
          title="Cancel shift"
          className="p-1 rounded bg-white/20 hover:bg-red-500/80 transition-colors"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      </div>
    </div>
  );
}

// ─── Swap Dialog ──────────────────────────────────────────────────────────────

interface SwapDialogProps {
  open: boolean;
  occ: GeneratedOccurrence | null;
  onClose: () => void;
  onSaved: () => void;
}

function SwapDialog({ open, occ, onClose, onSaved }: SwapDialogProps) {
  const [substituteId, setSubstituteId] = useState("");
  const [note, setNote] = useState("");

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) { setSubstituteId(""); setNote(""); }
    else onClose();
  }

  function handleSave() {
    if (!occ || !substituteId) return;
    const existing = occ.override;
    if (existing) {
      updateShiftOccurrence(existing.id, {
        status: "swapped",
        substituteProviderId: substituteId,
        note,
      });
    } else {
      addShiftOccurrence({
        assignmentId: occ.assignmentId,
        date: occ.date,
        status: "swapped",
        substituteProviderId: substituteId,
        note,
      });
    }
    toast.success("Shift swapped");
    onSaved();
    onClose();
  }

  const otherProviders = PROVIDERS.filter((p) => p.id !== occ?.providerId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Swap Provider</DialogTitle>
          <DialogDescription>
            {occ ? `${occ.templateName} on ${occ.date}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Substitute Provider</label>
            <Select value={substituteId} onValueChange={setSubstituteId}>
              <SelectTrigger>
                <SelectValue placeholder="Select substitute…" />
              </SelectTrigger>
              <SelectContent>
                {otherProviders.map((p) => (
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
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Note (optional)</label>
            <input
              className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Reason for swap…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!substituteId}>Confirm Swap</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ViewMode = "week" | "month";

export default function AdminScheduleGrid() {
  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate((n) => n + 1);

  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [swapOcc, setSwapOcc] = useState<GeneratedOccurrence | null>(null);

  // Compute date range
  const { rangeStart, rangeEnd, label } = useMemo(() => {
    if (viewMode === "week") {
      const s = startOfWeek(anchor);
      const e = addDays(s, 6);
      return {
        rangeStart: s,
        rangeEnd: e,
        label: `${MONTH_NAMES[s.getMonth()].slice(0,3)} ${s.getDate()} – ${MONTH_NAMES[e.getMonth()].slice(0,3)} ${e.getDate()}, ${e.getFullYear()}`,
      };
    } else {
      const s = startOfMonth(anchor);
      const e = endOfMonth(anchor);
      return {
        rangeStart: s,
        rangeEnd: e,
        label: `${MONTH_NAMES[anchor.getMonth()]} ${anchor.getFullYear()}`,
      };
    }
  }, [viewMode, anchor]);

  const days = useMemo(() => getDaysInRange(rangeStart, rangeEnd), [rangeStart, rangeEnd]);
  const dateStrings = useMemo(() => days.map(toYMD), [days]);

  const occurrences = useMemo(() => generateOccurrences(dateStrings), [dateStrings, forceUpdate]);

  function navigate(dir: -1 | 1) {
    setAnchor((a) => {
      const d = new Date(a);
      if (viewMode === "week") d.setDate(d.getDate() + dir * 7);
      else d.setMonth(d.getMonth() + dir);
      return d;
    });
  }

  function goToday() { setAnchor(new Date()); }

  function handleCancel(occ: GeneratedOccurrence) {
    const existing = occ.override;
    if (existing) {
      updateShiftOccurrence(existing.id, { status: "cancelled" });
    } else {
      addShiftOccurrence({
        assignmentId: occ.assignmentId,
        date: occ.date,
        status: "cancelled",
        substituteProviderId: null,
        note: "",
      });
    }
    toast.success("Shift cancelled");
    refresh();
  }

  function handleRestore(occ: GeneratedOccurrence) {
    if (occ.override) {
      updateShiftOccurrence(occ.override.id, { status: "scheduled", substituteProviderId: null, note: "" });
      toast.success("Shift restored");
      refresh();
    }
  }

  const today = toYMD(new Date());

  // For month view, only show working days (Mon–Sat) to keep grid manageable
  const displayDays = viewMode === "month"
    ? days.filter((d) => d.getDay() !== 0) // exclude Sunday
    : days;

  return (
    <AdminLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-primary" />
              Schedule Grid
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Generated shift occurrences. Hover a shift to cancel or swap the provider.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              {(["week", "month"] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                    viewMode === v ? "bg-primary text-white" : "hover:bg-secondary"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
            <Button variant="outline" size="icon" onClick={() => navigate(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Period label */}
        <p className="font-display font-semibold text-lg">{label}</p>

        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {Array.from(new Set(occurrences.map((o) => o.templateId))).map((tid) => {
            const occ = occurrences.find((o) => o.templateId === tid)!;
            return (
              <div key={tid} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn("w-3 h-3 rounded-sm", occ.templateColor)} />
                {occ.templateName}
              </div>
            );
          })}
        </div>

        {/* Grid */}
        <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
          <table className="w-full border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-secondary/50">
                {/* Provider column */}
                <th className="text-left text-xs font-semibold text-muted-foreground px-3 py-2 w-32 border-b border-border sticky left-0 bg-secondary/50 z-10">
                  Provider
                </th>
                {displayDays.map((d) => {
                  const ymd = toYMD(d);
                  const isToday = ymd === today;
                  return (
                    <th
                      key={ymd}
                      className={cn(
                        "text-center text-xs font-semibold px-1 py-2 border-b border-border min-w-[90px]",
                        isToday ? "bg-primary/10 text-primary" : "text-muted-foreground"
                      )}
                    >
                      <div>{DOW_SHORT[d.getDay()]}</div>
                      <div className={cn(
                        "text-base font-bold",
                        isToday ? "text-primary" : "text-foreground"
                      )}>
                        {d.getDate()}
                      </div>
                      {viewMode === "month" && (
                        <div className="text-xs opacity-60">{MONTH_NAMES[d.getMonth()].slice(0,3)}</div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {PROVIDERS.map((provider, pi) => {
                const provOccs = occurrences.filter((o) => o.providerId === provider.id);
                return (
                  <tr
                    key={provider.id}
                    className={cn(
                      "border-b border-border last:border-0",
                      pi % 2 === 0 ? "bg-white" : "bg-secondary/20"
                    )}
                  >
                    {/* Provider cell */}
                    <td className={cn(
                      "px-3 py-2 sticky left-0 z-10 border-r border-border",
                      pi % 2 === 0 ? "bg-white" : "bg-secondary/20"
                    )}>
                      <div className="flex items-center gap-2">
                        <img
                          src={provider.photoUrl}
                          alt={provider.name}
                          className="w-7 h-7 rounded-full object-cover object-top shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{provider.name.split(" ")[1]}</p>
                          <p className="text-xs text-muted-foreground truncate">{provider.role.slice(0,3)}</p>
                        </div>
                      </div>
                    </td>

                    {/* Day cells */}
                    {displayDays.map((d) => {
                      const ymd = toYMD(d);
                      const dayOccs = provOccs.filter((o) => o.date === ymd);
                      const isToday = ymd === today;
                      return (
                        <td
                          key={ymd}
                          className={cn(
                            "px-1 py-1.5 align-top border-r border-border/50 last:border-0",
                            isToday && "bg-primary/5"
                          )}
                        >
                          <div className="space-y-1">
                            {dayOccs.map((occ, i) => (
                              <OccurrenceCell
                                key={`${occ.assignmentId}-${i}`}
                                occ={occ}
                                onCancel={() => { handleCancel(occ); }}
                                onSwap={() => setSwapOcc(occ)}
                                onRestore={() => handleRestore(occ)}
                              />
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {occurrences.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/60">
            <CalendarDays className="w-10 h-10 mb-3" />
            <p className="font-medium">No shifts generated for this period</p>
            <p className="text-sm mt-1">Check that providers have active assignments and plans have slots.</p>
          </div>
        )}
      </div>

      {/* Swap dialog */}
      <SwapDialog
        open={!!swapOcc}
        occ={swapOcc}
        onClose={() => setSwapOcc(null)}
        onSaved={refresh}
      />
    </AdminLayout>
  );
}
