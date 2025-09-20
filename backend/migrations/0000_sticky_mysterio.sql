CREATE TYPE "public"."wallet_type_enum" AS ENUM('solflare', 'phantom');--> statement-breakpoint
CREATE TYPE "public"."comic_status_enum" AS ENUM('published', 'pending', 'scheduled', 'draft');--> statement-breakpoint
CREATE TYPE "public"."chapter_type" AS ENUM('free', 'paid');--> statement-breakpoint
CREATE TYPE "public"."creator_transaction_status" AS ENUM('pending', 'completed', 'processing', 'failed');--> statement-breakpoint
CREATE TYPE "public"."creator_transaction_type" AS ENUM('earning', 'withdrawal', 'bonus');--> statement-breakpoint
CREATE TYPE "public"."earning_source" AS ENUM('chapter_purchase', 'comic_purchase', 'tip_received', 'subscription_revenue', 'platform_bonus');--> statement-breakpoint
CREATE TYPE "public"."spend_category" AS ENUM('chapter_unlock', 'comic_purchase', 'tip_creator', 'subscription');--> statement-breakpoint
CREATE TYPE "public"."user_transaction_status" AS ENUM('pending', 'completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."user_transaction_type" AS ENUM('purchase', 'spend', 'refund');--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"ip_address" text NOT NULL,
	"user_agent" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "auth_sessions_session_token_unique" UNIQUE("session_token"),
	CONSTRAINT "auth_sessions_refresh_token_unique" UNIQUE("refresh_token")
);
--> statement-breakpoint
CREATE TABLE "auth_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp DEFAULT null,
	"locked_until" timestamp DEFAULT null,
	"login_attempts" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "auth_users_email_unique" UNIQUE("email"),
	CONSTRAINT "auth_users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "password_resets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_resets_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "nwt_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_wallet_id" uuid NOT NULL,
	"transaction_type" text NOT NULL,
	"category" text NOT NULL,
	"amount" text NOT NULL,
	"balance_before" text NOT NULL,
	"balance_after" text NOT NULL,
	"reference_id" text,
	"reference_type" text,
	"description" text NOT NULL,
	"metadata" json,
	"blockchain_tx_hash" text,
	"status" text NOT NULL,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_wallet_id" uuid NOT NULL,
	"amount" text NOT NULL,
	"currency" text NOT NULL,
	"nwt_amount" text,
	"exchange_rate" text,
	"webhook_id" text,
	"payment_intent_id" text,
	"blockchain_tx_hash" text,
	"status" text NOT NULL,
	"failure_reason" text,
	"metadata" json NOT NULL,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"creator_name" text NOT NULL,
	"phone_number" text,
	"bio" text,
	"genres" text[] DEFAULT '{}'::text[] NOT NULL,
	"wallet_type" "wallet_type_enum",
	"wallet_address" text,
	"wallet_balance" double precision DEFAULT 0 NOT NULL,
	"pin_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "creator_profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "reader_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"genres" text[] DEFAULT '{}'::text[] NOT NULL,
	"wallet_id" varchar(12) NOT NULL,
	"wallet_balance" double precision DEFAULT 0 NOT NULL,
	"pin_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reader_profile_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "reader_profile_wallet_id_unique" UNIQUE("wallet_id")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" uuid NOT NULL,
	"first_name" text,
	"last_name" text,
	"display_name" text NOT NULL,
	"bio" text,
	"avatar_url" text,
	"date_of_birth" timestamp,
	"country" text,
	"timezone" text,
	"language" text NOT NULL,
	"preferences" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_profile_id" uuid NOT NULL,
	"nwt_balance" integer NOT NULL,
	"nwt_locked_balance" integer NOT NULL,
	"primary_wallet_address" text,
	"kyc_status" text NOT NULL,
	"kyc_level" integer DEFAULT 0 NOT NULL,
	"spending_limit_daily" integer,
	"spending_limit_monthly" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_wallets_user_profile_id_unique" UNIQUE("user_profile_id")
);
--> statement-breakpoint
CREATE TABLE "wallet_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_wallet_id" uuid NOT NULL,
	"blockchain" text NOT NULL,
	"address" text NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"label" text,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loyalty_points" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comic_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reader_id" uuid NOT NULL,
	"comic_id" uuid NOT NULL,
	"subscribed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"language" varchar(50) NOT NULL,
	"age_rating" varchar(10) NOT NULL,
	"no_of_chapters" integer DEFAULT 0 NOT NULL,
	"no_of_drafts" integer DEFAULT 0 NOT NULL,
	"description" text NOT NULL,
	"image_url" text NOT NULL,
	"comic_status" "comic_status_enum" DEFAULT 'draft',
	"genre" text[] NOT NULL,
	"tags" text[],
	"slug" varchar(300) NOT NULL,
	"creator_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "comics_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "chapter_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reader_id" uuid NOT NULL,
	"chapter_id" uuid NOT NULL,
	"viewed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chapter_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reader_id" uuid NOT NULL,
	"chapter_id" uuid NOT NULL,
	"viewed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chapters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"chapter_type" "chapter_type" DEFAULT 'free' NOT NULL,
	"price" double precision DEFAULT 0 NOT NULL,
	"summary" text,
	"serial_no" integer DEFAULT 0 NOT NULL,
	"pages" text[] NOT NULL,
	"chapter_status" "comic_status_enum" DEFAULT 'draft',
	"comic_id" uuid NOT NULL,
	"unique_code" varchar(4) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chapters_unique_code_unique" UNIQUE("unique_code")
);
--> statement-breakpoint
CREATE TABLE "paid_Chapters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reader_id" uuid NOT NULL,
	"chapter_id" uuid NOT NULL,
	"paid_at" timestamp DEFAULT now() NOT NULL,
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
	"reader_id" uuid NOT NULL,
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
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nwt_transactions" ADD CONSTRAINT "nwt_transactions_user_wallet_id_user_wallets_id_fk" FOREIGN KEY ("user_wallet_id") REFERENCES "public"."user_wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_wallet_id_user_wallets_id_fk" FOREIGN KEY ("user_wallet_id") REFERENCES "public"."user_wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_profile" ADD CONSTRAINT "creator_profile_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reader_profile" ADD CONSTRAINT "reader_profile_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_auth_user_id_auth_users_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_wallets" ADD CONSTRAINT "user_wallets_user_profile_id_user_profiles_id_fk" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_addresses" ADD CONSTRAINT "wallet_addresses_user_wallet_id_user_wallets_id_fk" FOREIGN KEY ("user_wallet_id") REFERENCES "public"."user_wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_points" ADD CONSTRAINT "loyalty_points_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comic_subscribers" ADD CONSTRAINT "comic_subscribers_reader_id_reader_profile_id_fk" FOREIGN KEY ("reader_id") REFERENCES "public"."reader_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comic_subscribers" ADD CONSTRAINT "comic_subscribers_comic_id_comics_id_fk" FOREIGN KEY ("comic_id") REFERENCES "public"."comics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comics" ADD CONSTRAINT "comics_creator_id_creator_profile_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creator_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapter_likes" ADD CONSTRAINT "chapter_likes_reader_id_reader_profile_id_fk" FOREIGN KEY ("reader_id") REFERENCES "public"."reader_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapter_likes" ADD CONSTRAINT "chapter_likes_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapter_views" ADD CONSTRAINT "chapter_views_reader_id_reader_profile_id_fk" FOREIGN KEY ("reader_id") REFERENCES "public"."reader_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapter_views" ADD CONSTRAINT "chapter_views_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_comic_id_comics_id_fk" FOREIGN KEY ("comic_id") REFERENCES "public"."comics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paid_Chapters" ADD CONSTRAINT "paid_Chapters_reader_id_reader_profile_id_fk" FOREIGN KEY ("reader_id") REFERENCES "public"."reader_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paid_Chapters" ADD CONSTRAINT "paid_Chapters_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library" ADD CONSTRAINT "library_reader_id_reader_profile_id_fk" FOREIGN KEY ("reader_id") REFERENCES "public"."reader_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library" ADD CONSTRAINT "library_comic_id_comics_id_fk" FOREIGN KEY ("comic_id") REFERENCES "public"."comics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_transactions" ADD CONSTRAINT "creator_transactions_creator_id_creator_profile_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creator_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_transactions" ADD CONSTRAINT "creator_transactions_source_user_transaction_id_user_transactions_id_fk" FOREIGN KEY ("source_user_transaction_id") REFERENCES "public"."user_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_transactions" ADD CONSTRAINT "user_transactions_reader_id_reader_profile_id_fk" FOREIGN KEY ("reader_id") REFERENCES "public"."reader_profile"("id") ON DELETE cascade ON UPDATE no action;