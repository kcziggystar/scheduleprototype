import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Locations ────────────────────────────────────────────────────────────────

export const locations = mysqlTable("locations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  address: varchar("address", { length: 256 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  timezone: varchar("timezone", { length: 64 }).notNull().default("America/New_York"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Location = typeof locations.$inferSelect;
export type InsertLocation = typeof locations.$inferInsert;

// ─── Holiday Calendars ────────────────────────────────────────────────────────

export const holidayCalendars = mysqlTable("holiday_calendars", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HolidayCalendar = typeof holidayCalendars.$inferSelect;
export type InsertHolidayCalendar = typeof holidayCalendars.$inferInsert;

export const holidayDates = mysqlTable("holiday_dates", {
  id: varchar("id", { length: 64 }).primaryKey(),
  calendarId: varchar("calendarId", { length: 64 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HolidayDate = typeof holidayDates.$inferSelect;
export type InsertHolidayDate = typeof holidayDates.$inferInsert;

// ─── PTO Calendars ────────────────────────────────────────────────────────────

export const ptoCalendars = mysqlTable("pto_calendars", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PtoCalendar = typeof ptoCalendars.$inferSelect;
export type InsertPtoCalendar = typeof ptoCalendars.$inferInsert;

export const ptoEntries = mysqlTable("pto_entries", {
  id: varchar("id", { length: 64 }).primaryKey(),
  calendarId: varchar("calendarId", { length: 64 }).notNull(),
  startDate: varchar("startDate", { length: 10 }).notNull(),
  endDate: varchar("endDate", { length: 10 }).notNull(),
  startTime: varchar("startTime", { length: 5 }),
  endTime: varchar("endTime", { length: 5 }),
  reason: varchar("reason", { length: 256 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PtoEntry = typeof ptoEntries.$inferSelect;
export type InsertPtoEntry = typeof ptoEntries.$inferInsert;

// ─── Providers ────────────────────────────────────────────────────────────────

export const providers = mysqlTable("providers", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  role: mysqlEnum("providerRole", ["Dentist", "Hygienist"]).notNull(),
  bio: text("bio"),
  photoUrl: text("photoUrl"),
  primaryLocationId: varchar("primaryLocationId", { length: 64 }).notNull(),
  ptoCalendarId: varchar("ptoCalendarId", { length: 64 }).notNull(),
  holidayCalendarId: varchar("holidayCalendarId", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Provider = typeof providers.$inferSelect;
export type InsertProvider = typeof providers.$inferInsert;

// ─── Shift Templates ──────────────────────────────────────────────────────────

export const shiftTemplates = mysqlTable("shift_templates", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  locationId: varchar("locationId", { length: 64 }).notNull(),
  weekDays: varchar("weekDays", { length: 128 }).notNull(),
  startTime: varchar("startTime", { length: 5 }).notNull(),
  endTime: varchar("endTime", { length: 5 }).notNull().default("17:00"),
  duration: varchar("duration", { length: 16 }).notNull(),
  /** JSON: [{day,seg1Start,seg1End,seg2Start?,seg2End?}] for per-day 2-segment config */
  segmentsJson: text("segmentsJson"),
  defaultRole: mysqlEnum("defaultRole", ["Dentist", "Hygienist"]).notNull(),
  color: varchar("color", { length: 64 }).notNull().default("bg-sky-500"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShiftTemplate = typeof shiftTemplates.$inferSelect;
export type InsertShiftTemplate = typeof shiftTemplates.$inferInsert;

// ─── Shift Plans ──────────────────────────────────────────────────────────────

export const shiftPlans = mysqlTable("shift_plans", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  shiftCycle: int("shiftCycle").notNull().default(1),
  shiftCycleUnit: varchar("shiftCycleUnit", { length: 32 }).notNull().default("Week(s)"),
  effectiveDate: varchar("effectiveDate", { length: 10 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShiftPlan = typeof shiftPlans.$inferSelect;
export type InsertShiftPlan = typeof shiftPlans.$inferInsert;

// ─── Shift Plan Slots ─────────────────────────────────────────────────────────

export const shiftPlanSlots = mysqlTable("shift_plan_slots", {
  id: varchar("id", { length: 64 }).primaryKey(),
  shiftPlanId: varchar("shiftPlanId", { length: 64 }).notNull(),
  cycleIndex: int("cycleIndex").notNull().default(1),
  templateId: varchar("templateId", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShiftPlanSlot = typeof shiftPlanSlots.$inferSelect;
export type InsertShiftPlanSlot = typeof shiftPlanSlots.$inferInsert;

// ─── Provider Assignments ─────────────────────────────────────────────────────

export const providerAssignments = mysqlTable("provider_assignments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  providerId: varchar("providerId", { length: 64 }).notNull(),
  shiftPlanSlotId: varchar("shiftPlanSlotId", { length: 64 }).notNull(),
  effectiveDate: varchar("effectiveDate", { length: 10 }).notNull(),
  endDate: varchar("endDate", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProviderAssignment = typeof providerAssignments.$inferSelect;
export type InsertProviderAssignment = typeof providerAssignments.$inferInsert;

// ─── Shift Occurrences ────────────────────────────────────────────────────────

export const shiftOccurrences = mysqlTable("shift_occurrences", {
  id: varchar("id", { length: 64 }).primaryKey(),
  assignmentId: varchar("assignmentId", { length: 64 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  status: mysqlEnum("occurrenceStatus", ["scheduled", "cancelled", "swapped"]).notNull().default("scheduled"),
  substituteProviderId: varchar("substituteProviderId", { length: 64 }),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShiftOccurrence = typeof shiftOccurrences.$inferSelect;
export type InsertShiftOccurrence = typeof shiftOccurrences.$inferInsert;

// ─── Appointments ─────────────────────────────────────────────────────────────

export const appointments = mysqlTable("appointments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  providerId: varchar("providerId", { length: 64 }).notNull(),
  locationId: varchar("locationId", { length: 64 }).notNull(),
  patientName: varchar("patientName", { length: 128 }).notNull(),
  patientEmail: varchar("patientEmail", { length: 320 }).notNull(),
  patientPhone: varchar("patientPhone", { length: 32 }),
  appointmentType: varchar("appointmentType", { length: 64 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  startTime: varchar("startTime", { length: 5 }).notNull(),
  endTime: varchar("endTime", { length: 5 }).notNull(),
  durationMinutes: int("durationMinutes").notNull(),
  notes: text("notes"),
  status: mysqlEnum("appointmentStatus", ["confirmed", "cancelled", "completed"]).notNull().default("confirmed"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;