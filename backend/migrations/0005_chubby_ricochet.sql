CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"date" timestamp NOT NULL,
	"ticket_price" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid,
	"user_id" uuid,
	"payment_method" text NOT NULL,
	"amount" numeric NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "creator_profile" RENAME COLUMN "genre" TO "genres";--> statement-breakpoint
ALTER TABLE "reader_profile" RENAME COLUMN "genre" TO "genres";--> statement-breakpoint
ALTER TABLE "auth_users" ALTER COLUMN "last_login_at" SET DEFAULT null;--> statement-breakpoint
ALTER TABLE "auth_users" ALTER COLUMN "locked_until" SET DEFAULT null;--> statement-breakpoint
ALTER TABLE "reader_profile" ALTER COLUMN "pin_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_profile" ADD COLUMN "wallet_balance" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "reader_profile" ADD COLUMN "wallet_balance" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;