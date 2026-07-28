CREATE TABLE `blood_donations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`donation_date` text NOT NULL,
	`donation_type` text DEFAULT 'whole_blood' NOT NULL,
	`notes` text,
	`dependent_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`dependent_id`) REFERENCES `dependents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_blood_donations_user_date` ON `blood_donations` (`user_id`,"donation_date" desc);--> statement-breakpoint
CREATE INDEX `idx_blood_donations_dependent` ON `blood_donations` (`dependent_id`);--> statement-breakpoint
CREATE TABLE `medication_dose_periods` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`compound` text NOT NULL,
	`dose` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text,
	`notes` text,
	`dependent_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`dependent_id`) REFERENCES `dependents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_dose_periods_user_compound` ON `medication_dose_periods` (`user_id`,`compound`,"start_date" desc);--> statement-breakpoint
CREATE INDEX `idx_dose_periods_dependent` ON `medication_dose_periods` (`dependent_id`);--> statement-breakpoint
CREATE INDEX `idx_dose_periods_open` ON `medication_dose_periods` (`user_id`,`dependent_id`,`end_date`);