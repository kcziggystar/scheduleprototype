import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  locations, InsertLocation,
  holidayCalendars, InsertHolidayCalendar,
  holidayDates, InsertHolidayDate,
  ptoCalendars, InsertPtoCalendar,
  ptoEntries, InsertPtoEntry,
  providers, InsertProvider,
  shiftTemplates, InsertShiftTemplate,
  shiftPlans, InsertShiftPlan,
  shiftPlanSlots, InsertShiftPlanSlot,
  providerAssignments, InsertProviderAssignment,
  shiftOccurrences, InsertShiftOccurrence,
  appointments, InsertAppointment,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Locations ───────────────────────────────────────────────────────────────

export async function getLocations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(locations);
}

export async function getLocation(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(locations).where(eq(locations.id, id)).limit(1);
  return rows[0];
}

export async function upsertLocation(row: InsertLocation) {
  const db = await getDb();
  if (!db) throw new Error('DB unavailable');
  await db.insert(locations).values(row).onDuplicateKeyUpdate({ set: row });
}

export async function deleteLocation(id: string) {
  const db = await getDb();
  if (!db) throw new Error('DB unavailable');
  await db.delete(locations).where(eq(locations.id, id));
}

// ─── Holiday Calendars ────────────────────────────────────────────────────────

export async function getHolidayCalendars() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(holidayCalendars);
}

export async function upsertHolidayCalendar(row: InsertHolidayCalendar) {
  const db = await getDb();
  if (!db) throw new Error('DB unavailable');
  await db.insert(holidayCalendars).values(row).onDuplicateKeyUpdate({ set: row });
}

export async function getHolidayDates(calendarId?: string) {
  const db = await getDb();
  if (!db) return [];
  if (calendarId) return db.select().from(holidayDates).where(eq(holidayDates.calendarId, calendarId));
  return db.select().from(holidayDates);
}

export async function upsertHolidayDate(row: InsertHolidayDate) {
  const db = await getDb();
  if (!db) throw new Error('DB unavailable');
  await db.insert(holidayDates).values(row).onDuplicateKeyUpdate({ set: row });
}

export async function deleteHolidayDate(id: string) {
  const db = await getDb();
  if (!db) throw new Error('DB unavailable');
  await db.delete(holidayDates).where(eq(holidayDates.id, id));
}

// ─── PTO Calendars ────────────────────────────────────────────────────────────

export async function getPtoCalendars() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ptoCalendars);
}

export async function upsertPtoCalendar(row: InsertPtoCalendar) {
  const db = await getDb();
  if (!db) throw new Error('DB unavailable');
  await db.insert(ptoCalendars).values(row).onDuplicateKeyUpdate({ set: row });
}

export async function getPtoEntries(calendarId?: string) {
  const db = await getDb();
  if (!db) return [];
  if (calendarId) return db.select().from(ptoEntries).where(eq(ptoEntries.calendarId, calendarId));
  return db.select().from(ptoEntries);
}

export async function upsertPtoEntry(row: InsertPtoEntry) {
  const db = await getDb();
  if (!db) throw new Error('DB unavailable');
  await db.insert(ptoEntries).values(row).onDuplicateKeyUpdate({ set: row });
}

export async function deletePtoEntry(id: string) {
  const db = await getDb();
  if (!db) throw new Error('DB unavailable');
  await db.delete(ptoEntries).where(eq(ptoEntries.id, id));
}

// ─── Providers ────────────────────────────────────────────────────────────────

export async function getProviders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(providers);
}

export async function getProvider(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(providers).where(eq(providers.id, id)).limit(1);
  return rows[0];
}

export async function upsertProvider(row: InsertProvider) {
  const db = await getDb();
  if (!db) throw new Error('DB unavailable');
  await db.insert(providers).values(row).onDuplicateKeyUpdate({ set: row });
}

export async function deleteProvider(id: string) {
  const db = await getDb();
  if (!db) throw new Error('DB unavailable');
  await db.delete(providers).where(eq(providers.id, id));
}

// ─── Shift Templates ──────────────────────────────────────────────────────────

export async function getShiftTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(shiftTemplates);
}

export async function upsertShiftTemplate(row: InsertShiftTemplate) {
  const db = await getDb();
  if (!db) throw new Error('DB unavailable');
  await db.insert(shiftTemplates).values(row).onDuplicateKeyUpdate({ set: row });
}

export async function deleteShiftTemplate(id: string) {
  const db = await getDb();
  if (!db) throw new Error('DB unavailable');
  await db.delete(shiftTemplates).where(eq(shiftTemplates.id, id));
}

// ─── Shift Plans ──────────────────────────────────────────────────────────────

export async function getShiftPlans() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(shiftPlans);
}

export async function upsertShiftPlan(row: InsertShiftPlan) {
  const db = await getDb();
  if (!db) throw new Error('DB unavailable');
  await db.insert(shiftPlans).values(row).onDuplicateKeyUpdate({ set: row });
}

