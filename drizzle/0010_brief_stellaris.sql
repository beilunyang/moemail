CREATE UNIQUE INDEX `api_keys_name_unique` ON `api_keys` (`name`);--> statement-breakpoint
ALTER TABLE `api_keys` DROP COLUMN `last_used_at`;