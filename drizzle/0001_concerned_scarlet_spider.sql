DROP INDEX `users_email_unique`;--> statement-breakpoint
ALTER TABLE `users` ADD `company_id` text;--> statement-breakpoint
ALTER TABLE `tasks` ADD `assigned_to` text REFERENCES entities(id);