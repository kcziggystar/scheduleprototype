CREATE TABLE `appointments` (
	`id` varchar(64) NOT NULL,
	`providerId` varchar(64) NOT NULL,
	`locationId` varchar(64) NOT NULL,
	`patientName` varchar(128) NOT NULL,
	`patientEmail` varchar(320) NOT NULL,
	`patientPhone` varchar(32),
	`appointmentType` varchar(64) NOT NULL,
	`date` varchar(10) NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`durationMinutes` int NOT NULL,
	`notes` text,
	`appointmentStatus` enum('confirmed','cancelled','completed') NOT NULL DEFAULT 'confirmed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `holiday_calendars` (
	`id` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `holiday_calendars_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `holiday_dates` (
	`id` varchar(64) NOT NULL,
	`calendarId` varchar(64) NOT NULL,
	`date` varchar(10) NOT NULL,
	`name` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `holiday_dates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `locations` (
	`id` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`address` varchar(256) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`timezone` varchar(64) NOT NULL DEFAULT 'America/New_York',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `locations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `provider_assignments` (
	`id` varchar(64) NOT NULL,
	`providerId` varchar(64) NOT NULL,
	`shiftPlanSlotId` varchar(64) NOT NULL,
	`effectiveDate` varchar(10) NOT NULL,
	`endDate` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `provider_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `providers` (
	`id` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`providerRole` enum('Dentist','Hygienist') NOT NULL,
	`bio` text,
	`photoUrl` varchar(512),
	`primaryLocationId` varchar(64) NOT NULL,
	`ptoCalendarId` varchar(64) NOT NULL,
	`holidayCalendarId` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `providers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pto_calendars` (
	`id` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pto_calendars_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pto_entries` (
	`id` varchar(64) NOT NULL,
	`calendarId` varchar(64) NOT NULL,
	`startDate` varchar(10) NOT NULL,
	`endDate` varchar(10) NOT NULL,
	`startTime` varchar(5),
	`endTime` varchar(5),
	`reason` varchar(256),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pto_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shift_occurrences` (
	`id` varchar(64) NOT NULL,
	`assignmentId` varchar(64) NOT NULL,
	`date` varchar(10) NOT NULL,
	`occurrenceStatus` enum('scheduled','cancelled','swapped') NOT NULL DEFAULT 'scheduled',
	`substituteProviderId` varchar(64),
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shift_occurrences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shift_plan_slots` (
	`id` varchar(64) NOT NULL,
	`shiftPlanId` varchar(64) NOT NULL,
	`cycleIndex` int NOT NULL DEFAULT 1,
	`templateId` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shift_plan_slots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shift_plans` (
	`id` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`shiftCycle` int NOT NULL DEFAULT 1,
	`shiftCycleUnit` varchar(32) NOT NULL DEFAULT 'Week(s)',
	`effectiveDate` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shift_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shift_templates` (
	`id` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`locationId` varchar(64) NOT NULL,
	`weekDays` varchar(128) NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`duration` varchar(16) NOT NULL,
	`defaultRole` enum('Dentist','Hygienist') NOT NULL,
	`color` varchar(64) NOT NULL DEFAULT 'bg-sky-500',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shift_templates_id` PRIMARY KEY(`id`)
);
