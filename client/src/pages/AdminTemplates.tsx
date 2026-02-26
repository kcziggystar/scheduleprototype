import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Plus, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const COLORS = [
  { value: "bg-sky-500", label: "Sky Blue" },
  { value: "bg-indigo-500", label: "Indigo" },
  { value: "bg-emerald-500", label: "Emerald" },
  { value: "bg-amber-500", label: "Amber" },
  { value: "bg-rose-500", label: "Rose" },
  { value: "bg-violet-500", label: "Violet" },
];

type DaySegment = {
  day: string;
  seg1Start: string;
  seg1End: string;
  seg2Start: string;
  seg2End: string;
};

type TemplateForm = {
  id?: string;
  name: string;
  locationId: string;
  weekDays: string[];
  startTime: string;
  endTime: string;
  twoSegments: boolean;
  daySegments: DaySegment[];
  defaultRole: "Dentist" | "Hygienist";
  color: string;
};

function defaultDaySegments(days: string[], startTime: string, endTime: string): DaySegment[] {
  return days.map((day) => ({
    day,
    seg1Start: startTime,
    seg1End: "12:00",
    seg2Start: "13:00",
    seg2End: endTime,
  }));
}

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatRange(s: string, e: string) {
  return `${fmt12(s)} – ${fmt12(e)}`;
}

