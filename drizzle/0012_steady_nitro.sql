CREATE INDEX `email_expires_at_idx` ON `email` (`expires_at`);--> statement-breakpoint
CREATE INDEX `message_email_id_idx` ON `message` (`emailId`);