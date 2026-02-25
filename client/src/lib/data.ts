/**
 * BrightSmiles Dental – Data Layer
 * Design: Warm Professional (Fraunces + DM Sans, off-white canvas, navy/sky/amber palette)
 *
 * All sample data from the spec is seeded here in-memory.
 * The scheduling engine in scheduler.ts consumes these structures.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type DayOfWeek = "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type CycleUnit = "Week(s)" | "Month(s)";
export type ProviderRole = "Dentist" | "Hygienist";

export interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
}

export interface HolidayCalendar {
  id: string;
  name: string;
}

export interface HolidayDate {
  id: string;
  calendarId: string;
  date: string; // YYYY-MM-DD
  name: string;
}

export interface PtoCalendar {
  id: string;
  name: string;
  ownerResourceId: string;
}

export interface PtoEntry {
  id: string;
  calendarId: string;
  start: string; // ISO datetime
  end: string;   // ISO datetime
  notes: string;
}

export interface ShiftPlan {
  id: string;
  name: string;
  effectiveDate: string; // ISO datetime
  shiftCycle: number;
  shiftCycleUnit: CycleUnit;
}

export interface Shift {
  id: string;
  name: string;
  shiftPlanId: string;
  /** 1-based index within the cycle (Week A = 1, Week B = 2, etc.) */
  cycleIndex: number;
}

export interface ShiftSegment {
  id: string;
  name: string;
  shiftId: string;
  /** null = all months */
  months: Month[] | null;
  weekDays: DayOfWeek[];
  /** null = any day of month */
  daysOfMonth: number[] | null;
  startTime: string; // "HH:MM"
  /** ISO 8601 duration e.g. PT4H, PT8H */
  duration: string;
  locationId: string | null;
}

export interface Provider {
  id: string;
  name: string;
  role: ProviderRole;
  holidayCalendarId: string;
  ptoCalendarId: string;
  /** All shift plan IDs this provider participates in */
  shiftPlanIds: string[];
  /** The "current" shift within the primary plan (used for display) */
  currentShiftId: string;
  primaryLocationId: string;
  photoUrl: string;
  bio: string;
}

