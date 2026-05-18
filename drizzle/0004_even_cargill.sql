CREATE TABLE "digest_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"stack_slug" text,
	"source" text DEFAULT 'public' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "digest_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "release_updates" ADD COLUMN "security_notes" jsonb;