CREATE TABLE "user_webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"url" text NOT NULL,
	"min_importance" "importance_level" DEFAULT 'high' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_webhooks_user_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "user_webhooks" ADD CONSTRAINT "user_webhooks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;