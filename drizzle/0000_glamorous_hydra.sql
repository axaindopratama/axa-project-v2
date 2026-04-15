CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`project_id` text,
	`action` text NOT NULL,
	`table_name` text NOT NULL,
	`record_id` text,
	`old_value` text,
	`new_value` text,
	`created_at` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `company_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`company_name` text,
	`company_address` text,
	`company_phone` text,
	`company_email` text,
	`company_npwp` text,
	`company_subtitle` text,
	`logo` text,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `entities` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`contact` text,
	`email` text,
	`phone` text,
	`address` text,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`is_read` integer DEFAULT false,
	`created_at` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `project_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`hourly_rate` integer DEFAULT 150000,
	`alert_threshold_warning` integer DEFAULT 60,
	`alert_threshold_critical` integer DEFAULT 80,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_settings_project_id_unique` ON `project_settings` (`project_id`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`number` text NOT NULL,
	`name` text NOT NULL,
	`budget` integer NOT NULL,
	`status` text DEFAULT 'planning' NOT NULL,
	`hourly_rate` integer DEFAULT 150000 NOT NULL,
	`start_date` text,
	`end_date` text,
	`created_by` text,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_number_unique` ON `projects` (`number`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'todo' NOT NULL,
	`est_cost` integer DEFAULT 0,
	`act_cost` integer DEFAULT 0,
	`hours` real DEFAULT 0,
	`started_at` text,
	`completed_at` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transaction_items` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`description` text NOT NULL,
	`qty` integer DEFAULT 1 NOT NULL,
	`unit_price` integer NOT NULL,
	`total_price` integer NOT NULL,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`entity_id` text,
	`date` text NOT NULL,
	`amount` integer NOT NULL,
	`type` text NOT NULL,
	`payment_status` text DEFAULT 'lunas' NOT NULL,
	`paid_amount` integer DEFAULT 0,
	`due_date` text,
	`paid_date` text,
	`payment_method` text,
	`receipt_url` text,
	`notes` text,
	`created_at` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`entity_id`) REFERENCES `entities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`supabase_user_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`avatar` text,
	`phone` text,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_supabase_user_id_unique` ON `users` (`supabase_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);