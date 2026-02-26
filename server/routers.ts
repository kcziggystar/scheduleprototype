import { z } from "zod";
import { nanoid } from "nanoid";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  getLocations, getLocation, upsertLocation, deleteLocation,
  getHolidayCalendars, getHolidayDates, upsertHolidayDate, deleteHolidayDate,
  getPtoCalendars, getPtoEntries, upsertPtoEntry, deletePtoEntry,
  getProviders, getProvider, upsertProvider, deleteProvider, getProvidersWithSchedule,
  getShiftTemplates, upsertShiftTemplate, deleteShiftTemplate,
  getShiftPlans, upsertShiftPlan, deleteShiftPlan,
  getShiftPlanSlots, upsertShiftPlanSlot, deleteShiftPlanSlot,
  getProviderAssignments, upsertProviderAssignment, deleteProviderAssignment,
  getShiftOccurrences, upsertShiftOccurrence, deleteShiftOccurrence,
  getAppointments, getAppointment, upsertAppointment, deleteAppointment,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  locations: router({
    list: publicProcedure.query(() => getLocations()),
    upsert: publicProcedure
      .input(z.object({ id: z.string().optional(), name: z.string(), address: z.string(), phone: z.string(), timezone: z.string().default("America/New_York") }))
      .mutation(async ({ input }) => { const id = input.id ?? `loc-${nanoid(8)}`; await upsertLocation({ ...input, id }); return { id }; }),
    delete: publicProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => deleteLocation(input.id)),
  }),

  holidayCalendars: router({
    list: publicProcedure.query(() => getHolidayCalendars()),
  }),

  holidayDates: router({
    list: publicProcedure.input(z.object({ calendarId: z.string().optional() })).query(({ input }) => getHolidayDates(input.calendarId)),
    upsert: publicProcedure
      .input(z.object({ id: z.string().optional(), calendarId: z.string(), date: z.string(), name: z.string() }))
      .mutation(async ({ input }) => { const id = input.id ?? `hd-${nanoid(8)}`; await upsertHolidayDate({ ...input, id }); return { id }; }),
    delete: publicProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => deleteHolidayDate(input.id)),
  }),

  ptoCalendars: router({
    list: publicProcedure.query(() => getPtoCalendars()),
  }),

  ptoEntries: router({
    list: publicProcedure.input(z.object({ calendarId: z.string().optional() })).query(({ input }) => getPtoEntries(input.calendarId)),
    upsert: publicProcedure
      .input(z.object({ id: z.string().optional(), calendarId: z.string(), startDate: z.string(), endDate: z.string(), startTime: z.string().nullable().optional(), endTime: z.string().nullable().optional(), reason: z.string().nullable().optional() }))
      .mutation(async ({ input }) => { const id = input.id ?? `pto-${nanoid(8)}`; await upsertPtoEntry({ ...input, id }); return { id }; }),
    delete: publicProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => deletePtoEntry(input.id)),
  }),

  providers: router({
    list: publicProcedure.query(() => getProviders()),
    listWithSchedule: publicProcedure.query(() => getProvidersWithSchedule()),
    get: publicProcedure.input(z.object({ id: z.string() })).query(({ input }) => getProvider(input.id)),
    upsert: publicProcedure
      .input(z.object({ id: z.string().optional(), name: z.string(), role: z.enum(["Dentist", "Hygienist"]), bio: z.string().nullable().optional(), photoUrl: z.string().nullable().optional(), primaryLocationId: z.string(), ptoCalendarId: z.string(), holidayCalendarId: z.string() }))
      .mutation(async ({ input }) => { const id = input.id ?? `prov-${nanoid(8)}`; await upsertProvider({ ...input, id }); return { id }; }),
    delete: publicProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => deleteProvider(input.id)),
  }),

  shiftTemplates: router({
    list: publicProcedure.query(() => getShiftTemplates()),
    upsert: publicProcedure
      .input(z.object({ id: z.string().optional(), name: z.string(), locationId: z.string(), weekDays: z.string(), startTime: z.string(), endTime: z.string().default("17:00"), duration: z.string(), segmentsJson: z.string().nullable().optional(), defaultRole: z.enum(["Dentist", "Hygienist"]), color: z.string().default("bg-sky-500") }))
      .mutation(async ({ input }) => { const id = input.id ?? `tmpl-${nanoid(8)}`; await upsertShiftTemplate({ ...input, id }); return { id }; }),
    delete: publicProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => deleteShiftTemplate(input.id)),
  }),

  shiftPlans: router({
    list: publicProcedure.query(() => getShiftPlans()),
    upsert: publicProcedure
      .input(z.object({ id: z.string().optional(), name: z.string(), shiftCycle: z.number().int(), shiftCycleUnit: z.string(), effectiveDate: z.string() }))
      .mutation(async ({ input }) => { const id = input.id ?? `plan-${nanoid(8)}`; await upsertShiftPlan({ ...input, id }); return { id }; }),
    delete: publicProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => deleteShiftPlan(input.id)),
  }),

  shiftPlanSlots: router({
    list: publicProcedure.input(z.object({ shiftPlanId: z.string().optional() })).query(({ input }) => getShiftPlanSlots(input.shiftPlanId)),
    upsert: publicProcedure
      .input(z.object({ id: z.string().optional(), shiftPlanId: z.string(), cycleIndex: z.number().int(), templateId: z.string() }))
      .mutation(async ({ input }) => { const id = input.id ?? `slot-${nanoid(8)}`; await upsertShiftPlanSlot({ ...input, id }); return { id }; }),
    delete: publicProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => deleteShiftPlanSlot(input.id)),
  }),

  providerAssignments: router({
    list: publicProcedure.input(z.object({ providerId: z.string().optional() })).query(({ input }) => getProviderAssignments(input.providerId)),
    listAll: publicProcedure.query(() => getProviderAssignments()),
    upsert: publicProcedure
      .input(z.object({ id: z.string().optional(), providerId: z.string(), shiftPlanSlotId: z.string(), effectiveDate: z.string(), endDate: z.string().nullable().optional() }))
      .mutation(async ({ input }) => { const id = input.id ?? `assign-${nanoid(8)}`; await upsertProviderAssignment({ ...input, id }); return { id }; }),
    delete: publicProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => deleteProviderAssignment(input.id)),
  }),

  shiftOccurrences: router({
    list: publicProcedure.input(z.object({ assignmentId: z.string().optional() })).query(({ input }) => getShiftOccurrences(input.assignmentId)),
    listAll: publicProcedure.query(() => getShiftOccurrences()),
    upsert: publicProcedure
      .input(z.object({ id: z.string().optional(), assignmentId: z.string(), date: z.string(), status: z.enum(["scheduled", "cancelled", "swapped"]).default("scheduled"), substituteProviderId: z.string().nullable().optional(), note: z.string().nullable().optional() }))
      .mutation(async ({ input }) => { const id = input.id ?? `occ-${nanoid(8)}`; await upsertShiftOccurrence({ ...input, id }); return { id }; }),
    delete: publicProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => deleteShiftOccurrence(input.id)),
  }),

  appointments: router({
    list: publicProcedure.input(z.object({ providerId: z.string().optional() })).query(({ input }) => getAppointments(input.providerId)),
    get: publicProcedure.input(z.object({ id: z.string() })).query(({ input }) => getAppointment(input.id)),
    upsert: publicProcedure
      .input(z.object({ id: z.string().optional(), providerId: z.string(), locationId: z.string(), patientName: z.string(), patientEmail: z.string().email(), patientPhone: z.string().nullable().optional(), appointmentType: z.string(), date: z.string(), startTime: z.string(), endTime: z.string(), durationMinutes: z.number().int(), notes: z.string().nullable().optional(), status: z.enum(["confirmed", "cancelled", "completed"]).default("confirmed") }))
      .mutation(async ({ input }) => { const id = input.id ?? `appt-${nanoid(8)}`; await upsertAppointment({ ...input, id }); return { id }; }),
    delete: publicProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => deleteAppointment(input.id)),
  }),
});

export type AppRouter = typeof appRouter;
