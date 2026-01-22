import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_rss_feeds_auto_publish" AS ENUM('draft', 'scheduled', 'published');
  CREATE TYPE "public"."enum_imported_posts_status" AS ENUM('pending', 'processing', 'completed', 'failed');
  CREATE TYPE "public"."enum_header_nav_items_sub_items_link_type" AS ENUM('reference', 'custom');
  CREATE TABLE "rss_feeds" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"active" boolean DEFAULT true,
  	"category_id" integer,
  	"check_interval" numeric DEFAULT 60,
  	"last_checked" timestamp(3) with time zone,
  	"items_processed" numeric DEFAULT 0,
  	"translate_content" boolean DEFAULT true,
  	"generate_s_e_o" boolean DEFAULT true,
  	"auto_publish" "enum_rss_feeds_auto_publish" DEFAULT 'draft',
  	"max_items_per_check" numeric DEFAULT 5,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "rss_feeds_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer
  );
  
  CREATE TABLE "imported_posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"original_u_r_l" varchar NOT NULL,
  	"original_title" varchar NOT NULL,
  	"rss_feed_id" integer NOT NULL,
  	"post_id" integer,
  	"status" "enum_imported_posts_status" DEFAULT 'pending',
  	"error_message" varchar,
  	"translation_tokens" numeric,
  	"processed_at" timestamp(3) with time zone,
  	"retry_count" numeric DEFAULT 0,
  	"metadata" jsonb,
  	"locked_at" timestamp(3) with time zone,
  	"locked_by" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "header_nav_items_sub_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_header_nav_items_sub_items_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "rss_feeds_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "imported_posts_id" integer;
  ALTER TABLE "header_nav_items" ADD COLUMN "has_submenu" boolean DEFAULT false;
  ALTER TABLE "header_rels" ADD COLUMN "categories_id" integer;
  ALTER TABLE "footer_rels" ADD COLUMN "categories_id" integer;
  ALTER TABLE "rss_feeds" ADD CONSTRAINT "rss_feeds_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rss_feeds_rels" ADD CONSTRAINT "rss_feeds_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."rss_feeds"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rss_feeds_rels" ADD CONSTRAINT "rss_feeds_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "imported_posts" ADD CONSTRAINT "imported_posts_rss_feed_id_rss_feeds_id_fk" FOREIGN KEY ("rss_feed_id") REFERENCES "public"."rss_feeds"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "imported_posts" ADD CONSTRAINT "imported_posts_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "header_nav_items_sub_items" ADD CONSTRAINT "header_nav_items_sub_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."header_nav_items"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "rss_feeds_url_idx" ON "rss_feeds" USING btree ("url");
  CREATE INDEX "rss_feeds_category_idx" ON "rss_feeds" USING btree ("category_id");
  CREATE INDEX "rss_feeds_updated_at_idx" ON "rss_feeds" USING btree ("updated_at");
  CREATE INDEX "rss_feeds_created_at_idx" ON "rss_feeds" USING btree ("created_at");
  CREATE INDEX "rss_feeds_rels_order_idx" ON "rss_feeds_rels" USING btree ("order");
  CREATE INDEX "rss_feeds_rels_parent_idx" ON "rss_feeds_rels" USING btree ("parent_id");
  CREATE INDEX "rss_feeds_rels_path_idx" ON "rss_feeds_rels" USING btree ("path");
  CREATE INDEX "rss_feeds_rels_tags_id_idx" ON "rss_feeds_rels" USING btree ("tags_id");
  CREATE UNIQUE INDEX "imported_posts_original_u_r_l_idx" ON "imported_posts" USING btree ("original_u_r_l");
  CREATE INDEX "imported_posts_rss_feed_idx" ON "imported_posts" USING btree ("rss_feed_id");
  CREATE INDEX "imported_posts_post_idx" ON "imported_posts" USING btree ("post_id");
  CREATE INDEX "imported_posts_updated_at_idx" ON "imported_posts" USING btree ("updated_at");
  CREATE INDEX "imported_posts_created_at_idx" ON "imported_posts" USING btree ("created_at");
  CREATE INDEX "header_nav_items_sub_items_order_idx" ON "header_nav_items_sub_items" USING btree ("_order");
  CREATE INDEX "header_nav_items_sub_items_parent_id_idx" ON "header_nav_items_sub_items" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rss_feeds_fk" FOREIGN KEY ("rss_feeds_id") REFERENCES "public"."rss_feeds"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_imported_posts_fk" FOREIGN KEY ("imported_posts_id") REFERENCES "public"."imported_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_rels" ADD CONSTRAINT "header_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_rels" ADD CONSTRAINT "footer_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_rss_feeds_id_idx" ON "payload_locked_documents_rels" USING btree ("rss_feeds_id");
  CREATE INDEX "payload_locked_documents_rels_imported_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("imported_posts_id");
  CREATE INDEX "header_rels_categories_id_idx" ON "header_rels" USING btree ("categories_id");
  CREATE INDEX "footer_rels_categories_id_idx" ON "footer_rels" USING btree ("categories_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rss_feeds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "rss_feeds_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "imported_posts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "header_nav_items_sub_items" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "rss_feeds" CASCADE;
  DROP TABLE "rss_feeds_rels" CASCADE;
  DROP TABLE "imported_posts" CASCADE;
  DROP TABLE "header_nav_items_sub_items" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_rss_feeds_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_imported_posts_fk";
  
  ALTER TABLE "header_rels" DROP CONSTRAINT "header_rels_categories_fk";
  
  ALTER TABLE "footer_rels" DROP CONSTRAINT "footer_rels_categories_fk";
  
  DROP INDEX "payload_locked_documents_rels_rss_feeds_id_idx";
  DROP INDEX "payload_locked_documents_rels_imported_posts_id_idx";
  DROP INDEX "header_rels_categories_id_idx";
  DROP INDEX "footer_rels_categories_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "rss_feeds_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "imported_posts_id";
  ALTER TABLE "header_nav_items" DROP COLUMN "has_submenu";
  ALTER TABLE "header_rels" DROP COLUMN "categories_id";
  ALTER TABLE "footer_rels" DROP COLUMN "categories_id";
  DROP TYPE "public"."enum_rss_feeds_auto_publish";
  DROP TYPE "public"."enum_imported_posts_status";
  DROP TYPE "public"."enum_header_nav_items_sub_items_link_type";`)
}
