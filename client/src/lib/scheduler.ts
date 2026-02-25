/**
 * BrightSmiles Scheduling Engine
 *
 * Algorithm:
 * 1. For a given provider + date, find all shift plans the provider belongs to.
 * 2. For each plan, determine which shift (cycle index) applies on that date.
 * 3. Collect all shift segments for the active shift that match the date's
 *    weekday / day-of-month / month constraints.
 * 4. Parse each segment into a concrete time window [start, end).
 * 5. Subtract holiday closures and PTO blocks.
 * 6. Optionally filter by location.
 * 7. Chop remaining windows into appointment-duration slots.
 * 8. Subtract already-booked appointments.
 */

import {
  APPOINTMENTS,
  SHIFTS,
  SHIFT_PLANS,
  SHIFT_SEGMENTS,
  getHolidayDatesForCalendar,
  getPtoEntriesForCalendar,
  type DayOfWeek,
  type Provider,
  type ShiftSegment,
} from "./data";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAY_NAMES: DayOfWeek[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Parse ISO 8601 duration string (PT4H, PT8H, PT4H30M) → minutes */
export function parseDurationMinutes(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  const h = parseInt(match[1] ?? "0", 10);
  const m = parseInt(match[2] ?? "0", 10);
  return h * 60 + m;
}

/** "HH:MM" → minutes since midnight */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** minutes since midnight → "HH:MM" */
export function minutesToTime(m: number): string {
  const hh = Math.floor(m / 60).toString().padStart(2, "0");
  const mm = (m % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

/** "YYYY-MM-DD" → Date (local midnight) */
function parseDate(dateStr: string): Date {
  const [y, mo, d] = dateStr.split("-").map(Number);
  return new Date(y, mo - 1, d);
}

/** ISO datetime string → minutes since midnight on its date */
function isoToMinutes(iso: string): number {
  const t = iso.includes("T") ? iso.split("T")[1].slice(0, 5) : "00:00";
  return timeToMinutes(t);
}

/** ISO datetime string → "YYYY-MM-DD" */
function isoToDate(iso: string): string {
  return iso.split("T")[0];
}

interface TimeWindow {
  startMin: number; // minutes since midnight
  endMin: number;
}

/** Subtract blocker windows from a list of windows */
function subtractWindows(windows: TimeWindow[], blockers: TimeWindow[]): TimeWindow[] {
  let result = [...windows];
  for (const blocker of blockers) {
    const next: TimeWindow[] = [];
    for (const w of result) {
      // No overlap
      if (blocker.endMin <= w.startMin || blocker.startMin >= w.endMin) {
        next.push(w);
        continue;
      }
      // Partial overlap – left remainder
      if (blocker.startMin > w.startMin) {
        next.push({ startMin: w.startMin, endMin: blocker.startMin });
      }
      // Partial overlap – right remainder
      if (blocker.endMin < w.endMin) {
        next.push({ startMin: blocker.endMin, endMin: w.endMin });
      }
      // Full overlap → window is consumed
    }
    result = next;
  }
  return result;
}

/** Chop windows into fixed-duration slots */
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

// ─── Cycle index resolution ───────────────────────────────────────────────────

/**
 * Given a shift plan and a target date, return the 1-based cycle index
 * (e.g. 1 = Week A, 2 = Week B for a 2-week rotation).
 */
function resolveCycleIndex(planId: string, targetDate: Date): number {
  const plan = SHIFT_PLANS.find((p) => p.id === planId);
  if (!plan) return 1;

  const effectiveDate = parseDate(plan.effectiveDate.split("T")[0]);
  const diffMs = targetDate.getTime() - effectiveDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (plan.shiftCycleUnit === "Week(s)") {
    const cycleLengthDays = plan.shiftCycle * 7;
    const offset = ((diffDays % cycleLengthDays) + cycleLengthDays) % cycleLengthDays;
    const weekIndex = Math.floor(offset / 7); // 0-based
    return (weekIndex % plan.shiftCycle) + 1;  // 1-based
  }

  if (plan.shiftCycleUnit === "Month(s)") {
    // For monthly plans, cycle index is always 1 (single monthly pattern)
    return 1;
  }

  return 1;
}

// ─── Segment matching ─────────────────────────────────────────────────────────

function segmentMatchesDate(seg: ShiftSegment, date: Date): boolean {
  const dayOfWeek = DAY_NAMES[date.getDay()];
  const dayOfMonth = date.getDate();
  const month = (date.getMonth() + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

  if (!seg.weekDays.includes(dayOfWeek)) return false;
  if (seg.months !== null && !seg.months.includes(month)) return false;
  if (seg.daysOfMonth !== null && !seg.daysOfMonth.includes(dayOfMonth)) return false;

  return true;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface AvailableSlot {
  time: string;         // "HH:MM"
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

/**
 * Main scheduling function.
 * Returns available appointment slots for a provider on a given date.
 */
export function getAvailableSlots(
  provider: Provider,
  dateStr: string,         // "YYYY-MM-DD"
  durationMinutes: number,
  locationFilter?: string  // optional location ID filter
): SlotResult {
  const date = parseDate(dateStr);

  // ── 1. Check holiday ──────────────────────────────────────────────────────
  const holidays = getHolidayDatesForCalendar(provider.holidayCalendarId);
  const holiday = holidays.find((h) => h.date === dateStr);
  if (holiday) {
    return { slots: [], blockedByHoliday: true, holidayName: holiday.name, blockedByPto: false, noShift: false };
  }

  // ── 2. Collect matching segments from all provider's shift plans ──────────
  const matchingSegments: { seg: ShiftSegment; shiftName: string }[] = [];

  for (const planId of provider.shiftPlanIds) {
    const cycleIndex = resolveCycleIndex(planId, date);
    // Find the shift in this plan with the matching cycle index
    const shift = SHIFTS.find(
      (s) => s.shiftPlanId === planId && s.cycleIndex === cycleIndex
    );
    if (!shift) continue;

    const segments = SHIFT_SEGMENTS.filter((seg) => seg.shiftId === shift.id);
    for (const seg of segments) {
      if (segmentMatchesDate(seg, date)) {
        matchingSegments.push({ seg, shiftName: shift.name });
      }
    }
  }

  if (matchingSegments.length === 0) {
    return { slots: [], blockedByHoliday: false, blockedByPto: false, noShift: true };
  }

  // ── 3. Apply location filter ──────────────────────────────────────────────
  const filteredSegments = locationFilter
    ? matchingSegments.filter(
        ({ seg }) => seg.locationId === locationFilter || seg.locationId === null
      )
    : matchingSegments;

  if (filteredSegments.length === 0) {
    return { slots: [], blockedByHoliday: false, blockedByPto: false, noShift: true };
  }

  // ── 4. Build raw windows from segments ───────────────────────────────────
  interface SegWindow {
    window: TimeWindow;
    locationId: string;
    segmentName: string;
  }

  const segWindows: SegWindow[] = filteredSegments.map(({ seg, shiftName: _sn }) => {
    const startMin = timeToMinutes(seg.startTime);
    const durationMin = parseDurationMinutes(seg.duration);
    return {
      window: { startMin, endMin: startMin + durationMin },
      locationId: seg.locationId ?? provider.primaryLocationId,
      segmentName: seg.name,
    };
  });

  // ── 5. Build PTO blockers ─────────────────────────────────────────────────
  const ptoEntries = getPtoEntriesForCalendar(provider.ptoCalendarId);
  const ptoBlockers: TimeWindow[] = [];
  let ptoNote: string | undefined;

  for (const pto of ptoEntries) {
    const ptoStartDate = isoToDate(pto.start);
    const ptoEndDate = isoToDate(pto.end);

    if (dateStr >= ptoStartDate && dateStr <= ptoEndDate) {
      // Full-day PTO
      if (ptoStartDate === ptoEndDate && pto.start.includes("00:00") && pto.end.includes("23:59")) {
        return { slots: [], blockedByHoliday: false, blockedByPto: true, ptoNote: pto.notes, noShift: false };
      }
      // Multi-day PTO spanning this date fully
      if (ptoStartDate < dateStr && ptoEndDate > dateStr) {
        return { slots: [], blockedByHoliday: false, blockedByPto: true, ptoNote: pto.notes, noShift: false };
      }
      // Same-day partial PTO
      if (ptoStartDate === dateStr && ptoEndDate === dateStr) {
        ptoBlockers.push({ startMin: isoToMinutes(pto.start), endMin: isoToMinutes(pto.end) });
        ptoNote = pto.notes;
      }
      // Multi-day PTO: first day
      else if (ptoStartDate === dateStr) {
        ptoBlockers.push({ startMin: isoToMinutes(pto.start), endMin: 24 * 60 });
        ptoNote = pto.notes;
      }
      // Multi-day PTO: last day
      else if (ptoEndDate === dateStr) {
        ptoBlockers.push({ startMin: 0, endMin: isoToMinutes(pto.end) });
        ptoNote = pto.notes;
      }
    }
  }

  // ── 6. Subtract PTO and build per-segment slots ───────────────────────────
  const allSlots: AvailableSlot[] = [];

  for (const sw of segWindows) {
    const available = subtractWindows([sw.window], ptoBlockers);
    const times = chopIntoSlots(available, durationMinutes);

    for (const t of times) {
      allSlots.push({
        time: t,
        locationId: sw.locationId,
        locationName: "", // filled below
        segmentName: sw.segmentName,
      });
    }
  }

  // ── 7. Subtract already-booked appointments ───────────────────────────────
  const existingBookings = APPOINTMENTS.filter(
    (a) => a.providerId === provider.id && a.date === dateStr
  );

  const bookedSlots = new Set(existingBookings.map((a) => a.startTime));
  const finalSlots = allSlots.filter((s) => !bookedSlots.has(s.time));

  // ── 8. Deduplicate by time+location and fill location name ────────────────
  const seen = new Set<string>();
  const deduped: AvailableSlot[] = [];
  for (const s of finalSlots) {
    const key = `${s.time}|${s.locationId}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(s);
    }
  }

  // Sort by time
  deduped.sort((a, b) => a.time.localeCompare(b.time));

  return {
    slots: deduped,
    blockedByHoliday: false,
    blockedByPto: ptoNote !== undefined,
    ptoNote,
    noShift: false,
  };
}

/**
 * Returns a summary of a provider's availability across a range of dates.
 * Used to power the calendar view (green = available, grey = unavailable).
 */
export function getMonthAvailability(
  provider: Provider,
  year: number,
  month: number, // 1-based
  durationMinutes: number,
  locationFilter?: string
): Record<string, "available" | "holiday" | "pto" | "no-shift"> {
  const result: Record<string, "available" | "holiday" | "pto" | "no-shift"> = {};
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const slotResult = getAvailableSlots(provider, dateStr, durationMinutes, locationFilter);

    if (slotResult.blockedByHoliday) {
      result[dateStr] = "holiday";
    } else if (slotResult.noShift) {
      result[dateStr] = "no-shift";
    } else if (slotResult.blockedByPto) {
      result[dateStr] = "pto";
    } else if (slotResult.slots.length > 0) {
      result[dateStr] = "available";
    } else {
      result[dateStr] = "no-shift";
    }
  }

  return result;
}
