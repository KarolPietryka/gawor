CREATE TABLE `audio_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`practice_set_id` text NOT NULL,
	`content_hash` text NOT NULL,
	`status` text NOT NULL,
	`file_url` text,
	`voice` text DEFAULT 'de-DE-KatjaNeural' NOT NULL,
	`pause_multiplier_milli` integer DEFAULT 1500 NOT NULL,
	`duration_ms` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`practice_set_id`) REFERENCES `practice_sets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_audio_assets_practice_set` ON `audio_assets` (`practice_set_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `practice_set_sentences` (
	`practice_set_id` text NOT NULL,
	`sentence_id` text NOT NULL,
	`position` integer NOT NULL,
	PRIMARY KEY(`practice_set_id`, `sentence_id`),
	FOREIGN KEY (`practice_set_id`) REFERENCES `practice_sets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sentence_id`) REFERENCES `sentences`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_practice_set_position` ON `practice_set_sentences` (`practice_set_id`,`position`);--> statement-breakpoint
CREATE TABLE `practice_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`title` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_practice_sets_session_id` ON `practice_sets` (`session_id`);--> statement-breakpoint
CREATE TABLE `sentences` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`german` text NOT NULL,
	`polish` text DEFAULT '' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`text_hash` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_sentences_session_id` ON `sentences` (`session_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_sentences_session_hash` ON `sentences` (`session_id`,`text_hash`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_created_at` ON `sessions` (`created_at`);--> statement-breakpoint
CREATE TABLE `vocabulary` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`german` text NOT NULL,
	`polish` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_vocabulary_session_german` ON `vocabulary` (`session_id`,`german`);