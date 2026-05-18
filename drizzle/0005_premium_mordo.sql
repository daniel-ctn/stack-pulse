CREATE INDEX "digest_subscribers_created_idx" ON "digest_subscribers" USING btree ("created_at" DESC);--> statement-breakpoint
CREATE INDEX "digest_subscribers_stack_idx" ON "digest_subscribers" USING btree ("stack_slug");--> statement-breakpoint
CREATE INDEX "release_updates_signals_idx" ON "release_updates" USING gin ("release_signals");