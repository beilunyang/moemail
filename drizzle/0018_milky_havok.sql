-- fix: 优化迁移脚本，改为非破坏性迁移
-- 原始脚本会重建表，可能导致数据丢失
-- 由于只是添加一个带默认值(true)的 NOT NULL 字段，SQLite 支持直接 ALTER TABLE
ALTER TABLE `user` ADD COLUMN `status` integer DEFAULT true NOT NULL;

--> statement-breakpoint
-- 原始的破坏性迁移已被替换为上面的安全版本
/*
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
*/