CREATE TABLE "release_fetch_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trigger" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"technologies_scanned" integer DEFAULT 0 NOT NULL,
	"releases_inserted" integer DEFAULT 0 NOT NULL,
	"errors" integer DEFAULT 0 NOT NULL,
	"details" jsonb,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "release_updates" ADD COLUMN "summary_model" text;--> statement-breakpoint
ALTER TABLE "release_updates" ADD COLUMN "summarized_at" timestamp;--> statement-breakpoint
ALTER TABLE "release_updates" ADD COLUMN "raw_release_body" text;--> statement-breakpoint
ALTER TABLE "release_updates" ADD COLUMN "is_prerelease" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "release_fetch_runs_started_idx" ON "release_fetch_runs" USING btree ("started_at" DESC);--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "subscription_status";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "lemonsqueezy_customer_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "lemonsqueezy_subscription_id";--> statement-breakpoint
DROP TYPE "public"."subscription_status";