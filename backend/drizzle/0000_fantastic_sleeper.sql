CREATE TABLE `match_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`player_id` text NOT NULL,
	`team` text NOT NULL,
	`role` text,
	`is_captain` integer DEFAULT false,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`game_mode` text NOT NULL,
	`status` text DEFAULT 'IN_PROGRESS' NOT NULL,
	`winner` text,
	`duration` integer,
	`notes` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`completed_at` integer
);
--> statement-breakpoint
CREATE TABLE `player_stats` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`total_matches` integer DEFAULT 0 NOT NULL,
	`wins` integer DEFAULT 0 NOT NULL,
	`losses` integer DEFAULT 0 NOT NULL,
	`win_rate` real DEFAULT 0 NOT NULL,
	`games_as_top` integer DEFAULT 0 NOT NULL,
	`games_as_jungle` integer DEFAULT 0 NOT NULL,
	`games_as_mid` integer DEFAULT 0 NOT NULL,
	`games_as_adc` integer DEFAULT 0 NOT NULL,
	`games_as_support` integer DEFAULT 0 NOT NULL,
	`games_as_captain` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`preferred_role` text,
	`rank` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `player_stats_player_id_unique` ON `player_stats` (`player_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `players_name_unique` ON `players` (`name`);