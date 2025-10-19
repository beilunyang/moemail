/*
 * Drizzle 自动生成的迁移文件
 * 用于创建 email_domain 表，存储域名和对应的 Resend 配置
 */

CREATE TABLE `email_domain` (
    `id` text PRIMARY KEY NOT NULL,
    `domain` text NOT NULL,
    `resend_api_key` text,
    `resend_enabled` integer NOT NULL DEFAULT false,
    `created_at` integer NOT NULL DEFAULT (cast(strftime('%s', 'now') * 1000 as int))
);
--> statement-breakpoint
CREATE INDEX `email_domain_domain_idx` ON `email_domain` (`domain`);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_domain_domain_unique` ON `email_domain` (`domain`);