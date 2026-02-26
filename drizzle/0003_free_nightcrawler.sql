ALTER TABLE `shift_templates` ADD `endTime` varchar(5) DEFAULT '17:00' NOT NULL;--> statement-breakpoint
ALTER TABLE `shift_templates` ADD `segmentsJson` text;