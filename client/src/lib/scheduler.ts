/**
 * BrightSmiles Scheduling Engine (DB-backed version)
 *
 * The provider object passed in must be the "enriched" shape returned by
 * trpc.providers.listWithSchedule, which adds:
 *   shiftPlanIds: string[]
 *   holidayDates: { date: string; name: string }[]
 *   ptoEntries: { startDate: string; endDate: string; startTime?: string|null; endTime?: string|null }[]
 */

export type DayOfWeek = "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";

export interface SchedulerProvider {
  id: string;
  primaryLocationId: string;
  shiftPlanIds: string[];
  holidayDates: { date: string; name: string }[];
  ptoEntries: {
    startDate: string;
    endDate: string;
    startTime?: string | null;
    endTime?: string | null;
  }[];
}

export interface SchedulerShiftPlan {
  id: string;
  shiftCycle: number;
  shiftCycleUnit: string;
  effectiveDate: string;
}

export interface SchedulerShiftPlanSlot {
  id: string;
  shiftPlanId: string;
  cycleIndex: number;
  templateId: string;
}

export interface DaySegment {
  day: DayOfWeek;
  seg1Start: string;
  seg1End: string;
  seg2Start?: string;
  seg2End?: string;
}

export interface SchedulerShiftTemplate {
  id: string;
  locationId: string;
  weekDays: string;
  startTime: string;
  endTime: string;
  segmentsJson?: string | null;
}

export interface SchedulerAppointment {
  providerId: string;
  date: string;
  startTime: string;
}

