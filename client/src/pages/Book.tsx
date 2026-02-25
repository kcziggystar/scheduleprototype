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

import { useState, useMemo, useCallback } from "react";
import { TopNav } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PROVIDERS,
  LOCATIONS,
  APPOINTMENT_TYPES,
  APPOINTMENTS,
  getLocation,
  type Provider,
} from "@/lib/data";
import {
  getAvailableSlots,
  getMonthAvailability,
  minutesToTime,
  parseDurationMinutes,
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

// ─── Summary card ─────────────────────────────────────────────────────────────

interface BookingState {
  appointmentType: string;
  provider: Provider | null;
  locationId: string;
  date: string;
  time: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  notes: string;
}

function SummaryCard({ state }: { state: BookingState }) {
  const apptType = APPOINTMENT_TYPES.find((t) => t.value === state.appointmentType);
  const loc = state.locationId ? getLocation(state.locationId) : null;

  return (
    <Card className="shadow-sm sticky top-24">
      <CardContent className="p-5 space-y-4">
        <h3 className="font-display font-semibold text-sm text-foreground">Your Booking</h3>

        {apptType && (
          <Row icon={<Stethoscope className="w-4 h-4 text-primary" />} label="Type" value={apptType.label} />
        )}
        {state.provider && (
          <div className="flex items-center gap-2">
            <img
              src={state.provider.photoUrl}
              alt={state.provider.name}
              className="w-8 h-8 rounded-full object-cover object-top shrink-0"
            />
            <div>
              <p className="text-xs text-muted-foreground">Provider</p>
              <p className="text-sm font-medium">{state.provider.name}</p>
            </div>
          </div>
        )}
        {loc && (
          <Row icon={<MapPin className="w-4 h-4 text-primary" />} label="Location" value={loc.name} />
        )}
        {state.date && (
          <Row icon={<CalendarCheck className="w-4 h-4 text-primary" />} label="Date" value={state.date} />
        )}
        {state.time && (
          <Row icon={<Clock className="w-4 h-4 text-primary" />} label="Time" value={state.time} />
        )}
        {state.patientName && (
          <Row icon={<User className="w-4 h-4 text-primary" />} label="Patient" value={state.patientName} />
        )}
        {apptType && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="text-sm font-medium">{apptType.durationMinutes} minutes</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
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
  const [state, setState] = useState<BookingState>({
    appointmentType: "",
    provider: null,
    locationId: "",
    date: "",
    time: "",
    patientName: "",
    patientEmail: "",
    patientPhone: "",
    notes: "",
  });

  // Calendar navigation
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1);

  // Derived
  const apptType = APPOINTMENT_TYPES.find((t) => t.value === state.appointmentType);
  const durationMinutes = apptType?.durationMinutes ?? 30;

  const availability = useMemo(() => {
    if (!state.provider) return {};
    return getMonthAvailability(
      state.provider,
      calYear,
      calMonth,
      durationMinutes,
      state.locationId || undefined
    );
  }, [state.provider, calYear, calMonth, durationMinutes, state.locationId]);

  const slotResult = useMemo(() => {
    if (!state.provider || !state.date) return null;
    return getAvailableSlots(
      state.provider,
      state.date,
      durationMinutes,
      state.locationId || undefined
    );
  }, [state.provider, state.date, durationMinutes, state.locationId]);

  function next() { setStep((s) => s + 1); }
  function back() { setStep((s) => s - 1); }

  function update(patch: Partial<BookingState>) {
    setState((s) => ({ ...s, ...patch }));
  }

  function confirmBooking() {
    if (!state.provider || !state.date || !state.time || !apptType) return;
    const loc = state.locationId
      ? state.locationId
      : slotResult?.slots.find((s) => s.time === state.time)?.locationId ?? state.provider.primaryLocationId;

    APPOINTMENTS.push({
      id: nanoid(8),
      providerId: state.provider.id,
      locationId: loc,
      patientName: state.patientName,
      patientEmail: state.patientEmail,
      patientPhone: state.patientPhone,
      appointmentType: state.appointmentType,
      date: state.date,
      startTime: state.time,
      durationMinutes,
      notes: state.notes,
      bookedAt: new Date().toISOString(),
    });
    next();
    toast.success("Appointment confirmed!");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />

      <main className="flex-1 bg-background py-10">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            {/* Page header */}
            {step < 5 && (
              <div className="mb-8">
                <h1 className="font-display text-3xl font-semibold text-foreground">Book an Appointment</h1>
                <p className="text-muted-foreground mt-1">
                  Schedule your visit with one of our dental professionals.
                </p>
              </div>
            )}

            {step < 5 && <StepIndicator current={step} />}

            <div className={cn("flex gap-8", step === 5 && "justify-center")}>
              {/* Main content */}
              <div className="flex-1 min-w-0">

                {/* ── Step 0: Appointment Type ── */}
                {step === 0 && (
                  <div className="space-y-4">
                    <h2 className="font-display text-xl font-semibold">What type of appointment?</h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {APPOINTMENT_TYPES.map((t) => (
                        <button
                          key={t.value}
                          onClick={() => { update({ appointmentType: t.value }); }}
                          className={cn(
                            "p-4 rounded-xl border-2 text-left transition-all",
                            state.appointmentType === t.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/40 bg-white"
                          )}
                        >
                          <p className="font-semibold text-sm text-foreground">{t.label}</p>
                          <p className="text-xs text-muted-foreground mt-1">{t.durationMinutes} minutes</p>
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button onClick={next} disabled={!state.appointmentType}>
                        Continue <ChevronRight className="ml-1 w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* ── Step 1: Choose Provider ── */}
                {step === 1 && (
                  <div className="space-y-4">
                    <h2 className="font-display text-xl font-semibold">Choose a provider</h2>

                    {/* Optional location filter */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => update({ locationId: "" })}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                          !state.locationId ? "bg-primary text-white border-primary" : "border-border hover:border-primary/40"
                        )}
                      >
                        Any Location
                      </button>
                      {LOCATIONS.map((loc) => (
                        <button
                          key={loc.id}
                          onClick={() => update({ locationId: loc.id })}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                            state.locationId === loc.id ? "bg-primary text-white border-primary" : "border-border hover:border-primary/40"
                          )}
                        >
                          {loc.name}
                        </button>
                      ))}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {PROVIDERS.map((p) => {
                        const loc = getLocation(p.primaryLocationId);
                        const isSelected = state.provider?.id === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => update({ provider: p })}
                            className={cn(
                              "rounded-xl border-2 overflow-hidden text-left transition-all",
                              isSelected ? "border-primary" : "border-border hover:border-primary/40"
                            )}
                          >
                            <div className="h-40 overflow-hidden">
                              <img
                                src={p.photoUrl}
                                alt={p.name}
                                className="w-full h-full object-cover object-top"
                              />
                            </div>
                            <div className="p-4 bg-white">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-display font-semibold text-sm text-foreground">{p.name}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">{loc?.name}</p>
                                </div>
                                <Badge variant={p.role === "Dentist" ? "default" : "secondary"} className="text-xs shrink-0">
                                  {p.role}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.bio}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={back}>
                        <ChevronLeft className="mr-1 w-4 h-4" /> Back
                      </Button>
                      <Button onClick={next} disabled={!state.provider}>
                        Continue <ChevronRight className="ml-1 w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* ── Step 2: Select Date ── */}
                {step === 2 && (
                  <div className="space-y-6">
                    <h2 className="font-display text-xl font-semibold">Select a date</h2>
                    <MiniCalendar
                      year={calYear}
                      month={calMonth}
                      availability={availability}
                      selected={state.date}
                      onSelect={(d) => update({ date: d, time: "" })}
                      onNavigate={(y, m) => { setCalYear(y); setCalMonth(m); }}
                    />
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={back}>
                        <ChevronLeft className="mr-1 w-4 h-4" /> Back
                      </Button>
                      <Button onClick={next} disabled={!state.date}>
                        Continue <ChevronRight className="ml-1 w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* ── Step 3: Select Time ── */}
                {step === 3 && (
                  <div className="space-y-4">
                    <h2 className="font-display text-xl font-semibold">
                      Available times on {state.date}
                    </h2>

                    {slotResult?.blockedByHoliday && (
                      <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Clinic closed – {slotResult.holidayName}</span>
                      </div>
                    )}

                    {slotResult?.blockedByPto && !slotResult.blockedByHoliday && (
                      <div className="flex items-center gap-2 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Provider on leave – {slotResult.ptoNote}</span>
                      </div>
                    )}

                    {slotResult?.noShift && (
                      <div className="flex items-center gap-2 p-4 rounded-lg bg-secondary border border-border text-muted-foreground text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Provider not scheduled on this date.</span>
                      </div>
                    )}

                    {slotResult && slotResult.slots.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {slotResult.slots.map((slot, i) => {
                          const loc = getLocation(slot.locationId);
                          const isSelected = state.time === slot.time && (state.locationId === slot.locationId || !state.locationId);
                          return (
                            <button
                              key={`${slot.time}-${slot.locationId}`}
                              onClick={() => update({ time: slot.time, locationId: slot.locationId })}
                              style={{ animationDelay: `${i * 20}ms` }}
                              className={cn(
                                "slot-chip p-2 rounded-lg border text-center transition-all",
                                isSelected
                                  ? "border-primary bg-primary text-white"
                                  : "border-border hover:border-primary/50 bg-white"
                              )}
                            >
                              <p className="text-sm font-semibold tabular-nums">{slot.time}</p>
                              <p className={cn("text-xs mt-0.5", isSelected ? "text-white/80" : "text-muted-foreground")}>
                                {loc?.name.replace(" Clinic", "") ?? ""}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={back}>
                        <ChevronLeft className="mr-1 w-4 h-4" /> Back
                      </Button>
                      <Button onClick={next} disabled={!state.time}>
                        Continue <ChevronRight className="ml-1 w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* ── Step 4: Patient Details ── */}
                {step === 4 && (
                  <div className="space-y-5">
                    <h2 className="font-display text-xl font-semibold">Your details</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          placeholder="Jane Smith"
                          value={state.patientName}
                          onChange={(e) => update({ patientName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="jane@example.com"
                          value={state.patientEmail}
                          onChange={(e) => update({ patientEmail: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="(617) 555-0123"
                          value={state.patientPhone}
                          onChange={(e) => update({ patientPhone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="notes">Notes (optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any concerns or information for your provider..."
                        value={state.notes}
                        onChange={(e) => update({ notes: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={back}>
                        <ChevronLeft className="mr-1 w-4 h-4" /> Back
                      </Button>
                      <Button
                        onClick={confirmBooking}
                        disabled={!state.patientName || !state.patientEmail}
                        className="bg-amber-500 hover:bg-amber-400 text-white"
                      >
                        Confirm Booking <Check className="ml-1 w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* ── Step 5: Confirmation ── */}
                {step === 5 && (
                  <div className="max-w-lg mx-auto text-center py-8">
                    <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                      <Check className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h1 className="font-display text-3xl font-semibold text-foreground">
                      You're all set!
                    </h1>
                    <p className="text-muted-foreground mt-2">
                      Your appointment has been confirmed. A confirmation would normally be sent to{" "}
                      <strong>{state.patientEmail}</strong>.
                    </p>

                    <Card className="mt-8 shadow-sm text-left">
                      <CardContent className="p-6 space-y-3">
                        {state.provider && (
                          <div className="flex items-center gap-3 pb-3 border-b border-border">
                            <img
                              src={state.provider.photoUrl}
                              alt={state.provider.name}
                              className="w-12 h-12 rounded-full object-cover object-top"
                            />
                            <div>
                              <p className="font-display font-semibold">{state.provider.name}</p>
                              <p className="text-xs text-muted-foreground">{state.provider.role}</p>
                            </div>
                          </div>
                        )}
                        <Row icon={<Stethoscope className="w-4 h-4 text-primary" />} label="Appointment" value={apptType?.label ?? ""} />
                        <Row icon={<CalendarCheck className="w-4 h-4 text-primary" />} label="Date" value={state.date} />
                        <Row icon={<Clock className="w-4 h-4 text-primary" />} label="Time" value={`${state.time} (${durationMinutes} min)`} />
                        <Row icon={<MapPin className="w-4 h-4 text-primary" />} label="Location" value={getLocation(state.locationId)?.name ?? ""} />
                        <Row icon={<User className="w-4 h-4 text-primary" />} label="Patient" value={state.patientName} />
                      </CardContent>
                    </Card>

                    <div className="mt-8 flex flex-wrap gap-3 justify-center">
                      <Button
                        onClick={() => {
                          setStep(0);
                          setState({
                            appointmentType: "",
                            provider: null,
                            locationId: "",
                            date: "",
                            time: "",
                            patientName: "",
                            patientEmail: "",
                            patientPhone: "",
                            notes: "",
                          });
                        }}
                        variant="outline"
                      >
                        Book Another
                      </Button>
                      <a href="/admin/appointments">
                        <Button className="bg-primary text-white">
                          View in Admin
                        </Button>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky summary */}
              {step > 0 && step < 5 && (
                <div className="hidden lg:block w-64 shrink-0">
                  <SummaryCard state={state} />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
