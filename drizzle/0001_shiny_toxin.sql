PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_schedule-finder_course` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`course_code` text(50),
	`course_name` text(255) NOT NULL,
	`teacher_name` text(255) NOT NULL,
	`room_number` text(50),
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_schedule-finder_course`("id", "course_code", "course_name", "teacher_name", "room_number", "createdAt") SELECT "id", "course_code", "course_name", "teacher_name", "room_number", "createdAt" FROM `schedule-finder_course`;--> statement-breakpoint
DROP TABLE `schedule-finder_course`;--> statement-breakpoint
ALTER TABLE `__new_schedule-finder_course` RENAME TO `schedule-finder_course`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `course_code_idx` ON `schedule-finder_course` (`course_code`);--> statement-breakpoint
CREATE INDEX `teacher_idx` ON `schedule-finder_course` (`teacher_name`);--> statement-breakpoint
CREATE INDEX `room_idx` ON `schedule-finder_course` (`room_number`);--> statement-breakpoint
ALTER TABLE `schedule-finder_schedule` DROP COLUMN `initial_validation_confidence`;--> statement-breakpoint
ALTER TABLE `schedule-finder_schedule` DROP COLUMN `final_validation_confidence`;--> statement-breakpoint
ALTER TABLE `schedule-finder_schedule` DROP COLUMN `is_valid`;