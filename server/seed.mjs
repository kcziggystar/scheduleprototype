/**
 * Seed script – run once with: node server/seed.mjs
 * Populates all BrightSmiles reference data from the original spec.
 */
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(conn);

// ── helpers ──────────────────────────────────────────────────────────────────
async function upsert(table, rows) {
  for (const row of rows) {
    await db.insert(table).values(row).onDuplicateKeyUpdate({ set: row });
  }
}

// ── import schema ─────────────────────────────────────────────────────────────
const {
  locations,
  holidayCalendars,
  holidayDates,
  ptoCalendars,
  ptoEntries,
  providers,
  shiftTemplates,
  shiftPlans,
  shiftPlanSlots,
  providerAssignments,
} = await import("../drizzle/schema.ts");

// ── Locations ─────────────────────────────────────────────────────────────────
await upsert(locations, [
  {
    id: "loc-downtown",
    name: "BrightSmiles Downtown",
    address: "123 Main Street, Boston, MA 02101",
    phone: "(617) 555-0101",
    timezone: "America/New_York",
  },
  {
    id: "loc-northside",
    name: "BrightSmiles Northside",
    address: "456 Oak Avenue, Cambridge, MA 02139",
    phone: "(617) 555-0202",
    timezone: "America/New_York",
  },
]);
console.log("✓ locations");

// ── Holiday Calendars ─────────────────────────────────────────────────────────
await upsert(holidayCalendars, [
  { id: "hcal-us-2026", name: "US Federal Holidays 2026" },
]);

await upsert(holidayDates, [
  { id: "hd-nyd",      calendarId: "hcal-us-2026", date: "2026-01-01", name: "New Year's Day" },
  { id: "hd-mlk",      calendarId: "hcal-us-2026", date: "2026-01-19", name: "MLK Jr. Day" },
  { id: "hd-pres",     calendarId: "hcal-us-2026", date: "2026-02-16", name: "Presidents' Day" },
  { id: "hd-mem",      calendarId: "hcal-us-2026", date: "2026-05-25", name: "Memorial Day" },
  { id: "hd-jul4",     calendarId: "hcal-us-2026", date: "2026-07-04", name: "Independence Day" },
  { id: "hd-labor",    calendarId: "hcal-us-2026", date: "2026-09-07", name: "Labor Day" },
  { id: "hd-thanks",   calendarId: "hcal-us-2026", date: "2026-11-26", name: "Thanksgiving Day" },
  { id: "hd-xmas",     calendarId: "hcal-us-2026", date: "2026-12-25", name: "Christmas Day" },
]);
console.log("✓ holiday calendars & dates");

// ── PTO Calendars ─────────────────────────────────────────────────────────────
await upsert(ptoCalendars, [
  { id: "pto-lee",   name: "Dr. Lee PTO" },
  { id: "pto-patel", name: "Dr. Patel PTO" },
  { id: "pto-chen",  name: "Sarah Chen PTO" },
]);

await upsert(ptoEntries, [
  // Dr. Lee – full week off in March
  {
    id: "pto-lee-1",
    calendarId: "pto-lee",
    startDate: "2026-03-09",
    endDate: "2026-03-13",
    reason: "Spring vacation",
  },
  // Dr. Patel – single day
  {
    id: "pto-patel-1",
    calendarId: "pto-patel",
    startDate: "2026-04-17",
    endDate: "2026-04-17",
    reason: "Personal day",
  },
  // Sarah Chen – half day (PM)
  {
    id: "pto-chen-1",
    calendarId: "pto-chen",
    startDate: "2026-03-20",
    endDate: "2026-03-20",
    startTime: "13:00",
    endTime: "17:00",
    reason: "Appointment",
  },
]);
console.log("✓ PTO calendars & entries");

// ── Providers ─────────────────────────────────────────────────────────────────
await upsert(providers, [
  {
    id: "prov-lee",
    name: "Dr. Jamie Lee",
    role: "Dentist",
    bio: "General and cosmetic dentist with 12 years of experience. Specialises in smile makeovers and anxiety-free care.",
    photoUrl: "https://ui-avatars.com/api/?name=Sarah+Lee&size=400&background=4A90D9&color=fff&bold=true&font-size=0.33",
    primaryLocationId: "loc-downtown",
    ptoCalendarId: "pto-lee",
    holidayCalendarId: "hcal-us-2026",
  },
  {
    id: "prov-patel",
    name: "Dr. Priya Patel",
    role: "Dentist",
    bio: "Paediatric and family dentist passionate about making dental visits fun for children and stress-free for parents.",
    photoUrl: "https://ui-avatars.com/api/?name=Raj+Patel&size=400&background=E8A87C&color=fff&bold=true&font-size=0.33",
    primaryLocationId: "loc-northside",
    ptoCalendarId: "pto-patel",
    holidayCalendarId: "hcal-us-2026",
  },
  {
    id: "prov-chen",
    name: "Sarah Chen RDH",
    role: "Hygienist",
    bio: "Registered dental hygienist with a gentle touch and a focus on preventive care and patient education.",
    photoUrl: "https://ui-avatars.com/api/?name=Lisa+Chen&size=400&background=7BC67E&color=fff&bold=true&font-size=0.33",
    primaryLocationId: "loc-downtown",
    ptoCalendarId: "pto-chen",
    holidayCalendarId: "hcal-us-2026",
  },
]);
console.log("✓ providers");

