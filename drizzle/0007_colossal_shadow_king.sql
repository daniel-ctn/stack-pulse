ALTER TABLE "digest_subscribers" ADD COLUMN "unsubscribe_token" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "digest_subscribers" ADD COLUMN "last_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "digest_subscribers" ADD CONSTRAINT "digest_subscribers_unsubscribe_token_unique" UNIQUE("unsubscribe_token");