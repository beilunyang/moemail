PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_message` (
	`id` text PRIMARY KEY NOT NULL,
	`emailId` text NOT NULL,
	`from_address` text,
	`to_address` text,
	`subject` text NOT NULL,
	`content` text NOT NULL,
	`html` text,
	`type` text,
	`received_at` integer NOT NULL,
	`sent_at` integer NOT NULL,
	FOREIGN KEY (`emailId`) REFERENCES `email`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_message`("id", "emailId", "from_address", "to_address", "subject", "content", "html", "type", "received_at", "sent_at") SELECT "id", "emailId", "from_address", "to_address", "subject", "content", "html", "type", "received_at", "sent_at" FROM `message`;--> statement-breakpoint
DROP TABLE `message`;--> statement-breakpoint
ALTER TABLE `__new_message` RENAME TO `message`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `message_email_id_idx` ON `message` (`emailId`);