CREATE TABLE `schedule-finder_course` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`course_code` text(50) NOT NULL,
	`course_name` text(255) NOT NULL,
	`teacher_name` text(255) NOT NULL,
	`room_number` text(50),
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `course_code_idx` ON `schedule-finder_course` (`course_code`);--> statement-breakpoint
CREATE INDEX `teacher_idx` ON `schedule-finder_course` (`teacher_name`);--> statement-breakpoint
CREATE TABLE `schedule-finder_enrollment` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`schedule_id` integer NOT NULL,
	`course_id` integer NOT NULL,
	`period` integer NOT NULL,
	`day_type` text(10) NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`schedule_id`) REFERENCES `schedule-finder_schedule`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `schedule-finder_course`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `schedule_idx` ON `schedule-finder_enrollment` (`schedule_id`);--> statement-breakpoint
CREATE INDEX `course_idx` ON `schedule-finder_enrollment` (`course_id`);--> statement-breakpoint
CREATE INDEX `period_day_idx` ON `schedule-finder_enrollment` (`period`,`day_type`);--> statement-breakpoint
CREATE TABLE `schedule-finder_post` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(256),
	`createdById` text(255) NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`createdById`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `created_by_idx` ON `schedule-finder_post` (`createdById`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `schedule-finder_post` (`name`);--> statement-breakpoint
CREATE TABLE `schedule-finder_schedule` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text(255) NOT NULL,
	`image_url` text,
	`initial_validation_confidence` real,
	`final_validation_confidence` real,
	`is_valid` integer NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_idx` ON `schedule-finder_schedule` (`userId`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `schedule-finder_schedule` (`createdAt`);--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
