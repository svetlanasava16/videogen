ALTER TABLE "renders" ALTER COLUMN "episode_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "compilation_id" text;--> statement-breakpoint
ALTER TABLE "renders" ADD COLUMN "compilation_id" text;