const DAY_NAMES: DayOfWeek[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function timeToMinutes(t: string): number {
  const [h, m] = (t || "00:00").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(m: number): string {
  const hh = Math.floor(m / 60).toString().padStart(2, "0");
  const mm = (m % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

export function parseDurationMinutes(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  const h = parseInt(match[1] ?? "0", 10);
  const m2 = parseInt(match[2] ?? "0", 10);
  return h * 60 + m2;
}

function parseDate(dateStr: string): Date {
  const [y, mo, d] = dateStr.split("-").map(Number);
  return new Date(y, mo - 1, d);
}

interface TimeWindow {
  startMin: number;
  endMin: number;
}

function subtractWindows(windows: TimeWindow[], blockers: TimeWindow[]): TimeWindow[] {
  let result = [...windows];
  for (const blocker of blockers) {
    const next: TimeWindow[] = [];
    for (const w of result) {
      if (blocker.endMin <= w.startMin || blocker.startMin >= w.endMin) {
        next.push(w);
        continue;
      }
      if (blocker.startMin > w.startMin) next.push({ startMin: w.startMin, endMin: blocker.startMin });
      if (blocker.endMin < w.endMin) next.push({ startMin: blocker.endMin, endMin: w.endMin });
    }
    result = next;
  }
  return result;
}

function chopIntoSlots(windows: TimeWindow[], durationMin: number): string[] {
  const slots: string[] = [];
  for (const w of windows) {
    let cursor = w.startMin;
    while (cursor + durationMin <= w.endMin) {
      slots.push(minutesToTime(cursor));
      cursor += durationMin;
    }
  }
  return slots;
}

function resolveCycleIndex(plan: SchedulerShiftPlan, targetDate: Date): number {
  const effectiveDate = parseDate(plan.effectiveDate.split("T")[0]);
  const diffMs = targetDate.getTime() - effectiveDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (plan.shiftCycleUnit === "Week(s)") {
    const cycleLengthDays = plan.shiftCycle * 7;
    const offset = ((diffDays % cycleLengthDays) + cycleLengthDays) % cycleLengthDays;
    const weekIndex = Math.floor(offset / 7);
    return (weekIndex % plan.shiftCycle) + 1;
  }
  return 1;
}

export interface AvailableSlot {
  time: string;
  locationId: string;
  locationName: string;
  segmentName: string;
}

export interface SlotResult {
  slots: AvailableSlot[];
  blockedByHoliday: boolean;
  holidayName?: string;
  blockedByPto: boolean;
  ptoNote?: string;
  noShift: boolean;
}

export function getAvailableSlots(
  provider: SchedulerProvider,
  dateStr: string,
  durationMinutes: number,
  allShiftPlans: SchedulerShiftPlan[],
  allShiftPlanSlots: SchedulerShiftPlanSlot[],
  allTemplates: SchedulerShiftTemplate[],
  allAppointments: SchedulerAppointment[],
  locationFilter?: string
): SlotResult {
  const date = parseDate(dateStr);
  const dayOfWeek = DAY_NAMES[date.getDay()];

  const holiday = provider.holidayDates.find((h) => h.date === dateStr);
  if (holiday) {
    return { slots: [], blockedByHoliday: true, holidayName: holiday.name, blockedByPto: false, noShift: false };
  }

  interface TemplateWindow { window: TimeWindow; locationId: string; segmentName: string; }
  const templateWindows: TemplateWindow[] = [];

  for (const planId of provider.shiftPlanIds) {
    const plan = allShiftPlans.find((p) => p.id === planId);
    if (!plan) continue;
    const cycleIndex = resolveCycleIndex(plan, date);
    const planSlots = allShiftPlanSlots.filter((s) => s.shiftPlanId === planId && s.cycleIndex === cycleIndex);
    for (const slot of planSlots) {
      const tmpl = allTemplates.find((t) => t.id === slot.templateId);
      if (!tmpl) continue;
      const weekDays = tmpl.weekDays.split(",").map((d) => d.trim()) as DayOfWeek[];
      if (!weekDays.includes(dayOfWeek)) continue;
      if (locationFilter && tmpl.locationId !== locationFilter) continue;

      let daySegs: DaySegment[] = [];
      if (tmpl.segmentsJson) {
        try { daySegs = JSON.parse(tmpl.segmentsJson); } catch { daySegs = []; }
      }
      const daySeg = daySegs.find((ds) => ds.day === dayOfWeek);

      if (daySeg) {
        templateWindows.push({ window: { startMin: timeToMinutes(daySeg.seg1Start), endMin: timeToMinutes(daySeg.seg1End) }, locationId: tmpl.locationId, segmentName: "Morning" });
        if (daySeg.seg2Start && daySeg.seg2End) {
          templateWindows.push({ window: { startMin: timeToMinutes(daySeg.seg2Start), endMin: timeToMinutes(daySeg.seg2End) }, locationId: tmpl.locationId, segmentName: "Afternoon" });
        }
      } else {
        templateWindows.push({ window: { startMin: timeToMinutes(tmpl.startTime), endMin: timeToMinutes(tmpl.endTime) }, locationId: tmpl.locationId, segmentName: "All Day" });
      }
    }
  }

  if (templateWindows.length === 0) {
    return { slots: [], blockedByHoliday: false, blockedByPto: false, noShift: true };
  }

  const ptoBlockers: TimeWindow[] = [];
  let ptoNote: string | undefined;

  for (const pto of provider.ptoEntries) {
    const { startDate, endDate, startTime, endTime } = pto;
    if (dateStr < startDate || dateStr > endDate) continue;
    const isFullDay = !startTime || !endTime;
    if (isFullDay || (startDate < dateStr && endDate > dateStr)) {
      return { slots: [], blockedByHoliday: false, blockedByPto: true, ptoNote: startDate, noShift: false };
    }
    if (startDate === dateStr && endDate === dateStr && startTime && endTime) {
      ptoBlockers.push({ startMin: timeToMinutes(startTime), endMin: timeToMinutes(endTime) });
      ptoNote = startDate;
    } else if (startDate === dateStr && startTime) {
      ptoBlockers.push({ startMin: timeToMinutes(startTime), endMin: 24 * 60 });
      ptoNote = startDate;
    } else if (endDate === dateStr && endTime) {
      ptoBlockers.push({ startMin: 0, endMin: timeToMinutes(endTime) });
      ptoNote = startDate;
    }
  }

  const allSlots: AvailableSlot[] = [];
  for (const tw of templateWindows) {
    const available = subtractWindows([tw.window], ptoBlockers);
    const times = chopIntoSlots(available, durationMinutes);
    for (const t of times) {
      allSlots.push({ time: t, locationId: tw.locationId, locationName: "", segmentName: tw.segmentName });
    }
  }

  const bookedSlots = new Set(
    allAppointments.filter((a) => a.providerId === provider.id && a.date === dateStr).map((a) => a.startTime)
  );
  const finalSlots = allSlots.filter((s) => !bookedSlots.has(s.time));

  const seen = new Set<string>();
  const deduped: AvailableSlot[] = [];
  for (const s of finalSlots) {
    const key = `${s.time}|${s.locationId}`;
    if (!seen.has(key)) { seen.add(key); deduped.push(s); }
  }
  deduped.sort((a, b) => a.time.localeCompare(b.time));

  return { slots: deduped, blockedByHoliday: false, blockedByPto: ptoNote !== undefined, ptoNote, noShift: false };
}

export function getMonthAvailability(
  provider: SchedulerProvider,
  year: number,
  month: number,
  durationMinutes: number,
  allShiftPlans: SchedulerShiftPlan[],
  allShiftPlanSlots: SchedulerShiftPlanSlot[],
  allTemplates: SchedulerShiftTemplate[],
  allAppointments: SchedulerAppointment[],
  locationFilter?: string
): Record<string, "available" | "holiday" | "pto" | "no-shift"> {
  const result: Record<string, "available" | "holiday" | "pto" | "no-shift"> = {};
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const slotResult = getAvailableSlots(provider, dateStr, durationMinutes, allShiftPlans, allShiftPlanSlots, allTemplates, allAppointments, locationFilter);
    if (slotResult.blockedByHoliday) result[dateStr] = "holiday";
    else if (slotResult.noShift) result[dateStr] = "no-shift";
    else if (slotResult.blockedByPto) result[dateStr] = "pto";
    else if (slotResult.slots.length > 0) result[dateStr] = "available";
    else result[dateStr] = "no-shift";
  }
  return result;
}
