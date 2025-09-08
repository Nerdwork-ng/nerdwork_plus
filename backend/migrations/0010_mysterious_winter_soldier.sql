ALTER TABLE "chapters" ALTER COLUMN "chapter_number" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "chapters" ALTER COLUMN "chapter_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "reader_profile" ADD COLUMN "full_name" varchar(12) DEFAULT '';--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "serial_no" integer DEFAULT 0 NOT NULL;