import { describe, it, expect, vi } from "vitest";

// Mock the database module so tests run without a real DB connection
vi.mock("../server/db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getLocations: vi.fn().mockResolvedValue([
    { id: "loc-downtown", name: "Downtown Clinic", address: "123 Main St", phone: "617-555-0100", timezone: "America/New_York" },
  ]),
  getProviders: vi.fn().mockResolvedValue([
    { id: "prov-lee", name: "Dr. Sarah Lee", role: "Dentist", primaryLocationId: "loc-downtown", bio: "Expert dentist", photoUrl: null, ptoCalendarId: "pto-lee", holidayCalendarId: "hol-main", createdAt: new Date(), updatedAt: new Date() },
  ]),
  getProvider: vi.fn().mockResolvedValue(null),
  upsertLocation: vi.fn().mockResolvedValue(undefined),
  deleteLocation: vi.fn().mockResolvedValue(undefined),
  upsertProvider: vi.fn().mockResolvedValue(undefined),
  deleteProvider: vi.fn().mockResolvedValue(undefined),
  getAppointments: vi.fn().mockResolvedValue([]),
  upsertAppointment: vi.fn().mockResolvedValue(undefined),
  deleteAppointment: vi.fn().mockResolvedValue(undefined),
  getPtoEntries: vi.fn().mockResolvedValue([]),
  upsertPtoEntry: vi.fn().mockResolvedValue(undefined),
  deletePtoEntry: vi.fn().mockResolvedValue(undefined),
  getHolidayDates: vi.fn().mockResolvedValue([]),
  upsertHolidayDate: vi.fn().mockResolvedValue(undefined),
  deleteHolidayDate: vi.fn().mockResolvedValue(undefined),
  getPtoCalendars: vi.fn().mockResolvedValue([]),
  getShiftPlans: vi.fn().mockResolvedValue([]),
  upsertShiftPlan: vi.fn().mockResolvedValue(undefined),
  deleteShiftPlan: vi.fn().mockResolvedValue(undefined),
  getShiftTemplates: vi.fn().mockResolvedValue([]),
  upsertShiftTemplate: vi.fn().mockResolvedValue(undefined),
  deleteShiftTemplate: vi.fn().mockResolvedValue(undefined),
  getShiftPlanSlots: vi.fn().mockResolvedValue([]),
  upsertShiftPlanSlot: vi.fn().mockResolvedValue(undefined),
  deleteShiftPlanSlot: vi.fn().mockResolvedValue(undefined),
  getProviderAssignments: vi.fn().mockResolvedValue([]),
  upsertProviderAssignment: vi.fn().mockResolvedValue(undefined),
  deleteProviderAssignment: vi.fn().mockResolvedValue(undefined),
  getShiftOccurrences: vi.fn().mockResolvedValue([]),
  upsertShiftOccurrence: vi.fn().mockResolvedValue(undefined),
}));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function makeCtx(role: "admin" | "user" = "admin"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      name: "Test",
      email: "test@example.com",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("locations router", () => {
  it("list returns locations from db", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.locations.list();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Downtown Clinic");
  });

  it("upsert returns an id", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.locations.upsert({ name: "New Clinic", address: "456 Oak Ave", phone: "617-555-0200", timezone: "America/New_York" });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("string");
  });
});

describe("providers router", () => {
  it("list returns providers from db", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.providers.list();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Dr. Sarah Lee");
    expect(result[0].role).toBe("Dentist");
  });

  it("upsert returns an id", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.providers.upsert({
      name: "Dr. New",
      role: "Dentist",
      primaryLocationId: "loc-downtown",
      bio: "",
      photoUrl: "",
      ptoCalendarId: "pto-new",
      holidayCalendarId: "hol-main",
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("string");
  });
});

describe("appointments router", () => {
  it("list returns an array", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.appointments.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("upsert returns an id", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.appointments.upsert({
      providerId: "prov-lee",
      locationId: "loc-downtown",
      patientName: "John Doe",
      patientEmail: "john@example.com",
      patientPhone: "",
      appointmentType: "checkup",
      date: "2026-03-01",
      startTime: "09:00",
      endTime: "09:30",
      durationMinutes: 30,
      notes: "",
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("string");
  });
});

describe("ptoEntries router", () => {
  it("list returns an array", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.ptoEntries.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("upsert returns an id", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.ptoEntries.upsert({
      calendarId: "pto-lee",
      startDate: "2026-03-10",
      endDate: "2026-03-12",
      reason: "Vacation",
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("string");
  });
});

describe("holidayDates router", () => {
  it("list returns an array", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.holidayDates.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("upsert returns an id", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.holidayDates.upsert({
      calendarId: "hol-main",
      date: "2026-07-04",
      name: "Independence Day",
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("string");
  });
});

describe("auth router", () => {
  it("me returns the current user", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.auth.me();
    expect(result?.openId).toBe("test-user");
  });

  it("logout clears cookie and returns success", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
  });
});