export interface Appointment {
  id: string;
  providerId: string;
  locationId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  appointmentType: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM
  durationMinutes: number;
  notes: string;
  bookedAt: string;   // ISO datetime
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

export const LOCATIONS: Location[] = [
  {
    id: "LOC-001",
    name: "Downtown Clinic",
    address: "125 Main Street, Suite 200, Boston, MA 02101",
    phone: "(617) 555-0100",
  },
  {
    id: "LOC-002",
    name: "North Clinic",
    address: "88 Northgate Plaza, Woburn, MA 01801",
    phone: "(781) 555-0200",
  },
];

export const HOLIDAY_CALENDARS: HolidayCalendar[] = [
  { id: "HOL-NE-2026", name: "New England Clinic Holidays 2026" },
];

export const HOLIDAY_DATES: HolidayDate[] = [
  { id: "HLD-001", calendarId: "HOL-NE-2026", date: "2026-01-01", name: "New Year's Day" },
  { id: "HLD-002", calendarId: "HOL-NE-2026", date: "2026-05-25", name: "Memorial Day" },
  { id: "HLD-003", calendarId: "HOL-NE-2026", date: "2026-07-04", name: "Independence Day" },
  { id: "HLD-004", calendarId: "HOL-NE-2026", date: "2026-11-26", name: "Thanksgiving" },
  { id: "HLD-005", calendarId: "HOL-NE-2026", date: "2026-12-25", name: "Christmas" },
];

export const PTO_CALENDARS: PtoCalendar[] = [
  { id: "PTO-DR-LEE",   name: "PTO Calendar – Dr. Lee",              ownerResourceId: "DEN-001" },
  { id: "PTO-DR-PATEL", name: "PTO Calendar – Dr. Patel",            ownerResourceId: "DEN-002" },
  { id: "PTO-HYG-CHEN", name: "PTO Calendar – Amy Chen (Hygienist)", ownerResourceId: "HYG-001" },
];

export const PTO_ENTRIES: PtoEntry[] = [
  {
    id: "PTOE-001",
    calendarId: "PTO-DR-LEE",
    start: "2026-02-16T00:00",
    end:   "2026-02-20T23:59",
    notes: "Vacation",
  },
  {
    id: "PTOE-002",
    calendarId: "PTO-DR-PATEL",
    start: "2026-03-06T12:00",
    end:   "2026-03-06T17:00",
    notes: "Afternoon off",
  },
  {
    id: "PTOE-003",
    calendarId: "PTO-HYG-CHEN",
    start: "2026-04-10T00:00",
    end:   "2026-04-10T23:59",
    notes: "Conference",
  },
];

export const SHIFT_PLANS: ShiftPlan[] = [
  {
    id: "SP-100",
    name: "Dentists – 2-week Rotation (2026)",
    effectiveDate: "2026-01-05T00:00",
    shiftCycle: 2,
    shiftCycleUnit: "Week(s)",
  },
  {
    id: "SP-200",
    name: "Hygienists – Standard Weekly",
    effectiveDate: "2026-01-05T00:00",
    shiftCycle: 1,
    shiftCycleUnit: "Week(s)",
  },
  {
    id: "SP-300",
    name: "Downtown Saturday Coverage (Monthly)",
    effectiveDate: "2026-01-10T00:00",
    shiftCycle: 1,
    shiftCycleUnit: "Month(s)",
  },
];

export const SHIFTS: Shift[] = [
  { id: "SH-101", name: "Dentists Week A",           shiftPlanId: "SP-100", cycleIndex: 1 },
  { id: "SH-102", name: "Dentists Week B",           shiftPlanId: "SP-100", cycleIndex: 2 },
  { id: "SH-201", name: "Hygienists Standard Week",  shiftPlanId: "SP-200", cycleIndex: 1 },
  { id: "SH-301", name: "Downtown Saturday Coverage",shiftPlanId: "SP-300", cycleIndex: 1 },
];

export const SHIFT_SEGMENTS: ShiftSegment[] = [
  // ── Week A (SH-101) ──────────────────────────────────────────────────────
  { id: "SEG-1011", name: "Week A – Mon AM",   shiftId: "SH-101", months: null, weekDays: ["Mon"], daysOfMonth: null, startTime: "08:00", duration: "PT4H",  locationId: "LOC-001" },
  { id: "SEG-1012", name: "Week A – Mon PM",   shiftId: "SH-101", months: null, weekDays: ["Mon"], daysOfMonth: null, startTime: "13:00", duration: "PT4H",  locationId: "LOC-001" },
  { id: "SEG-1013", name: "Week A – Tue Full", shiftId: "SH-101", months: null, weekDays: ["Tue"], daysOfMonth: null, startTime: "09:00", duration: "PT8H",  locationId: "LOC-001" },
  { id: "SEG-1014", name: "Week A – Thu Full", shiftId: "SH-101", months: null, weekDays: ["Thu"], daysOfMonth: null, startTime: "09:00", duration: "PT8H",  locationId: "LOC-002" },
  { id: "SEG-1015", name: "Week A – Fri AM",   shiftId: "SH-101", months: null, weekDays: ["Fri"], daysOfMonth: null, startTime: "08:00", duration: "PT4H",  locationId: "LOC-002" },

  // ── Week B (SH-102) ──────────────────────────────────────────────────────
  { id: "SEG-1021", name: "Week B – Mon Full", shiftId: "SH-102", months: null, weekDays: ["Mon"], daysOfMonth: null, startTime: "09:00", duration: "PT8H",  locationId: "LOC-002" },
  { id: "SEG-1022", name: "Week B – Wed Full", shiftId: "SH-102", months: null, weekDays: ["Wed"], daysOfMonth: null, startTime: "09:00", duration: "PT8H",  locationId: "LOC-001" },
  { id: "SEG-1023", name: "Week B – Thu PM",   shiftId: "SH-102", months: null, weekDays: ["Thu"], daysOfMonth: null, startTime: "13:00", duration: "PT4H",  locationId: "LOC-001" },
  { id: "SEG-1024", name: "Week B – Fri Full", shiftId: "SH-102", months: null, weekDays: ["Fri"], daysOfMonth: null, startTime: "08:00", duration: "PT8H",  locationId: "LOC-001" },

  // ── Hygienists Standard Week (SH-201) ────────────────────────────────────
  { id: "SEG-2011", name: "Hyg Mon-Thu Full",  shiftId: "SH-201", months: null, weekDays: ["Mon","Tue","Wed","Thu"], daysOfMonth: null, startTime: "08:00", duration: "PT8H",  locationId: "LOC-001" },
  { id: "SEG-2012", name: "Hyg Fri Half Day",  shiftId: "SH-201", months: null, weekDays: ["Fri"], daysOfMonth: null, startTime: "08:00", duration: "PT4H",  locationId: "LOC-001" },

  // ── Monthly Saturday Coverage (SH-301) ───────────────────────────────────
  { id: "SEG-3011", name: "Mid-month Sat Clinic", shiftId: "SH-301", months: null, weekDays: ["Sat"], daysOfMonth: [15], startTime: "09:00", duration: "PT4H", locationId: "LOC-001" },
];

export const PROVIDERS: Provider[] = [
  {
    id: "DEN-001",
    name: "Dr. Sandra Lee",
    role: "Dentist",
    holidayCalendarId: "HOL-NE-2026",
    ptoCalendarId: "PTO-DR-LEE",
    shiftPlanIds: ["SP-100", "SP-300"],
    currentShiftId: "SH-101",
    primaryLocationId: "LOC-001",
    photoUrl: "https://private-us-east-1.manuscdn.com/sessionFile/YlJexUWVPBghLTUyI8mNx8/sandbox/rVDf31o4i8qp7h6k1qtNAK-img-2_1772039491000_na1fn_cHJvdmlkZXItbGVl.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvWWxKZXhVV1ZQQmdoTFRVeUk4bU54OC9zYW5kYm94L3JWRGYzMW80aThxcDdoNmsxcXROQUstaW1nLTJfMTc3MjAzOTQ5MTAwMF9uYTFmbl9jSEp2ZG1sa1pYSXRiR1ZsLmpwZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=ur1pwQQP-uTAHTF-hybt9R1UfeztPFb-kHqvKh-xCLzc2p~3oMe9OG5uGBCY1f2A-ystLdOxHxaQl365AowSRVm5rGVHujWKDoajL5Jzvfxg4Qm5cFnAGfOLXRj1eaJzZHrOEdtw1KKpHmuDELsXEaT8zz30kdMzXTx3B4LFE-v0kQDcvWdDJPIGGgT-K792x7q38w0n-hxUvPFvgZn6mPTbVIY0tcF~wSzZ1QlLQxjR-YN2RwLru0z4f8dydh-lqec7ayt5C5uZ9y8yeEiiOUXyOkuXTxmG73PBol0Ddzl5FXGpt7N0pRe0FA3pnCYdeNdpoiJ4oSsXvYqciBVfhw__",
    bio: "Dr. Lee has over 15 years of experience in general and cosmetic dentistry. She is passionate about preventive care and patient education.",
  },
  {
    id: "DEN-002",
    name: "Dr. Ravi Patel",
    role: "Dentist",
    holidayCalendarId: "HOL-NE-2026",
    ptoCalendarId: "PTO-DR-PATEL",
    shiftPlanIds: ["SP-100"],
    currentShiftId: "SH-102",
    primaryLocationId: "LOC-002",
    photoUrl: "https://private-us-east-1.manuscdn.com/sessionFile/YlJexUWVPBghLTUyI8mNx8/sandbox/rVDf31o4i8qp7h6k1qtNAK-img-3_1772039496000_na1fn_cHJvdmlkZXItcGF0ZWw.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvWWxKZXhVV1ZQQmdoTFRVeUk4bU54OC9zYW5kYm94L3JWRGYzMW80aThxcDdoNmsxcXROQUstaW1nLTNfMTc3MjAzOTQ5NjAwMF9uYTFmbl9jSEp2ZG1sa1pYSXRjR0YwWld3LmpwZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=oiJgOErg2zt4aX5-uFeDyOS2fPK4a0pUWxAIE3JpYb8js1pnJ3aIfseyOVXjs~aEgZNDHG5wpzvm52tyCNV2OLiSb2BMuE~6Qbf5Y2cA9wBXmsbOnv0FPBZtw8W5K9X5Pg~6xWjGCX~6y3JNBkEQ1zIyD3~Lyipi7OAwxY5e3icL9tDssCTMgdhvGdJqu3NcGh9BRGwLkSClGCpBcwBXO1IN~0uqC2QT06ORgKkkrZga8b6N6-A~0dlhSzmKXblBKsb7YlVNcgNVWh9J2WkGM6KGCr~0cWckHaB7HaklsiahYhY63m-IqGmoQJvsY1pXtZAeUTp-pPSoECeKIMYlNA__",
    bio: "Dr. Patel specialises in restorative dentistry and orthodontic consultations. He is known for his gentle approach and thorough explanations.",
  },
  {
    id: "HYG-001",
    name: "Amy Chen",
    role: "Hygienist",
    holidayCalendarId: "HOL-NE-2026",
    ptoCalendarId: "PTO-HYG-CHEN",
    shiftPlanIds: ["SP-200"],
    currentShiftId: "SH-201",
    primaryLocationId: "LOC-001",
    photoUrl: "https://private-us-east-1.manuscdn.com/sessionFile/YlJexUWVPBghLTUyI8mNx8/sandbox/rVDf31o4i8qp7h6k1qtNAK-img-4_1772039497000_na1fn_cHJvdmlkZXItY2hlbg.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvWWxKZXhVV1ZQQmdoTFRVeUk4bU54OC9zYW5kYm94L3JWRGYzMW80aThxcDdoNmsxcXROQUstaW1nLTRfMTc3MjAzOTQ5NzAwMF9uYTFmbl9jSEp2ZG1sa1pYSXRZMmhsYmcuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=WrWvjSKDwMenw0VM2sfNgVlzlCdiai34GF9ZJvHYSBZP-Z5AQ9AmIHYivoq2AEJhZ52je6qMJP2dUkcWDYlUm36wScf9WZuFZYidUhZKoev8BzrFQ8lhqPGn0EPBMolr5YMFDFiAm362qcq3w8ctf2QIxmeTtcMQ3u3hBchbEfQpKIGT6Bd39JyJeULNn0mptS9uGy-7N4jYFWgHNwNeyNOBlKKZwI55ONYO4mGGSQXgaHZ5uI3z11ERoekCZfmvMmC2zKJY629U~xAaWUbuns3AZrcizoATfv0kIwR1NxIT3T1wkmP4R-rRoBa8YnjZ556oGBQzV8Qgyw-7dOc5Uw__",
    bio: "Amy Chen is a registered dental hygienist with a focus on periodontal health and patient comfort. She offers thorough cleanings and personalised oral hygiene coaching.",
  },
];

// ─── In-memory appointments store ────────────────────────────────────────────

export const APPOINTMENTS: Appointment[] = [];

// ─── Lookup helpers ──────────────────────────────────────────────────────────

export function getLocation(id: string): Location | undefined {
  return LOCATIONS.find((l) => l.id === id);
}

export function getProvider(id: string): Provider | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

export function getShiftPlan(id: string): ShiftPlan | undefined {
  return SHIFT_PLANS.find((sp) => sp.id === id);
}

export function getShift(id: string): Shift | undefined {
  return SHIFTS.find((s) => s.id === id);
}

export function getSegmentsForShift(shiftId: string): ShiftSegment[] {
  return SHIFT_SEGMENTS.filter((seg) => seg.shiftId === shiftId);
}

export function getHolidayDatesForCalendar(calendarId: string): HolidayDate[] {
  return HOLIDAY_DATES.filter((h) => h.calendarId === calendarId);
}

export function getPtoEntriesForCalendar(calendarId: string): PtoEntry[] {
  return PTO_ENTRIES.filter((p) => p.calendarId === calendarId);
}

// ─── PTO CRUD helpers ───────────────────────────────────────────────────────

export function addPtoEntry(entry: Omit<PtoEntry, "id">): PtoEntry {
  const newEntry: PtoEntry = { ...entry, id: `PTOE-${Date.now()}` };
  PTO_ENTRIES.push(newEntry);
  return newEntry;
}

export function updatePtoEntry(id: string, patch: Partial<Omit<PtoEntry, "id">>): PtoEntry | null {
  const idx = PTO_ENTRIES.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  PTO_ENTRIES[idx] = { ...PTO_ENTRIES[idx], ...patch };
  return PTO_ENTRIES[idx];
}

export function deletePtoEntry(id: string): boolean {
  const idx = PTO_ENTRIES.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  PTO_ENTRIES.splice(idx, 1);
  return true;
}

// ─── Holiday CRUD helpers ────────────────────────────────────────────────────

export function addHolidayDate(entry: Omit<HolidayDate, "id">): HolidayDate {
  const newEntry: HolidayDate = { ...entry, id: `HLD-${Date.now()}` };
  HOLIDAY_DATES.push(newEntry);
  return newEntry;
}

export function updateHolidayDate(id: string, patch: Partial<Omit<HolidayDate, "id">>): HolidayDate | null {
  const idx = HOLIDAY_DATES.findIndex((h) => h.id === id);
  if (idx === -1) return null;
  HOLIDAY_DATES[idx] = { ...HOLIDAY_DATES[idx], ...patch };
  return HOLIDAY_DATES[idx];
}

export function deleteHolidayDate(id: string): boolean {
  const idx = HOLIDAY_DATES.findIndex((h) => h.id === id);
  if (idx === -1) return false;
  HOLIDAY_DATES.splice(idx, 1);
  return true;
}

export const APPOINTMENT_TYPES = [
  { value: "cleaning",      label: "Routine Cleaning",          durationMinutes: 60 },
  { value: "checkup",       label: "Dental Check-up",           durationMinutes: 30 },
  { value: "xray",          label: "X-Ray & Examination",       durationMinutes: 45 },
  { value: "filling",       label: "Filling",                   durationMinutes: 60 },
  { value: "whitening",     label: "Teeth Whitening",           durationMinutes: 90 },
  { value: "consultation",  label: "New Patient Consultation",  durationMinutes: 45 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEDULE MANAGEMENT LAYER
// ShiftTemplate → ShiftPlanSlot → ProviderAssignment → ShiftOccurrence
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Types ───────────────────────────────────────────────────────────────────

/** A reusable, provider-agnostic shift shape */
export interface ShiftTemplate {
  id: string;
  name: string;
  weekDays: DayOfWeek[];
  startTime: string;      // "HH:MM"
  duration: string;       // ISO 8601 e.g. "PT8H"
  locationId: string;
  defaultRole: ProviderRole;
  color: string;          // Tailwind bg class for grid display
}

/** A slot within a ShiftPlan that references a template */
export interface ShiftPlanSlot {
  id: string;
  shiftPlanId: string;
  cycleIndex: number;     // 1-based (Week A = 1, Week B = 2, Month = 1, etc.)
  templateId: string;
}

/** Assigns a provider to a ShiftPlanSlot for a date range */
export interface ProviderAssignment {
  id: string;
  providerId: string;
  shiftPlanSlotId: string;
  effectiveDate: string;  // YYYY-MM-DD
  endDate: string | null; // null = open-ended
}

/** A concrete occurrence of a provider's shift on a specific date */
export interface ShiftOccurrence {
  id: string;
  assignmentId: string;
  date: string;           // YYYY-MM-DD
  status: "scheduled" | "cancelled" | "swapped";
  substituteProviderId: string | null;
  note: string;
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

export const SHIFT_TEMPLATES: ShiftTemplate[] = [
  {
    id: "TPL-001",
    name: "Full Day – Downtown",
    weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    startTime: "09:00",
    duration: "PT8H",
    locationId: "LOC-001",
    defaultRole: "Dentist",
    color: "bg-blue-500",
  },
  {
    id: "TPL-002",
    name: "AM Half-Day – Downtown",
    weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    startTime: "08:00",
    duration: "PT4H",
    locationId: "LOC-001",
    defaultRole: "Dentist",
    color: "bg-sky-400",
  },
  {
    id: "TPL-003",
    name: "PM Half-Day – Downtown",
    weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    startTime: "13:00",
    duration: "PT4H",
    locationId: "LOC-001",
    defaultRole: "Dentist",
    color: "bg-indigo-400",
  },
  {
    id: "TPL-004",
    name: "Full Day – North",
    weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    startTime: "09:00",
    duration: "PT8H",
    locationId: "LOC-002",
    defaultRole: "Dentist",
    color: "bg-emerald-500",
  },
  {
    id: "TPL-005",
    name: "AM Half-Day – North",
    weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    startTime: "08:00",
    duration: "PT4H",
    locationId: "LOC-002",
    defaultRole: "Dentist",
    color: "bg-teal-400",
  },
  {
    id: "TPL-006",
    name: "Saturday Cover – Downtown",
    weekDays: ["Sat"],
    startTime: "09:00",
    duration: "PT4H",
    locationId: "LOC-001",
    defaultRole: "Dentist",
    color: "bg-amber-500",
  },
  {
    id: "TPL-007",
    name: "Hygienist Full Day – Downtown",
    weekDays: ["Mon", "Tue", "Wed", "Thu"],
    startTime: "08:00",
    duration: "PT8H",
    locationId: "LOC-001",
    defaultRole: "Hygienist",
    color: "bg-violet-500",
  },
  {
    id: "TPL-008",
    name: "Hygienist AM – Downtown",
    weekDays: ["Fri"],
    startTime: "08:00",
    duration: "PT4H",
    locationId: "LOC-001",
    defaultRole: "Hygienist",
    color: "bg-purple-400",
  },
];

/** ShiftPlanSlots connect the existing ShiftPlans to the new templates */
export const SHIFT_PLAN_SLOTS: ShiftPlanSlot[] = [
  // SP-100 (2-week dentist rotation)
  // Week A (cycleIndex 1)
  { id: "SPS-101", shiftPlanId: "SP-100", cycleIndex: 1, templateId: "TPL-002" }, // AM Half Downtown Mon
  { id: "SPS-102", shiftPlanId: "SP-100", cycleIndex: 1, templateId: "TPL-003" }, // PM Half Downtown Mon
  { id: "SPS-103", shiftPlanId: "SP-100", cycleIndex: 1, templateId: "TPL-001" }, // Full Day Downtown Tue
  { id: "SPS-104", shiftPlanId: "SP-100", cycleIndex: 1, templateId: "TPL-004" }, // Full Day North Thu
  { id: "SPS-105", shiftPlanId: "SP-100", cycleIndex: 1, templateId: "TPL-005" }, // AM Half North Fri
  // Week B (cycleIndex 2)
  { id: "SPS-106", shiftPlanId: "SP-100", cycleIndex: 2, templateId: "TPL-004" }, // Full Day North Mon
  { id: "SPS-107", shiftPlanId: "SP-100", cycleIndex: 2, templateId: "TPL-001" }, // Full Day Downtown Wed
  { id: "SPS-108", shiftPlanId: "SP-100", cycleIndex: 2, templateId: "TPL-003" }, // PM Half Downtown Thu
  { id: "SPS-109", shiftPlanId: "SP-100", cycleIndex: 2, templateId: "TPL-001" }, // Full Day Downtown Fri

  // SP-200 (hygienist weekly)
  { id: "SPS-201", shiftPlanId: "SP-200", cycleIndex: 1, templateId: "TPL-007" }, // Hyg Full Mon-Thu
  { id: "SPS-202", shiftPlanId: "SP-200", cycleIndex: 1, templateId: "TPL-008" }, // Hyg AM Fri

  // SP-300 (monthly Saturday)
  { id: "SPS-301", shiftPlanId: "SP-300", cycleIndex: 1, templateId: "TPL-006" }, // Saturday Cover
];

export const PROVIDER_ASSIGNMENTS: ProviderAssignment[] = [
  // Dr. Lee → Week A slots
  { id: "PA-001", providerId: "DEN-001", shiftPlanSlotId: "SPS-101", effectiveDate: "2026-01-05", endDate: null },
  { id: "PA-002", providerId: "DEN-001", shiftPlanSlotId: "SPS-102", effectiveDate: "2026-01-05", endDate: null },
  { id: "PA-003", providerId: "DEN-001", shiftPlanSlotId: "SPS-103", effectiveDate: "2026-01-05", endDate: null },
  { id: "PA-004", providerId: "DEN-001", shiftPlanSlotId: "SPS-104", effectiveDate: "2026-01-05", endDate: null },
  { id: "PA-005", providerId: "DEN-001", shiftPlanSlotId: "SPS-105", effectiveDate: "2026-01-05", endDate: null },
  // Dr. Lee → Saturday
  { id: "PA-006", providerId: "DEN-001", shiftPlanSlotId: "SPS-301", effectiveDate: "2026-01-10", endDate: null },

  // Dr. Patel → Week B slots
  { id: "PA-007", providerId: "DEN-002", shiftPlanSlotId: "SPS-106", effectiveDate: "2026-01-05", endDate: null },
  { id: "PA-008", providerId: "DEN-002", shiftPlanSlotId: "SPS-107", effectiveDate: "2026-01-05", endDate: null },
  { id: "PA-009", providerId: "DEN-002", shiftPlanSlotId: "SPS-108", effectiveDate: "2026-01-05", endDate: null },
  { id: "PA-010", providerId: "DEN-002", shiftPlanSlotId: "SPS-109", effectiveDate: "2026-01-05", endDate: null },

  // Amy Chen → Hygienist slots
  { id: "PA-011", providerId: "HYG-001", shiftPlanSlotId: "SPS-201", effectiveDate: "2026-01-05", endDate: null },
  { id: "PA-012", providerId: "HYG-001", shiftPlanSlotId: "SPS-202", effectiveDate: "2026-01-05", endDate: null },
];

export const SHIFT_OCCURRENCES: ShiftOccurrence[] = [];

// ─── Lookup helpers ──────────────────────────────────────────────────────────

export function getShiftTemplate(id: string): ShiftTemplate | undefined {
  return SHIFT_TEMPLATES.find((t) => t.id === id);
}

export function getSlotsForPlan(shiftPlanId: string): ShiftPlanSlot[] {
  return SHIFT_PLAN_SLOTS.filter((s) => s.shiftPlanId === shiftPlanId);
}

export function getAssignmentsForProvider(providerId: string): ProviderAssignment[] {
  return PROVIDER_ASSIGNMENTS.filter((a) => a.providerId === providerId);
}

export function getAssignmentsForSlot(slotId: string): ProviderAssignment[] {
  return PROVIDER_ASSIGNMENTS.filter((a) => a.shiftPlanSlotId === slotId);
}

// ─── ShiftTemplate CRUD ──────────────────────────────────────────────────────

export function addShiftTemplate(t: Omit<ShiftTemplate, "id">): ShiftTemplate {
  const entry: ShiftTemplate = { ...t, id: `TPL-${Date.now()}` };
  SHIFT_TEMPLATES.push(entry);
  return entry;
}

export function updateShiftTemplate(id: string, patch: Partial<Omit<ShiftTemplate, "id">>): ShiftTemplate | null {
  const idx = SHIFT_TEMPLATES.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  SHIFT_TEMPLATES[idx] = { ...SHIFT_TEMPLATES[idx], ...patch };
  return SHIFT_TEMPLATES[idx];
}

export function deleteShiftTemplate(id: string): boolean {
  const idx = SHIFT_TEMPLATES.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  SHIFT_TEMPLATES.splice(idx, 1);
  return true;
}

// ─── ShiftPlanSlot CRUD ──────────────────────────────────────────────────────

export function addShiftPlanSlot(s: Omit<ShiftPlanSlot, "id">): ShiftPlanSlot {
  const entry: ShiftPlanSlot = { ...s, id: `SPS-${Date.now()}` };
  SHIFT_PLAN_SLOTS.push(entry);
  return entry;
}

export function deleteShiftPlanSlot(id: string): boolean {
  const idx = SHIFT_PLAN_SLOTS.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  SHIFT_PLAN_SLOTS.splice(idx, 1);
  return true;
}

// ─── ProviderAssignment CRUD ─────────────────────────────────────────────────

export function addProviderAssignment(a: Omit<ProviderAssignment, "id">): ProviderAssignment {
  const entry: ProviderAssignment = { ...a, id: `PA-${Date.now()}` };
  PROVIDER_ASSIGNMENTS.push(entry);
  return entry;
}

export function updateProviderAssignment(id: string, patch: Partial<Omit<ProviderAssignment, "id">>): ProviderAssignment | null {
  const idx = PROVIDER_ASSIGNMENTS.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  PROVIDER_ASSIGNMENTS[idx] = { ...PROVIDER_ASSIGNMENTS[idx], ...patch };
  return PROVIDER_ASSIGNMENTS[idx];
}

export function deleteProviderAssignment(id: string): boolean {
  const idx = PROVIDER_ASSIGNMENTS.findIndex((a) => a.id === id);
  if (idx === -1) return false;
  PROVIDER_ASSIGNMENTS.splice(idx, 1);
  return true;
}

// ─── ShiftOccurrence CRUD ────────────────────────────────────────────────────

export function addShiftOccurrence(o: Omit<ShiftOccurrence, "id">): ShiftOccurrence {
  const entry: ShiftOccurrence = { ...o, id: `OCC-${Date.now()}` };
  SHIFT_OCCURRENCES.push(entry);
  return entry;
}

export function updateShiftOccurrence(id: string, patch: Partial<Omit<ShiftOccurrence, "id">>): ShiftOccurrence | null {
  const idx = SHIFT_OCCURRENCES.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  SHIFT_OCCURRENCES[idx] = { ...SHIFT_OCCURRENCES[idx], ...patch };
  return SHIFT_OCCURRENCES[idx];
}
