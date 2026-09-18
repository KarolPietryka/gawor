ALTER TABLE `audio_assets` ADD `object_key` text;--> statement-breakpoint
ALTER TABLE `audio_assets` ADD `manifest_json` text;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_audio_assets_set_content` ON `audio_assets` (`practice_set_id`,`content_hash`);