import { useState, useMemo, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ChevronLeft, ChevronRight, XCircle, RefreshCw, GripVertical } from "lucide-react";
import { toast } from "sonner";

function getWeekDates(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(d);
    dd.setDate(d.getDate() + i);
    return dd;
  });
}

function toISO(d: Date) { return d.toISOString().slice(0, 10); }

type OccItem = {
  assignmentId: string;
  providerId: string;
  date: string;
  templateId: string;
  status: string;
  occurrenceId?: string;
  substituteProviderId?: string | null;
};

export default function AdminScheduleGrid() {
  const utils = trpc.useUtils();
  const { data: providers = [] } = trpc.providers.list.useQuery();
  const { data: assignments = [] } = trpc.providerAssignments.listAll.useQuery();
  const { data: slots = [] } = trpc.shiftPlanSlots.list.useQuery({});
  const { data: templates = [] } = trpc.shiftTemplates.list.useQuery();
  const { data: occurrences = [] } = trpc.shiftOccurrences.listAll.useQuery();
  const { data: holidays = [] } = trpc.holidayDates.list.useQuery({});
  const { data: ptoEntries = [] } = trpc.ptoEntries.list.useQuery({});

  const upsertOcc = trpc.shiftOccurrences.upsert.useMutation({
    onSuccess: () => {
      utils.shiftOccurrences.listAll.invalidate();
      toast.success("Schedule updated");
    },
  });

  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterProvider, setFilterProvider] = useState("all");
  const [cancelTarget, setCancelTarget] = useState<OccItem | null>(null);
  const [swapDialog, setSwapDialog] = useState<{ occ: OccItem; targetProviderId: string; targetDate: string } | null>(null);

  const dragItem = useRef<OccItem | null>(null);
  const [dragOver, setDragOver] = useState<{ providerId: string; date: string } | null>(null);

  const weekDates = getWeekDates(currentDate);
  const prevWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); };
  const nextWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); };

  const holidaySet = new Set(holidays.map((h) => h.date));

  const generatedOccs = useMemo((): OccItem[] => {
    const result: OccItem[] = [];
    for (const date of weekDates) {
      const dateStr = toISO(date);
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      for (const assignment of assignments) {
        if (assignment.effectiveDate > dateStr) continue;
        if (assignment.endDate && assignment.endDate < dateStr) continue;
        const slot = slots.find((s) => s.id === assignment.shiftPlanSlotId);
        if (!slot) continue;
        const tmpl = templates.find((t) => t.id === slot.templateId);
        if (!tmpl) continue;
        const days = (tmpl.weekDays ?? "").split(",").filter(Boolean);
        if (!days.includes(dayName)) continue;
        const occ = occurrences.find((o) => o.assignmentId === assignment.id && o.date === dateStr);
        result.push({
          assignmentId: assignment.id,
          providerId: assignment.providerId,
          date: dateStr,
          templateId: tmpl.id,
          status: occ?.status ?? "scheduled",
          occurrenceId: occ?.id,
          substituteProviderId: occ?.substituteProviderId ?? null,
        });
      }
    }
    return result;
  }, [weekDates, assignments, slots, templates, occurrences]);

  const filteredProviders = filterProvider === "all" ? providers : providers.filter((p) => p.id === filterProvider);

  function handleDragStart(occ: OccItem) {
    dragItem.current = occ;
  }

  function handleDrop(targetProviderId: string, targetDate: string) {
    const occ = dragItem.current;
    setDragOver(null);
    dragItem.current = null;
    if (!occ) return;
    if (occ.providerId === targetProviderId && occ.date === targetDate) return;
    if (holidaySet.has(targetDate)) { toast.error("Cannot move shift to a holiday"); return; }
    const conflict = generatedOccs.find(
      (o) => o.providerId === targetProviderId && o.date === targetDate && o.status !== "cancelled"
    );
    if (conflict && targetProviderId !== occ.providerId) {
      toast.error("Target provider already has a shift that day");
      return;
    }
    if (targetProviderId !== occ.providerId) {
      setSwapDialog({ occ, targetProviderId, targetDate });
    } else {
      upsertOcc.mutate({
        id: occ.occurrenceId,
        assignmentId: occ.assignmentId,
        date: targetDate,
        status: "scheduled",
        substituteProviderId: null,
      });
    }
  }

  function confirmSwap() {
    if (!swapDialog) return;
    const { occ, targetProviderId, targetDate } = swapDialog;
    upsertOcc.mutate({
      id: occ.occurrenceId,
      assignmentId: occ.assignmentId,
      date: occ.date,
      status: "cancelled",
      substituteProviderId: null,
      note: `Reassigned to ${providers.find((p) => p.id === targetProviderId)?.name ?? targetProviderId} on ${targetDate}`,
    });
    const targetAssignment = assignments.find(
      (a) => a.providerId === targetProviderId &&
        slots.find((s) => s.id === a.shiftPlanSlotId)?.templateId === occ.templateId
    );
    if (targetAssignment) {
      upsertOcc.mutate({
        assignmentId: targetAssignment.id,
        date: targetDate,
        status: "swapped",
        substituteProviderId: occ.providerId,
      });
    } else {
      upsertOcc.mutate({
        assignmentId: occ.assignmentId,
        date: targetDate,
        status: "swapped",
        substituteProviderId: targetProviderId,
      });
    }
    toast.success("Shift reassigned");
    setSwapDialog(null);
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold">Schedule Grid</h1>
            <p className="text-muted-foreground text-sm mt-1">Drag shifts to move or reassign them</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={filterProvider} onValueChange={setFilterProvider}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All providers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All providers</SelectItem>
                {providers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-0 border border-border rounded-lg overflow-hidden">
              <Button variant="ghost" size="sm" className="rounded-none border-r border-border" onClick={prevWeek}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 text-sm font-medium whitespace-nowrap">
                {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                {" – "}
                {weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <Button variant="ghost" size="sm" className="rounded-none border-l border-border" onClick={nextWeek}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <GripVertical className="w-3 h-3" /> Drag to move within same row or reassign to another provider
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-sky-100 border border-sky-200 inline-block" /> Scheduled
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-200 inline-block" /> Swapped
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-50 border border-red-200 inline-block" /> Holiday / Cancelled
          </span>
        </div>

        {/* Grid */}
        <Card className="shadow-sm overflow-x-auto">
          <CardContent className="p-0">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground w-40 border-r border-border/50">
                    Provider
                  </th>
                  {weekDates.map((d) => {
                    const iso = toISO(d);
                    const isHoliday = holidaySet.has(iso);
                    const isToday = iso === toISO(new Date());
                    return (
                      <th key={iso} className={`text-center py-3 px-2 font-semibold min-w-[110px] border-r border-border/50 last:border-r-0 ${isToday ? "bg-primary/5" : ""}`}>
                        <div className={`text-xs ${isHoliday ? "text-destructive" : "text-muted-foreground"}`}>
                          {d.toLocaleDateString("en-US", { weekday: "short" })}
                        </div>
                        <div className={`text-sm font-bold mt-0.5 ${isToday ? "text-primary" : isHoliday ? "text-destructive" : "text-foreground"}`}>
                          {d.getDate()}
                        </div>
                        {isHoliday && <div className="text-destructive text-xs font-normal">Holiday</div>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredProviders.map((prov, pi) => (
                  <tr key={prov.id} className={`border-b border-border/30 ${pi % 2 === 0 ? "bg-secondary/10" : ""}`}>
                    <td className="py-3 px-4 border-r border-border/50 align-top">
                      <div className="font-medium text-sm text-foreground">{prov.name}</div>
                      <div className="text-xs text-muted-foreground">{prov.role}</div>
                    </td>
                    {weekDates.map((d) => {
                      const iso = toISO(d);
                      const isHoliday = holidaySet.has(iso);
                      const hasPto = ptoEntries.some(
                        (e) => e.calendarId === prov.ptoCalendarId && e.startDate <= iso && e.endDate >= iso
                      );
                      const dayOccs = generatedOccs.filter((o) => o.providerId === prov.id && o.date === iso);
                      const isDragTarget = dragOver?.providerId === prov.id && dragOver?.date === iso;

                      return (
                        <td
                          key={iso}
                          className={`py-2 px-1.5 align-top border-r border-border/30 last:border-r-0 transition-colors ${isHoliday ? "bg-red-50/60" : ""} ${isDragTarget && !isHoliday ? "bg-primary/10 ring-2 ring-inset ring-primary/30" : ""}`}
                          onDragOver={(e) => { e.preventDefault(); if (!isHoliday) setDragOver({ providerId: prov.id, date: iso }); }}
                          onDragLeave={() => setDragOver(null)}
                          onDrop={() => handleDrop(prov.id, iso)}
                        >
                          {isHoliday && (
                            <div className="flex justify-center">
                              <Badge variant="destructive" className="text-xs px-1.5 py-0">Holiday</Badge>
                            </div>
                          )}
                          {hasPto && !isHoliday && (
                            <div className="flex justify-center">
                              <Badge className="text-xs px-1.5 py-0 bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">PTO</Badge>
                            </div>
                          )}
                          {!isHoliday && !hasPto && dayOccs.map((occ) => {
                            const tmpl = templates.find((t) => t.id === occ.templateId);
                            const isCancelled = occ.status === "cancelled";
                            const isSwapped = occ.status === "swapped";
                            const subProv = isSwapped && occ.substituteProviderId
                              ? providers.find((p) => p.id === occ.substituteProviderId)
                              : null;
                            return (
                              <div
                                key={occ.assignmentId}
                                draggable={!isCancelled}
                                onDragStart={() => handleDragStart(occ)}
                                className={`mb-1 p-1.5 rounded-lg text-xs border cursor-grab active:cursor-grabbing select-none transition-all ${isCancelled ? "opacity-30 line-through bg-muted border-border" : isSwapped ? "bg-amber-50 border-amber-200 hover:shadow-sm" : "bg-sky-50 border-sky-200 hover:shadow-sm"}`}
                              >
                                <div className="flex items-center gap-1 mb-0.5">
                                  <GripVertical className="w-2.5 h-2.5 text-muted-foreground/50 shrink-0" />
                                  <span className="font-medium text-foreground truncate">{tmpl?.name ?? "Shift"}</span>
                                </div>
                                <div className="text-muted-foreground pl-3.5">{tmpl?.startTime}–{tmpl?.endTime}</div>
                                {subProv && (
                                  <div className="text-amber-700 pl-3.5 flex items-center gap-0.5 mt-0.5">
                                    <RefreshCw className="w-2.5 h-2.5" /> {subProv.name}
                                  </div>
                                )}
                                {!isCancelled && (
                                  <button
                                    className="text-destructive hover:underline text-xs mt-1 pl-3.5 flex items-center gap-0.5"
                                    onClick={() => setCancelTarget(occ)}
                                  >
                                    <XCircle className="w-2.5 h-2.5" /> Cancel
                                  </button>
                                )}
                              </div>
                            );
                          })}
                          {!isHoliday && !hasPto && dayOccs.length === 0 && (
                            <div className="flex items-center justify-center h-8 text-muted-foreground/30 text-base">—</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {filteredProviders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">No providers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Cancel confirm */}
      <AlertDialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel shift occurrence?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the shift on {cancelTarget?.date} as cancelled. It will remain visible with a strikethrough.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => {
                if (cancelTarget) {
                  upsertOcc.mutate({
                    id: cancelTarget.occurrenceId,
                    assignmentId: cancelTarget.assignmentId,
                    date: cancelTarget.date,
                    status: "cancelled",
                    substituteProviderId: null,
                  });
                  setCancelTarget(null);
                }
              }}
            >
              Cancel Shift
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Swap / reassign confirm */}
      <Dialog open={!!swapDialog} onOpenChange={() => setSwapDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Reassign Shift</DialogTitle>
          </DialogHeader>
          {swapDialog && (
            <div className="py-2 space-y-3 text-sm">
              <p>You are reassigning this shift:</p>
              <div className="rounded-xl bg-muted p-3 text-xs space-y-1">
                <p>
                  <span className="font-medium">From: </span>
                  {providers.find((p) => p.id === swapDialog.occ.providerId)?.name} on {swapDialog.occ.date}
                </p>
                <p>
                  <span className="font-medium">To: </span>
                  {providers.find((p) => p.id === swapDialog.targetProviderId)?.name} on {swapDialog.targetDate}
                </p>
                <p>
                  <span className="font-medium">Shift: </span>
                  {templates.find((t) => t.id === swapDialog.occ.templateId)?.name}
                </p>
              </div>
              <p className="text-muted-foreground text-xs">
                The original occurrence will be cancelled and a new swapped occurrence will be created for the target provider.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSwapDialog(null)}>Cancel</Button>
            <Button onClick={confirmSwap} disabled={upsertOcc.isPending}>
              {upsertOcc.isPending ? "Saving..." : "Confirm Reassignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
