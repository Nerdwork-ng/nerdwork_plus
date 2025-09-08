CREATE TABLE "comics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"language" varchar(50) NOT NULL,
	"age_rating" varchar(10) NOT NULL,
	"description" text NOT NULL,
	"image_url" text NOT NULL,
	"genre" text[] NOT NULL,
	"tags" text[],
	"slug" varchar(300) NOT NULL,
	"is_draft" boolean DEFAULT true NOT NULL,
	"published_at" timestamp,
	"creator_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "comics_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "chapters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comic_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"chapter_number" integer NOT NULL,
	"description" text,
	"pages" text[] DEFAULT '{}' NOT NULL,
	"page_count" integer DEFAULT 0 NOT NULL,
	"is_draft" boolean DEFAULT true NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comics" ADD CONSTRAINT "comics_creator_id_creator_profile_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creator_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_comic_id_comics_id_fk" FOREIGN KEY ("comic_id") REFERENCES "public"."comics"("id") ON DELETE cascade ON UPDATE no action;