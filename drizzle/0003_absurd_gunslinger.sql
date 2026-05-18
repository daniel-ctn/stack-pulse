ALTER TABLE "release_updates" ADD COLUMN "deprecations" jsonb;--> statement-breakpoint
ALTER TABLE "release_updates" ADD COLUMN "migration_steps" jsonb;--> statement-breakpoint
ALTER TABLE "release_updates" ADD COLUMN "impact_summary" text;--> statement-breakpoint
ALTER TABLE "release_updates" ADD COLUMN "recommended_action" text;--> statement-breakpoint
ALTER TABLE "release_updates" ADD COLUMN "release_signals" jsonb;