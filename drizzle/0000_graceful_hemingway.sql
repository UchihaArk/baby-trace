CREATE TABLE `babies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`birth_date` text NOT NULL,
	`gender` text,
	`avatar_emoji` text NOT NULL,
	`avatar_color` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `baby_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`baby_id` integer NOT NULL,
	`activity_type` text NOT NULL,
	`start_time` integer NOT NULL,
	`end_time` integer,
	`amount` integer,
	`details` text,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`baby_id`) REFERENCES `babies`(`id`) ON UPDATE no action ON DELETE no action
);
