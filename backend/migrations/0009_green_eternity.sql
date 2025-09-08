CREATE TYPE "public"."creator_transaction_status" AS ENUM('pending', 'completed', 'processing', 'failed');--> statement-breakpoint
CREATE TYPE "public"."creator_transaction_type" AS ENUM('earning', 'withdrawal', 'bonus');--> statement-breakpoint
CREATE TYPE "public"."earning_source" AS ENUM('chapter_purchase', 'comic_purchase', 'tip_received', 'subscription_revenue', 'platform_bonus');--> statement-breakpoint
CREATE TYPE "public"."spend_category" AS ENUM('chapter_unlock', 'comic_purchase', 'tip_creator', 'subscription');--> statement-breakpoint
CREATE TYPE "public"."user_transaction_status" AS ENUM('pending', 'completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."user_transaction_type" AS ENUM('purchase', 'spend', 'refund');--> statement-breakpoint
CREATE TABLE "creator_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"transaction_type" "creator_transaction_type" NOT NULL,
	"status" "creator_transaction_status" DEFAULT 'pending' NOT NULL,
	"nwt_amount" numeric(10, 6) NOT NULL,
	"description" text NOT NULL,
	"earning_source" "earning_source",
	"content_id" uuid,
	"purchaser_user_id" uuid,
	"source_user_transaction_id" uuid,
	"gross_amount" numeric(10, 6),
	"platform_fee" numeric(10, 6),
	"platform_fee_percentage" numeric(5, 4) DEFAULT '0.30',
	"withdrawal_method" varchar(100),
	"withdrawal_address" text,
	"withdrawal_fee" numeric(10, 6),
	"external_transaction_id" varchar(255),
	"processed_at" timestamp,
	"failure_reason" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"transaction_type" "user_transaction_type" NOT NULL,
	"status" "user_transaction_status" DEFAULT 'pending' NOT NULL,
	"nwt_amount" numeric(10, 6) NOT NULL,
	"usd_amount" numeric(10, 2),
	"description" text NOT NULL,
	"spend_category" "spend_category",
	"content_id" uuid,
	"creator_id" uuid,
	"helio_payment_id" varchar(255),
	"helio_webhook_id" varchar(255),
	"blockchain_tx_hash" varchar(255),
	"metadata" jsonb,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reader_id" uuid NOT NULL,
	"comic_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "creator_transactions" ADD CONSTRAINT "creator_transactions_creator_id_creator_profile_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creator_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_transactions" ADD CONSTRAINT "creator_transactions_source_user_transaction_id_user_transactions_id_fk" FOREIGN KEY ("source_user_transaction_id") REFERENCES "public"."user_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_transactions" ADD CONSTRAINT "user_transactions_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library" ADD CONSTRAINT "library_reader_id_reader_profile_id_fk" FOREIGN KEY ("reader_id") REFERENCES "public"."reader_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library" ADD CONSTRAINT "library_comic_id_comics_id_fk" FOREIGN KEY ("comic_id") REFERENCES "public"."comics"("id") ON DELETE cascade ON UPDATE no action;