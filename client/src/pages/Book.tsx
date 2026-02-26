/**
 * BrightSmiles – Patient Booking Flow
 * Design: Warm Professional – guided step wizard, sticky summary card
 *
 * Steps:
 *  1. Select appointment type
 *  2. Select provider (+ optional location filter)
 *  3. Pick a date (mini calendar with availability colours)
 *  4. Pick a time slot
 *  5. Patient details form
 *  6. Confirmation
 */

import { useState, useMemo } from "react";
import { TopNav } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { APPOINTMENT_TYPES } from "@/lib/data";
import { trpc } from "@/lib/trpc";
import {
  getAvailableSlots,
  getMonthAvailability,
  minutesToTime,
} from "@/lib/scheduler";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  CalendarCheck,
  Clock,
  MapPin,
  User,
  Stethoscope,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = [
  "Appointment Type",
  "Choose Provider",
  "Select Date",
  "Select Time",
  "Your Details",
  "Confirmed",
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.slice(0, -1).map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                i < current
                  ? "bg-primary text-white"
                  : i === current
                  ? "bg-primary text-white ring-4 ring-primary/20"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {i < current ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span
              className={cn(
                "text-xs mt-1 hidden sm:block",
                i === current ? "text-primary font-medium" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 2 && (
            <div
              className={cn(
                "h-0.5 w-8 sm:w-16 mx-1 transition-colors",
                i < current ? "bg-primary" : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_HEADERS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function MiniCalendar({
  year,
  month,
  availability,
  selected,
  onSelect,
  onNavigate,
}: {
  year: number;
  month: number;
  availability: Record<string, "available" | "holiday" | "pto" | "no-shift">;
  selected: string;
  onSelect: (date: string) => void;
  onNavigate: (year: number, month: number) => void;
}) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function prevMonth() {
    if (month === 1) onNavigate(year - 1, 12);
    else onNavigate(year, month - 1);
  }
  function nextMonth() {
    if (month === 12) onNavigate(year + 1, 1);
    else onNavigate(year, month + 1);
  }

  return (
    <div className="w-full max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1.5 rounded hover:bg-secondary transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-display font-semibold text-sm">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <button onClick={nextMonth} className="p-1.5 rounded hover:bg-secondary transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const status = availability[dateStr];
          const isSelected = dateStr === selected;
          const isPast = dateStr < todayStr;
          const isAvailable = status === "available" && !isPast;

          return (
            <button
              key={i}
              disabled={!isAvailable}
              onClick={() => isAvailable && onSelect(dateStr)}
              className={cn(
                "relative mx-auto w-9 h-9 rounded-full text-sm flex items-center justify-center transition-colors",
                isSelected && "bg-primary text-white font-semibold",
                !isSelected && isAvailable && "hover:bg-primary/10 text-foreground",
                !isSelected && status === "holiday" && "text-red-400 line-through",
                !isSelected && status === "pto" && "text-amber-500",
                !isSelected && (status === "no-shift" || isPast) && "text-muted-foreground/40",
              )}
            >
              {day}
              {isAvailable && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Available</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Holiday</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> PTO</span>
      </div>
    </div>
  );
}

// ─── Main Booking Page ────────────────────────────────────────────────────────

export default function Book() {
  const [step, setStep] = useState(0);
  const { data: rawProviders = [] } = trpc.providers.listWithSchedule.useQuery();
  const { data: locations = [] } = trpc.locations.list.useQuery();
  const { data: shiftPlans = [] } = trpc.shiftPlans.list.useQuery();
  const { data: allShiftPlanSlots = [] } = trpc.shiftPlanSlots.list.useQuery({ shiftPlanId: undefined });
  const { data: shiftTemplates = [] } = trpc.shiftTemplates.list.useQuery();
  const { data: allAppointments = [] } = trpc.appointments.list.useQuery({ providerId: undefined });

  const [state, setState] = useState({
    appointmentType: "",
    providerId: "",
    locationId: "",
    date: "",
    time: "",
    patientName: "",
    patientEmail: "",
    patientPhone: "",
    notes: "",
  });

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1);

  const apptType = APPOINTMENT_TYPES.find((t) => t.value === state.appointmentType);
  const durationMinutes = apptType?.durationMinutes ?? 30;

  const selectedProvider = rawProviders.find((p) => p.id === state.providerId) ?? null;

  const schedulerProvider = selectedProvider ? {
    id: selectedProvider.id,
    primaryLocationId: selectedProvider.primaryLocationId,
    shiftPlanIds: selectedProvider.shiftPlanIds,
    holidayDates: selectedProvider.holidayDates,
    ptoEntries: selectedProvider.ptoEntries,
  } : null;

  const availability = useMemo(() => {
    if (!schedulerProvider) return {};
    return getMonthAvailability(
      schedulerProvider, calYear, calMonth, durationMinutes,
      shiftPlans, allShiftPlanSlots, shiftTemplates, allAppointments,
      state.locationId || undefined
    );
  }, [schedulerProvider, calYear, calMonth, durationMinutes, shiftPlans, allShiftPlanSlots, shiftTemplates, allAppointments, state.locationId]);

  const slotResult = useMemo(() => {
    if (!schedulerProvider || !state.date) return null;
    return getAvailableSlots(
      schedulerProvider, state.date, durationMinutes,
      shiftPlans, allShiftPlanSlots, shiftTemplates, allAppointments,
      state.locationId || undefined
    );
  }, [schedulerProvider, state.date, durationMinutes, shiftPlans, allShiftPlanSlots, shiftTemplates, allAppointments, state.locationId]);

  const utils = trpc.useUtils();
  const bookAppt = trpc.appointments.upsert.useMutation({
    onSuccess: () => { utils.appointments.list.invalidate(); next(); toast.success("Appointment confirmed!"); }
  });

  function next() { setStep((s) => s + 1); }
  function back() { setStep((s) => s - 1); }
  function update(patch: Partial<typeof state>) { setState((s) => ({ ...s, ...patch })); }

  function confirmBooking() {
    if (!schedulerProvider || !state.date || !state.time || !apptType) return;
    const slot = slotResult?.slots.find((s) => s.time === state.time);
    const locId = slot?.locationId ?? schedulerProvider.primaryLocationId;
    const [hh, mm] = state.time.split(":").map(Number);
    const endTime = minutesToTime(hh * 60 + mm + durationMinutes);
    bookAppt.mutate({
      providerId: schedulerProvider.id,
      locationId: locId,
      patientName: state.patientName,
      patientEmail: state.patientEmail,
      patientPhone: state.patientPhone || "",
      appointmentType: state.appointmentType,
      date: state.date,
      startTime: state.time,
      endTime,
      durationMinutes,
      notes: state.notes || "",
    });
  }

  const selectedLocation = locations.find((l) => {
    const slot = slotResult?.slots.find(s => s.time === state.time);
    return l.id === (slot?.locationId ?? schedulerProvider?.primaryLocationId);
  });

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="flex-1 bg-background py-10">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            {step < 5 && (
              <div className="mb-8">
                <h1 className="font-display text-3xl font-semibold text-foreground">Book an Appointment</h1>
                <p className="text-muted-foreground mt-1">Schedule your visit with one of our dental professionals.</p>
              </div>
            )}
            {step < 5 && <StepIndicator current={step} />}
            <div className={cn("flex gap-8", step === 5 && "justify-center")}>
              <div className="flex-1 min-w-0">

                {step === 0 && (
                  <div className="space-y-4">
                    <h2 className="font-display text-xl font-semibold">What type of appointment?</h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {APPOINTMENT_TYPES.map((t) => (
                        <button key={t.value} onClick={() => update({ appointmentType: t.value })}
                          className={cn("p-4 rounded-xl border-2 text-left transition-all",
                            state.appointmentType === t.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 bg-white")}>
                          <p className="font-semibold text-sm text-foreground">{t.label}</p>
                          <p className="text-xs text-muted-foreground mt-1">{t.durationMinutes} minutes</p>
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button onClick={next} disabled={!state.appointmentType}>Continue <ChevronRight className="ml-1 w-4 h-4" /></Button>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-4">
                    <h2 className="font-display text-xl font-semibold">Choose a provider</h2>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => update({ locationId: "" })}
                        className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                          !state.locationId ? "bg-primary text-white border-primary" : "border-border hover:border-primary/40")}>
                        Any Location
                      </button>
                      {locations.map((loc) => (
                        <button key={loc.id} onClick={() => update({ locationId: loc.id })}
                          className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                            state.locationId === loc.id ? "bg-primary text-white border-primary" : "border-border hover:border-primary/40")}>
                          {loc.name}
                        </button>
                      ))}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {rawProviders
                        .filter((p) => !state.locationId || p.primaryLocationId === state.locationId)
                        .map((p) => {
                          const loc = locations.find(l => l.id === p.primaryLocationId);
                          const isSelected = state.providerId === p.id;
                          const avatarUrl = p.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=1E2D4E&color=fff&size=160`;
                          return (
                            <button key={p.id} onClick={() => update({ providerId: p.id })}
                              className={cn("rounded-xl border-2 overflow-hidden text-left transition-all",
                                isSelected ? "border-primary" : "border-border hover:border-primary/40")}>
                              <div className="h-40 overflow-hidden bg-muted">
                                <img src={avatarUrl} alt={p.name} className="w-full h-full object-cover object-[center_15%]" />
                              </div>
                              <div className="p-4 bg-white">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-display font-semibold text-sm text-foreground">{p.name}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{loc?.name}</p>
                                  </div>
                                  <Badge variant={p.role === "Dentist" ? "default" : "secondary"} className="text-xs shrink-0">{p.role}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.bio}</p>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={back}><ChevronLeft className="mr-1 w-4 h-4" /> Back</Button>
                      <Button onClick={next} disabled={!state.providerId}>Continue <ChevronRight className="ml-1 w-4 h-4" /></Button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <h2 className="font-display text-xl font-semibold">Select a date</h2>
                    <MiniCalendar year={calYear} month={calMonth} availability={availability}
                      selected={state.date} onSelect={(d) => update({ date: d, time: "" })}
                      onNavigate={(y, m) => { setCalYear(y); setCalMonth(m); }} />
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={back}><ChevronLeft className="mr-1 w-4 h-4" /> Back</Button>
                      <Button onClick={next} disabled={!state.date}>Continue <ChevronRight className="ml-1 w-4 h-4" /></Button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <h2 className="font-display text-xl font-semibold">Select a time on {state.date}</h2>
                    {slotResult?.blockedByHoliday && (
                      <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>This date is a holiday ({slotResult.holidayName}). Please go back and select another date.</span>
                      </div>
                    )}
                    {slotResult?.noShift && !slotResult.blockedByHoliday && (
                      <div className="p-4 rounded-xl bg-muted border border-border text-muted-foreground text-sm">
                        No shifts scheduled on this date. Please go back and select another date.
                      </div>
                    )}
                    {slotResult && slotResult.slots.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {slotResult.slots.map((slot) => (
                          <button key={`${slot.time}|${slot.locationId}`}
                            onClick={() => update({ time: slot.time, locationId: slot.locationId })}
                            className={cn("p-3 rounded-xl border text-sm font-medium transition-all",
                              state.time === slot.time ? "border-primary bg-primary text-white" : "border-border bg-card hover:border-primary/60 text-foreground")}>
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={back}><ChevronLeft className="mr-1 w-4 h-4" /> Back</Button>
                      <Button onClick={next} disabled={!state.time}>Continue <ChevronRight className="ml-1 w-4 h-4" /></Button>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div>
                    <h2 className="font-display text-xl font-semibold mb-6">Your details</h2>
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div><Label>Full Name *</Label><Input value={state.patientName} onChange={(e) => update({ patientName: e.target.value })} placeholder="Jane Smith" className="mt-1" /></div>
                        <div><Label>Email *</Label><Input type="email" value={state.patientEmail} onChange={(e) => update({ patientEmail: e.target.value })} placeholder="jane@example.com" className="mt-1" /></div>
                      </div>
                      <div><Label>Phone</Label><Input value={state.patientPhone} onChange={(e) => update({ patientPhone: e.target.value })} placeholder="+1 (555) 000-0000" className="mt-1" /></div>
                      <div><Label>Notes</Label><Textarea value={state.notes} onChange={(e) => update({ notes: e.target.value })} placeholder="Any concerns or special requests..." className="mt-1" rows={3} /></div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <Button variant="outline" onClick={back}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
                      <Button onClick={confirmBooking} disabled={!state.patientName || !state.patientEmail || bookAppt.isPending}
                        className="bg-amber-500 hover:bg-amber-400 text-white">
                        {bookAppt.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Confirm Appointment
                      </Button>
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                      <Check className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h2 className="font-display text-3xl font-semibold text-foreground mb-2">You're booked!</h2>
                    <p className="text-muted-foreground mb-8">A confirmation has been noted. We look forward to seeing you.</p>
                    <div className="bg-card border border-border rounded-xl p-6 text-left max-w-sm mx-auto space-y-3">
                      {apptType && <div className="flex gap-2"><Stethoscope className="w-4 h-4 text-primary mt-0.5 shrink-0" /><div><p className="text-xs text-muted-foreground">Type</p><p className="text-sm font-medium">{apptType.label}</p></div></div>}
                      {selectedProvider && <div className="flex gap-2"><User className="w-4 h-4 text-primary mt-0.5 shrink-0" /><div><p className="text-xs text-muted-foreground">Provider</p><p className="text-sm font-medium">{selectedProvider.name}</p></div></div>}
                      {selectedLocation && <div className="flex gap-2"><MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" /><div><p className="text-xs text-muted-foreground">Location</p><p className="text-sm font-medium">{selectedLocation.name}</p></div></div>}
                      <div className="flex gap-2"><CalendarCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" /><div><p className="text-xs text-muted-foreground">Date & Time</p><p className="text-sm font-medium">{state.date} at {state.time}</p></div></div>
                    </div>
                    <Button className="mt-8 bg-amber-500 hover:bg-amber-400 text-white"
                      onClick={() => { setStep(0); setState({ appointmentType: "", providerId: "", locationId: "", date: "", time: "", patientName: "", patientEmail: "", patientPhone: "", notes: "" }); }}>
                      Book Another Appointment
                    </Button>
                  </div>
                )}
              </div>

              {step > 0 && step < 5 && (
                <div className="hidden lg:block w-72 shrink-0">
                  <Card className="shadow-sm sticky top-24">
                    <CardContent className="p-5 space-y-4">
                      <h3 className="font-display font-semibold text-sm text-foreground">Your Booking</h3>
                      {apptType && (
                        <div className="flex items-start gap-2">
                          <Stethoscope className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <div><p className="text-xs text-muted-foreground">Type</p><p className="text-sm font-medium">{apptType.label}</p></div>
                        </div>
                      )}
                      {selectedProvider && (
                        <div className="flex items-center gap-2">
                          <img src={selectedProvider.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedProvider.name)}&background=1E2D4E&color=fff&size=80`}
                            alt={selectedProvider.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                          <div><p className="text-xs text-muted-foreground">Provider</p><p className="text-sm font-medium">{selectedProvider.name}</p></div>
                        </div>
                      )}
                      {state.date && (
                        <div className="flex items-start gap-2">
                          <CalendarCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <div><p className="text-xs text-muted-foreground">Date</p><p className="text-sm font-medium">{state.date}</p></div>
                        </div>
                      )}
                      {state.time && (
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <div><p className="text-xs text-muted-foreground">Time</p><p className="text-sm font-medium">{state.time}</p></div>
                        </div>
                      )}
                      {apptType && (
                        <div className="pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground">Duration</p>
                          <p className="text-sm font-medium">{apptType.durationMinutes} minutes</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
