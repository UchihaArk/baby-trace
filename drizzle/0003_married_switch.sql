CREATE TABLE `baby_vaccines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`baby_id` integer NOT NULL,
	`name` text NOT NULL,
	`dose` text,
	`vaccinated_at` integer NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`baby_id`) REFERENCES `babies`(`id`) ON UPDATE no action ON DELETE no action
);
