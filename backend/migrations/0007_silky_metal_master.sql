CREATE TYPE "public"."comic_status_enum" AS ENUM('published', 'pending', 'scheduled', 'draft');--> statement-breakpoint
CREATE TYPE "public"."chapter_type" AS ENUM('free', 'paid');--> statement-breakpoint
ALTER TABLE "chapters" RENAME COLUMN "description" TO "summary";--> statement-breakpoint
ALTER TABLE "chapters" ALTER COLUMN "pages" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "comics" ADD COLUMN "no_of_chapters" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "comics" ADD COLUMN "no_of_drafts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "comics" ADD COLUMN "comic_status" "comic_status_enum" DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "chapter_type" "chapter_type" DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "price" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "chapter_status" "comic_status_enum" DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "unique_code" varchar(4) NOT NULL;--> statement-breakpoint
ALTER TABLE "chapters" DROP COLUMN "published_at";--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_unique_code_unique" UNIQUE("unique_code");