export async function deleteShiftPlan(id: string) {
  const db = await getDb();
  if (!db) throw new Error('DB unavailable');
  await db.delete(shiftPlans).where(eq(shiftPlans.id, id));
}

// ─── Shift Plan Slots ─────────────────────────────────────────────────────────

export async function getShiftPlanSlots(shiftPlanId?: string) {
  const db = await getDb();
  if (!db) return [];
  if (shiftPlanId) return db.select().from(shiftPlanSlots).where(eq(shiftPlanSlots.shiftPlanId, shiftPlanId));
  return db.select().from(shiftPlanSlots);
}

export async function upsertShiftPlanSlot(row: InsertShiftPlanSlot) {
  const db = await getDb();
  if (!db) throw new Error('DB unavailable');
  await db.insert(shiftPlanSlots).values(row).onDuplicateKeyUpdate({ set: row });
}

export async function deleteShiftPlanSlot(id: string) {
  const db = await getDb();
  if (!db) throw new Error('DB unavailable');
  await db.delete(shiftPlanSlots).where(eq(shiftPlanSlots.id, id));
}

// ─── Provider Assignments ─────────────────────────────────────────────────────

export async function getProviderAssignments(providerId?: string) {
  const db = await getDb();
  if (!db) return [];
  if (providerId) return db.select().from(providerAssignments).where(eq(providerAssignments.providerId, providerId));
  return db.select().from(providerAssignments);
}

export async function upsertProviderAssignment(row: InsertProviderAssignment) {
  const db = await getDb();
  if (!db) throw new Error('DB unavailable');
  await db.insert(providerAssignments).values(row).onDuplicateKeyUpdate({ set: row });
}

export async function deleteProviderAssignment(id: string) {
  const db = await getDb();
  if (!db) throw new Error('DB unavailable');
  await db.delete(providerAssignments).where(eq(providerAssignments.id, id));
}

// ─── Shift Occurrences ────────────────────────────────────────────────────────

export async function getShiftOccurrences(assignmentId?: string) {
  const db = await getDb();
  if (!db) return [];
  if (assignmentId) return db.select().from(shiftOccurrences).where(eq(shiftOccurrences.assignmentId, assignmentId));
  return db.select().from(shiftOccurrences);
}

export async function upsertShiftOccurrence(row: InsertShiftOccurrence) {
  const db = await getDb();
  if (!db) throw new Error('DB unavailable');
  await db.insert(shiftOccurrences).values(row).onDuplicateKeyUpdate({ set: row });
}

export async function deleteShiftOccurrence(id: string) {
  const db = await getDb();
  if (!db) throw new Error('DB unavailable');
  await db.delete(shiftOccurrences).where(eq(shiftOccurrences.id, id));
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export async function getAppointments(providerId?: string) {
  const db = await getDb();
  if (!db) return [];
  if (providerId) return db.select().from(appointments).where(eq(appointments.providerId, providerId)).orderBy(desc(appointments.date));
  return db.select().from(appointments).orderBy(desc(appointments.date));
}

export async function getAppointment(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  return rows[0];
}

export async function upsertAppointment(row: InsertAppointment) {
  const db = await getDb();
  if (!db) throw new Error('DB unavailable');
  await db.insert(appointments).values(row).onDuplicateKeyUpdate({ set: row });
}

export async function deleteAppointment(id: string) {
  const db = await getDb();
  if (!db) throw new Error('DB unavailable');
  await db.delete(appointments).where(eq(appointments.id, id));
}

// ─── Provider with schedule info ──────────────────────────────────────────────
/**
 * Returns all providers enriched with shiftPlanIds derived from their
 * active provider_assignments → shift_plan_slots → shift_plans chain.
 * This is the shape the client-side scheduler engine expects.
 */
export async function getProvidersWithSchedule() {
  const db = await getDb();
  if (!db) return [];
  const allProviders = await db.select().from(providers);
  const allAssignments = await db.select().from(providerAssignments);
  const allSlots = await db.select().from(shiftPlanSlots);
  const allHolidayDates = await db.select().from(holidayDates);
  const allPtoEntries = await db.select().from(ptoEntries);

  return allProviders.map((p) => {
    const assignments = allAssignments.filter((a) => a.providerId === p.id);
    const planIds = Array.from(new Set(
      assignments
        .map((a) => allSlots.find((s) => s.id === a.shiftPlanSlotId)?.shiftPlanId)
        .filter((id): id is string => Boolean(id))
    ));
    const provHolidays = allHolidayDates.filter((h) => h.calendarId === p.holidayCalendarId);
    const provPto = allPtoEntries.filter((e) => e.calendarId === p.ptoCalendarId);
    return {
      ...p,
      shiftPlanIds: planIds,
      currentShiftId: planIds[0] ?? "",
      holidayDates: provHolidays,
      ptoEntries: provPto,
    };
  });
}
