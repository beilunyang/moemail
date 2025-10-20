CREATE TABLE `new_user` (
	`id` text PRIMARY KEY NOT NULL DEFAULT (crypto_randomuuid()),
	`name` text,
	`email` text,
	`emailVerified` integer,
	`image` text,
	`username` text,
	`password` text,
	`status` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
INSERT INTO `new_user` (`id`, `name`, `email`, `emailVerified`, `image`, `username`, `password`) SELECT `id`, `name`, `email`, `emailVerified`, `image`, `username`, `password` FROM `user`;
--> statement-breakpoint
DROP TABLE `user`;
--> statement-breakpoint
ALTER TABLE `new_user` RENAME TO `user`;
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);