CREATE TABLE `vacation_expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vacation_id` integer NOT NULL,
	`bezeichnung` text DEFAULT '' NOT NULL,
	`betrag` real NOT NULL,
	`datum` text,
	FOREIGN KEY (`vacation_id`) REFERENCES `vacations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `vacations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`datum` text
);