// ── Shift Templates ───────────────────────────────────────────────────────────
await upsert(shiftTemplates, [
  {
    id: "tmpl-full-downtown",
    name: "Full Day – Downtown",
    locationId: "loc-downtown",
    weekDays: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri"]),
    startTime: "09:00",
    duration: "PT8H",
    defaultRole: "Dentist",
    color: "bg-sky-500",
  },
  {
    id: "tmpl-am-downtown",
    name: "AM Half – Downtown",
    locationId: "loc-downtown",
    weekDays: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri"]),
    startTime: "09:00",
    duration: "PT4H",
    defaultRole: "Hygienist",
    color: "bg-teal-500",
  },
  {
    id: "tmpl-pm-downtown",
    name: "PM Half – Downtown",
    locationId: "loc-downtown",
    weekDays: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri"]),
    startTime: "13:00",
    duration: "PT4H",
    defaultRole: "Hygienist",
    color: "bg-indigo-500",
  },
  {
    id: "tmpl-full-northside",
    name: "Full Day – Northside",
    locationId: "loc-northside",
    weekDays: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri"]),
    startTime: "08:00",
    duration: "PT8H",
    defaultRole: "Dentist",
    color: "bg-violet-500",
  },
  {
    id: "tmpl-sat-downtown",
    name: "Saturday Cover – Downtown",
    locationId: "loc-downtown",
    weekDays: JSON.stringify(["Sat"]),
    startTime: "09:00",
    duration: "PT4H",
    defaultRole: "Dentist",
    color: "bg-amber-500",
  },
]);
console.log("✓ shift templates");

// ── Shift Plans ───────────────────────────────────────────────────────────────
await upsert(shiftPlans, [
  {
    id: "plan-dentist-2wk",
    name: "Dentist 2-Week Rotation",
    shiftCycle: 2,
    shiftCycleUnit: "Week(s)",
    effectiveDate: "2026-01-05",
  },
  {
    id: "plan-hygienist-1wk",
    name: "Hygienist Weekly",
    shiftCycle: 1,
    shiftCycleUnit: "Week(s)",
    effectiveDate: "2026-01-05",
  },
]);
console.log("✓ shift plans");

// ── Shift Plan Slots ──────────────────────────────────────────────────────────
await upsert(shiftPlanSlots, [
  // Dentist plan – Week A: Downtown full day
  { id: "slot-dentist-wkA-downtown", shiftPlanId: "plan-dentist-2wk", cycleIndex: 1, templateId: "tmpl-full-downtown" },
  // Dentist plan – Week B: Northside full day
  { id: "slot-dentist-wkB-northside", shiftPlanId: "plan-dentist-2wk", cycleIndex: 2, templateId: "tmpl-full-northside" },
  // Hygienist plan – Week 1: AM Downtown
  { id: "slot-hygienist-am", shiftPlanId: "plan-hygienist-1wk", cycleIndex: 1, templateId: "tmpl-am-downtown" },
  // Hygienist plan – Week 1: PM Downtown
  { id: "slot-hygienist-pm", shiftPlanId: "plan-hygienist-1wk", cycleIndex: 1, templateId: "tmpl-pm-downtown" },
]);
console.log("✓ shift plan slots");

// ── Provider Assignments ──────────────────────────────────────────────────────
await upsert(providerAssignments, [
  {
    id: "assign-lee-dentist-wkA",
    providerId: "prov-lee",
    shiftPlanSlotId: "slot-dentist-wkA-downtown",
    effectiveDate: "2026-01-05",
  },
  {
    id: "assign-lee-dentist-wkB",
    providerId: "prov-lee",
    shiftPlanSlotId: "slot-dentist-wkB-northside",
    effectiveDate: "2026-01-05",
  },
  {
    id: "assign-patel-dentist-wkA",
    providerId: "prov-patel",
    shiftPlanSlotId: "slot-dentist-wkA-downtown",
    effectiveDate: "2026-01-05",
  },
  {
    id: "assign-patel-dentist-wkB",
    providerId: "prov-patel",
    shiftPlanSlotId: "slot-dentist-wkB-northside",
    effectiveDate: "2026-01-05",
  },
  {
    id: "assign-chen-hygienist-am",
    providerId: "prov-chen",
    shiftPlanSlotId: "slot-hygienist-am",
    effectiveDate: "2026-01-05",
  },
  {
    id: "assign-chen-hygienist-pm",
    providerId: "prov-chen",
    shiftPlanSlotId: "slot-hygienist-pm",
    effectiveDate: "2026-01-05",
  },
]);
console.log("✓ provider assignments");

await conn.end();
console.log("\n🎉 Seed complete!");
