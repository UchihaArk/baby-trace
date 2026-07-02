ALTER TABLE `babies` ADD `access_code_hash` text;--> statement-breakpoint
ALTER TABLE `babies` ADD `access_code_version` integer DEFAULT 0 NOT NULL;