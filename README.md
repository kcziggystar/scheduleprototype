# BrightSmiles Dental Group — Scheduling Prototype

A full-stack web prototype for managing provider schedules and patient appointment booking across a multi-location dental group. Built with React, tRPC, Express, and a persistent MySQL database.

---

## What This Is

BrightSmiles is a scheduling prototype that models the real-world complexity of a dental group practice. It covers two distinct user experiences:

- **Patients** can browse providers, check availability, and book appointments through a guided 5-step wizard.
- **Admins** can manage every layer of the scheduling system — locations, providers, shift templates, rotation plans, provider assignments, PTO, and holidays — through a dedicated portal.

---

## Key Features

### Patient Booking Flow
- 5-step wizard: appointment type → provider → date → time → patient details → confirmation
- Live availability calendar with colour-coded dates (available, holiday, PTO, no shift)
- Optional location filter when choosing a provider
- Appointments saved to the database on confirmation

### Admin Portal
| Section | What you can do |
|---|---|
| **Dashboard** | Overview of providers, locations, and upcoming appointments |
| **Providers** | Add, edit, and remove dental providers |
| **Locations** | Manage clinic locations and contact details |
| **Appointments** | View all booked appointments, filter by provider or date |
| **PTO Editor** | Add, edit, and delete PTO entries per provider (full-day or partial) |
| **Holiday Calendar** | Manage public holidays that block all bookings |
| **Shift Templates** | Create reusable shift shapes (days, times, location, role) |
| **Plan Builder** | Assemble templates into named rotation cycles (e.g. 2-week A/B) |
| **Assignments** | Assign providers to plan slots with effective date ranges |
| **Schedule Grid** | Weekly/monthly calendar of generated shift occurrences; cancel or swap individual days |

### Scheduling Engine
- 2-week rotation cycle (Week A / Week B) with configurable shift plans
- Shift segment expansion and slot chopping by appointment duration
- Holiday subtraction and PTO blocking (full-day and partial-day)
- Slot availability computed on the fly from assignments — no pre-generated rows

---

## Data Architecture

The system is built around three conceptual layers:

```
Location ◄──────────────── ShiftTemplate
    ▲                            │
    │                       ShiftPlanSlot ──► ShiftPlan
    │                            │
Provider ──► ProviderAssignment ─┘
    │              │
    │         ShiftOccurrence (override)
    │
    ├──► PtoCalendar ──► PtoEntry
    └──► HolidayCalendar ──► HolidayDate
```

| Layer | Description |
|---|---|
| **ShiftTemplate** | The shape of a shift — days, times, location, role. Provider-agnostic and reusable. |
| **ShiftPlan / ShiftPlanSlot** | A named rotation cycle that assembles templates by cycle week. |
| **ProviderAssignment** | Links a provider to a plan slot with an effective date range. |
| **ShiftOccurrence** | Persisted exceptions only (cancellations, swaps). Occurrences are otherwise generated on the fly. |
| **PtoEntry** | Blocks a provider's availability for a date range (full or partial day). |
| **HolidayDate** | Blocks all providers on a shared calendar for a full day. |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Tailwind CSS 4, shadcn/ui, Wouter (routing) |
| API | tRPC 11 (end-to-end type-safe procedures) |
| Backend | Express 4, Node.js |
| Database | MySQL / TiDB via Drizzle ORM |
| Auth | Manus OAuth (session cookie) |
| Testing | Vitest (13 tests covering all major routers) |

---

## Project Structure

```
client/
  src/
    pages/          ← All page components (Home, Book, Admin*, ...)
    components/     ← Shared UI (Layout, TopNav, shadcn/ui)
    lib/
      data.ts       ← Static reference data (appointment types, legacy seed types)
      scheduler.ts  ← Slot-finding engine (availability logic)
      trpc.ts       ← tRPC client binding
drizzle/
  schema.ts         ← All 13 database table definitions
  migrations/       ← Generated migration files
server/
  db.ts             ← All database query helpers
  routers.ts        ← All tRPC procedures (CRUD for every entity)
  seed.mjs          ← One-time seed script for sample data
  brightsmiles.test.ts ← Vitest tests for all routers
```

---

## Getting Started

### Prerequisites
- Node.js 22+
- pnpm
- A MySQL-compatible database (connection string in `DATABASE_URL`)

### Install dependencies
```bash
pnpm install
```

### Push the database schema
```bash
pnpm db:push
```

### Seed sample data (first run only)
```bash
npx tsx server/seed.mjs
```

### Start the development server
```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

### Run tests
```bash
pnpm test
```

### Type-check
```bash
pnpm check
```

---

## Environment Variables

The following environment variables are required:

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `JWT_SECRET` | Secret used to sign session cookies |
| `VITE_APP_ID` | Manus OAuth application ID |
| `OAUTH_SERVER_URL` | Manus OAuth backend base URL |
| `VITE_OAUTH_PORTAL_URL` | Manus login portal URL (frontend) |

---

## Roadmap

The following features are identified as high-value next steps:

- **Patient reschedule / cancel flow** — let patients look up their booking by email and confirmation code, modify the date/time, or cancel, automatically freeing the slot.
- **Conflict detection** — when PTO is added or a shift is cancelled, warn admins of any existing appointments in that window with a list of affected patients.
- **Print / export schedule** — download the weekly roster as a PDF or CSV from the Schedule Grid.
- **Role-based access control** — separate admin and read-only staff roles within the portal.
- **Email confirmations** — send automated booking confirmation and reminder emails to patients.

---

## Notes

This is a prototype intended for demonstration and development purposes. It is not intended for clinical use. Patient data entered during testing should be fictitious.
