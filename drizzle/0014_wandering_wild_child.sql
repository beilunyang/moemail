CREATE TABLE `card_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`email_address` text NOT NULL,
	`is_used` integer DEFAULT false NOT NULL,
	`used_by` text,
	`used_at` integer,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`used_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `card_keys_code_unique` ON `card_keys` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `card_keys_email_address_unique` ON `card_keys` (`email_address`);--> statement-breakpoint
CREATE TABLE `temp_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`card_key_id` text NOT NULL,
	`email_address` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`card_key_id`) REFERENCES `card_keys`(`id`) ON UPDATE no action ON DELETE cascade
);