export default function AdminTemplates() {
  const utils = trpc.useUtils();
  const { data: templates = [], isLoading } = trpc.shiftTemplates.list.useQuery();
  const { data: locations = [] } = trpc.locations.list.useQuery();

  const upsert = trpc.shiftTemplates.upsert.useMutation({
    onSuccess: () => { utils.shiftTemplates.list.invalidate(); toast.success("Template saved"); setOpen(false); },
  });
  const del = trpc.shiftTemplates.delete.useMutation({
    onSuccess: () => { utils.shiftTemplates.list.invalidate(); toast.success("Template deleted"); setDeleteId(null); },
  });

  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateForm>({
    name: "", locationId: "", weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    startTime: "09:00", endTime: "17:00", twoSegments: false,
    daySegments: [], defaultRole: "Dentist", color: "bg-sky-500",
  });

  function openAdd() {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    setForm({
      id: undefined, name: "", locationId: locations[0]?.id ?? "",
      weekDays: days, startTime: "09:00", endTime: "17:00", twoSegments: false,
      daySegments: defaultDaySegments(days, "09:00", "17:00"),
      defaultRole: "Dentist", color: "bg-sky-500",
    });
    setOpen(true);
  }

  function openEdit(t: typeof templates[0]) {
    let parsed: DaySegment[] = [];
    if (t.segmentsJson) { try { parsed = JSON.parse(t.segmentsJson); } catch { /* ignore */ } }
    const days = t.weekDays.split(",").filter(Boolean);
    const twoSeg = parsed.length > 0;
    setForm({
      id: t.id, name: t.name, locationId: t.locationId,
      weekDays: days, startTime: t.startTime, endTime: t.endTime,
      twoSegments: twoSeg,
      daySegments: twoSeg ? parsed : defaultDaySegments(days, t.startTime, t.endTime),
      defaultRole: t.defaultRole as "Dentist" | "Hygienist",
      color: t.color,
    });
    setOpen(true);
  }

  function toggleDay(day: string) {
    setForm((f) => {
      const has = f.weekDays.includes(day);
      const newDays = has ? f.weekDays.filter((d) => d !== day) : [...f.weekDays, day];
      const ordered = DAYS.filter((d) => newDays.includes(d));
      const newSegs = ordered.map((d) => {
        const existing = f.daySegments.find((s) => s.day === d);
        return existing ?? { day: d, seg1Start: f.startTime, seg1End: "12:00", seg2Start: "13:00", seg2End: f.endTime };
      });
      return { ...f, weekDays: ordered, daySegments: newSegs };
    });
  }

  function updateDaySeg(day: string, field: keyof Omit<DaySegment, "day">, value: string) {
    setForm((f) => ({
      ...f,
      daySegments: f.daySegments.map((s) => s.day === day ? { ...s, [field]: value } : s),
    }));
  }

  function handleDefaultTimeChange(field: "startTime" | "endTime", value: string) {
    setForm((f) => {
      const newSegs = f.daySegments.map((s) => ({
        ...s,
        seg1Start: field === "startTime" ? value : s.seg1Start,
        seg2End: field === "endTime" ? value : s.seg2End,
      }));
      return { ...f, [field]: value, daySegments: newSegs };
    });
  }

  function handleSave() {
    const segmentsJson = form.twoSegments ? JSON.stringify(form.daySegments) : null;
    const [sh, sm] = form.startTime.split(":").map(Number);
    const [eh, em] = form.endTime.split(":").map(Number);
    const totalMins = (eh * 60 + em) - (sh * 60 + sm);
    upsert.mutate({
      id: form.id,
      name: form.name,
      locationId: form.locationId,
      weekDays: form.weekDays.join(","),
      startTime: form.startTime,
      endTime: form.endTime,
      duration: String(totalMins),
      segmentsJson,
      defaultRole: form.defaultRole,
      color: form.color,
    });
  }

  const isValid = form.name && form.locationId && form.weekDays.length > 0 && form.startTime && form.endTime;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold">Shift Templates</h1>
            <p className="text-muted-foreground text-sm mt-1">Define reusable shift shapes used in shift plans</p>
          </div>
          <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> New Template</Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : templates.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No templates yet</p>
            <p className="text-sm mt-1">Create your first shift template to get started.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((t) => {
              const loc = locations.find((l) => l.id === t.locationId);
              const days = t.weekDays.split(",").filter(Boolean);
              let segments: DaySegment[] = [];
              if (t.segmentsJson) { try { segments = JSON.parse(t.segmentsJson); } catch { /* ignore */ } }
              const hasTwoSeg = segments.length > 0;
              return (
                <Card key={t.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${t.color} shrink-0`} />
                        <h3 className="font-display font-semibold text-sm text-foreground">{t.name}</h3>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(t)}><Pencil className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => setDeleteId(t.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>{loc?.name ?? t.locationId}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 shrink-0" />
                        {hasTwoSeg ? <span>2 segments / day</span> : <span>{formatRange(t.startTime, t.endTime)}</span>}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {DAYS.map((d) => (
                          <span key={d}
                            className={`px-1.5 py-0.5 rounded text-xs font-medium ${days.includes(d) ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground/40"}`}>
                            {d}
                          </span>
                        ))}
                      </div>
                      {hasTwoSeg && (
                        <div className="mt-2 space-y-1 border-t pt-2">
                          {segments.slice(0, 3).map((s) => (
                            <div key={s.day} className="flex items-center justify-between">
                              <span className="font-medium text-foreground w-8">{s.day}</span>
                              <span>{formatRange(s.seg1Start, s.seg1End)}</span>
                              <span className="text-muted-foreground/50">·</span>
                              <span>{formatRange(s.seg2Start, s.seg2End)}</span>
                            </div>
                          ))}
                          {segments.length > 3 && <p className="text-muted-foreground/60">+{segments.length - 3} more…</p>}
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <Badge variant={t.defaultRole === "Dentist" ? "default" : "secondary"} className="text-xs">{t.defaultRole}</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add / Edit Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{form.id ? "Edit Template" : "New Shift Template"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-2">
              <div>
                <Label>Template Name *</Label>
                <Input className="mt-1" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Full Day – Downtown" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Location *</Label>
                  <Select value={form.locationId} onValueChange={(v) => setForm((f) => ({ ...f, locationId: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select location" /></SelectTrigger>
                    <SelectContent>{locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Default Role *</Label>
                  <Select value={form.defaultRole} onValueChange={(v) => setForm((f) => ({ ...f, defaultRole: v as "Dentist" | "Hygienist" }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dentist">Dentist</SelectItem>
                      <SelectItem value="Hygienist">Hygienist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Working Days *</Label>
                <div className="flex gap-2 mt-2">
                  {DAYS.map((d) => (
                    <button key={d} type="button" onClick={() => toggleDay(d)}
                      className={`w-10 h-10 rounded-lg text-xs font-semibold border-2 transition-all ${form.weekDays.includes(d) ? "border-primary bg-primary text-white" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Default Hours</Label>
                <div className="grid grid-cols-2 gap-4 mt-1">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Start Time</p>
                    <Input type="time" value={form.startTime} onChange={(e) => handleDefaultTimeChange("startTime", e.target.value)} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">End Time</p>
                    <Input type="time" value={form.endTime} onChange={(e) => handleDefaultTimeChange("endTime", e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border p-4">
                <div>
                  <p className="font-medium text-sm">Split day into 2 segments</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Allows a lunch break — configure different hours per day</p>
                </div>
                <Switch checked={form.twoSegments} onCheckedChange={(v) => {
                  setForm((f) => {
                    const segs = f.daySegments.length > 0 ? f.daySegments : defaultDaySegments(f.weekDays, f.startTime, f.endTime);
                    return { ...f, twoSegments: v, daySegments: segs };
                  });
                }} />
              </div>

              {form.twoSegments && form.weekDays.length > 0 && (
                <div className="space-y-3">
                  <Label>Per-Day Segments</Label>
                  <div className="rounded-xl border border-border overflow-hidden">
                    <div className="grid grid-cols-5 gap-0 bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground border-b">
                      <div>Day</div>
                      <div>Seg 1 Start</div>
                      <div>Seg 1 End</div>
                      <div>Seg 2 Start</div>
                      <div>Seg 2 End</div>
                    </div>
                    {form.weekDays.map((day) => {
                      const seg = form.daySegments.find((s) => s.day === day) ?? { day, seg1Start: form.startTime, seg1End: "12:00", seg2Start: "13:00", seg2End: form.endTime };
                      const dayIdx = DAYS.indexOf(day);
                      return (
                        <div key={day} className="grid grid-cols-5 gap-2 px-4 py-2 border-b last:border-0 items-center">
                          <div className="text-sm font-medium text-foreground">{DAY_FULL[dayIdx] ?? day}</div>
                          <div><Input type="time" className="h-8 text-xs" value={seg.seg1Start} onChange={(e) => updateDaySeg(day, "seg1Start", e.target.value)} /></div>
                          <div><Input type="time" className="h-8 text-xs" value={seg.seg1End} onChange={(e) => updateDaySeg(day, "seg1End", e.target.value)} /></div>
                          <div><Input type="time" className="h-8 text-xs" value={seg.seg2Start} onChange={(e) => updateDaySeg(day, "seg2Start", e.target.value)} /></div>
                          <div><Input type="time" className="h-8 text-xs" value={seg.seg2End} onChange={(e) => updateDaySeg(day, "seg2End", e.target.value)} /></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <Label>Colour</Label>
                <div className="flex gap-2 mt-2">
                  {COLORS.map((c) => (
                    <button key={c.value} type="button" onClick={() => setForm((f) => ({ ...f, color: c.value }))}
                      className={`w-8 h-8 rounded-full ${c.value} border-2 transition-all ${form.color === c.value ? "border-foreground scale-110" : "border-transparent"}`}
                      title={c.label} />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!isValid || upsert.isPending}>
                {upsert.isPending ? "Saving…" : "Save Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete template?</AlertDialogTitle>
              <AlertDialogDescription>Existing plan slots referencing this template will lose their link.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteId && del.mutate({ id: deleteId })}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
