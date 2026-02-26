import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ChevronLeft, ChevronRight, XCircle } from "lucide-react";
import { toast } from "sonner";

function getWeekDates(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return Array.from({ length: 7 }, (_, i) => { const dd = new Date(d); dd.setDate(d.getDate() + i); return dd; });
}

function toISO(d: Date) { return d.toISOString().slice(0, 10); }

export default function AdminScheduleGrid() {
  const utils = trpc.useUtils();
  const { data: providers = [] } = trpc.providers.list.useQuery();
  const { data: assignments = [] } = trpc.providerAssignments.listAll.useQuery();
  const { data: slots = [] } = trpc.shiftPlanSlots.list.useQuery({});
  const { data: templates = [] } = trpc.shiftTemplates.list.useQuery();
  const { data: occurrences = [] } = trpc.shiftOccurrences.listAll.useQuery();
  const { data: holidays = [] } = trpc.holidayDates.list.useQuery({});
  const { data: ptoEntries = [] } = trpc.ptoEntries.list.useQuery({});

  const upsertOcc = trpc.shiftOccurrences.upsert.useMutation({ onSuccess: () => { utils.shiftOccurrences.listAll.invalidate(); toast.success("Occurrence updated"); setCancelTarget(null); } });

  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterProvider, setFilterProvider] = useState("all");
  const [cancelTarget, setCancelTarget] = useState<{assignmentId: string; date: string} | null>(null);

  const weekDates = getWeekDates(currentDate);
  const prevWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); };
  const nextWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); };

  const holidaySet = new Set(holidays.map(h => h.date));

  const generatedOccs = useMemo(() => {
    const result: Array<{ assignmentId: string; providerId: string; date: string; templateId: string; status: string }> = [];
    for (const date of weekDates) {
      const dateStr = toISO(date);
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      for (const assignment of assignments) {
        if (assignment.effectiveDate > dateStr) continue;
        if (assignment.endDate && assignment.endDate < dateStr) continue;
        const slot = slots.find(s => s.id === assignment.shiftPlanSlotId);
        if (!slot) continue;
        const tmpl = templates.find(t => t.id === slot.templateId);
        if (!tmpl) continue;
        const days: string[] = JSON.parse(tmpl.weekDays || "[]");
        if (!days.includes(dayName)) continue;
        const occ = occurrences.find(o => o.assignmentId === assignment.id && o.date === dateStr);
        const status = occ?.status ?? "scheduled";
        result.push({ assignmentId: assignment.id, providerId: assignment.providerId, date: dateStr, templateId: tmpl.id, status });
      }
    }
    return result;
  }, [weekDates, assignments, slots, templates, occurrences]);

  const filteredProviders = filterProvider === "all" ? providers : providers.filter(p => p.id === filterProvider);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div><h1 className="font-display text-2xl font-semibold">Schedule Grid</h1><p className="text-muted-foreground text-sm mt-1">Weekly view of generated shift occurrences</p></div>
          <div className="flex gap-3 items-center flex-wrap">
            <Select value={filterProvider} onValueChange={setFilterProvider}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All providers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All providers</SelectItem>
                {providers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={prevWeek}><ChevronLeft className="w-4 h-4" /></Button>
              <span className="text-sm font-medium tabular-nums">
                {weekDates[0].toLocaleDateString("en-US", { month:"short", day:"numeric" })} – {weekDates[6].toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}
              </span>
              <Button variant="outline" size="sm" onClick={nextWeek}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
        <Card className="shadow-sm overflow-x-auto">
          <CardContent className="p-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground w-36">Provider</th>
                  {weekDates.map(d => {
                    const iso = toISO(d);
                    const isHoliday = holidaySet.has(iso);
                    const isToday = iso === toISO(new Date());
                    return (
                      <th key={iso} className={`text-center py-3 px-2 font-semibold min-w-[100px] ${isToday ? "bg-primary/5" : ""}`}>
                        <div className={isHoliday ? "text-destructive" : "text-muted-foreground"}>{d.toLocaleDateString("en-US", { weekday:"short" })}</div>
                        <div className={`text-sm font-bold ${isToday ? "text-primary" : "text-foreground"} ${isHoliday ? "text-destructive" : ""}`}>{d.getDate()}</div>
                        {isHoliday && <div className="text-destructive text-xs">Holiday</div>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredProviders.map((prov, pi) => (
                  <tr key={prov.id} className={pi % 2 === 0 ? "bg-secondary/20" : ""}>
                    <td className="py-3 px-4 font-medium text-sm">{prov.name}<div className="text-xs text-muted-foreground font-normal">{prov.role}</div></td>
                    {weekDates.map(d => {
                      const iso = toISO(d);
                      const isHoliday = holidaySet.has(iso);
                      const dayOccs = generatedOccs.filter(o => o.providerId === prov.id && o.date === iso);
                      const hasPto = ptoEntries.some(e => e.calendarId === prov.ptoCalendarId && e.startDate <= iso && e.endDate >= iso);
                      return (
                        <td key={iso} className={`py-2 px-2 text-center align-top ${isHoliday ? "bg-red-50" : ""}`}>
                          {isHoliday && <Badge variant="destructive" className="text-xs">Holiday</Badge>}
                          {hasPto && !isHoliday && <Badge className="text-xs bg-amber-100 text-amber-800 border-amber-200">PTO</Badge>}
                          {!isHoliday && !hasPto && dayOccs.map(occ => {
                            const tmpl = templates.find(t => t.id === occ.templateId);
                            const isCancelled = occ.status === "cancelled";
                            return (
                              <div key={occ.assignmentId} className={`mb-1 p-1 rounded text-xs ${isCancelled ? "opacity-40 line-through" : "bg-sky-100"}`}>
                                <div className="font-medium">{tmpl?.name ?? "Shift"}</div>
                                <div className="text-muted-foreground">{tmpl?.startTime}</div>
                                {!isCancelled && (
                                  <button className="text-destructive hover:underline text-xs mt-0.5 flex items-center gap-0.5 mx-auto" onClick={() => setCancelTarget({ assignmentId: occ.assignmentId, date: iso })}>
                                    <XCircle className="w-3 h-3" /> Cancel
                                  </button>
                                )}
                              </div>
                            );
                          })}
                          {!isHoliday && !hasPto && dayOccs.length === 0 && <span className="text-muted-foreground/40">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {filteredProviders.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">No providers found.</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Cancel shift occurrence?</AlertDialogTitle><AlertDialogDescription>This will mark the shift as cancelled for {cancelTarget?.date}.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => { if (cancelTarget) upsertOcc.mutate({ assignmentId: cancelTarget.assignmentId, date: cancelTarget.date, status: "cancelled" }); }}>Cancel Shift</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
