ALTER TABLE `message` ADD `is_read` integer DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX `message_email_id_type_read_idx` ON `message` (`emailId`,`type`,`is_read`);--> statement-breakpoint
ALTER TABLE `user` ADD `allowed_email_domains` text;--> statement-breakpoint
CREATE INDEX `email_user_domain_created_at_idx` ON `email` (`userId`, LOWER(SUBSTR("address", INSTR("address", '@') + 1)), `created_at`, `id`);
