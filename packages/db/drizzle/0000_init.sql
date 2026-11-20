CREATE TABLE "account_metrics" (
	"account_id" text NOT NULL,
	"date" text NOT NULL,
	"followers" integer,
	"raw" jsonb,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_metrics_account_id_date_pk" PRIMARY KEY("account_id","date")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"platform" text NOT NULL,
	"locale" text NOT NULL,
	"handle" text,
	"postiz_integration_id" text,
	"active" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"path" text NOT NULL,
	"sha256" text NOT NULL,
	"bytes" integer NOT NULL,
	"duration_sec" real,
	"license" text,
	"source_url" text,
	"author" text,
	"meta" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" text PRIMARY KEY NOT NULL,
	"name" jsonb NOT NULL,
	"family" text,
	"look" jsonb NOT NULL,
	"bible" jsonb,
	"hash" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "episodes" (
	"id" text PRIMARY KEY NOT NULL,
	"joke_id" text NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"location" text NOT NULL,
	"place" text,
	"cast" jsonb NOT NULL,
	"roles" jsonb NOT NULL,
	"lines" jsonb NOT NULL,
	"music" text,
	"adaptation" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"content_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jokes" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"kind" text NOT NULL,
	"text" text NOT NULL,
	"source" text NOT NULL,
	"source_ref" jsonb,
	"popularity" real DEFAULT 0 NOT NULL,
	"score" integer,
	"analysis" jsonb,
	"excluded" boolean DEFAULT false NOT NULL,
	"hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" jsonb NOT NULL,
	"palette" jsonb,
	"bible" jsonb,
	"hash" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_metrics" (
	"post_id" integer NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"views" integer,
	"likes" integer,
	"comments" integer,
	"shares" integer,
	"saves" integer,
	"raw" jsonb,
	CONSTRAINT "post_metrics_post_id_captured_at_pk" PRIMARY KEY("post_id","captured_at")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"episode_id" text,
	"render_id" integer,
	"kind" text NOT NULL,
	"caption" text NOT NULL,
	"title" text,
	"disclosure_version" integer NOT NULL,
	"ai_flag" boolean DEFAULT true NOT NULL,
	"state" text DEFAULT 'planned' NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"postiz_post_id" text,
	"postiz_media_id" text,
	"published_at" timestamp with time zone,
	"url" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "renders" (
	"id" serial PRIMARY KEY NOT NULL,
	"episode_id" text NOT NULL,
	"path" text NOT NULL,
	"sha256" text NOT NULL,
	"bytes" integer NOT NULL,
	"duration_sec" real NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"fps" integer NOT NULL,
	"content_hash" text NOT NULL,
	"git_sha" text,
	"music_asset_id" text,
	"voice" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account_metrics" ADD CONSTRAINT "account_metrics_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_metrics" ADD CONSTRAINT "post_metrics_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_episode_id_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_render_id_renders_id_fk" FOREIGN KEY ("render_id") REFERENCES "public"."renders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "renders" ADD CONSTRAINT "renders_episode_id_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assets_kind_idx" ON "assets" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "episodes_locale_idx" ON "episodes" USING btree ("locale");--> statement-breakpoint
CREATE INDEX "episodes_joke_idx" ON "episodes" USING btree ("joke_id");--> statement-breakpoint
CREATE INDEX "jokes_locale_idx" ON "jokes" USING btree ("locale");--> statement-breakpoint
CREATE INDEX "posts_state_idx" ON "posts" USING btree ("state");--> statement-breakpoint
CREATE UNIQUE INDEX "posts_account_episode_kind_idx" ON "posts" USING btree ("account_id","episode_id","kind");--> statement-breakpoint
CREATE UNIQUE INDEX "renders_episode_hash_idx" ON "renders" USING btree ("episode_id","content_hash");