import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_imported_posts_content_style" AS ENUM('short', 'medium', 'full');
  CREATE TYPE "public"."enum_header_menus_nav_items_sub_items_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_header_menus_nav_items_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_footer_columns_nav_items_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_footer_social_links_platform" AS ENUM('facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok');
  CREATE TABLE "header_menus_nav_items_sub_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_header_menus_nav_items_sub_items_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar
  );
  
  CREATE TABLE "header_menus_nav_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_header_menus_nav_items_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar NOT NULL,
  	"has_submenu" boolean DEFAULT false
  );
  
  CREATE TABLE "header_menus" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"menu_name" varchar NOT NULL
  );
  
  CREATE TABLE "footer_columns_nav_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_footer_columns_nav_items_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar NOT NULL
  );
  
  CREATE TABLE "footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL
  );
  
  CREATE TABLE "footer_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "enum_footer_social_links_platform" NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "content_styles_styles" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"key" varchar NOT NULL,
  	"description" varchar,
  	"prompt" varchar NOT NULL,
  	"max_tokens" numeric DEFAULT 4096,
  	"is_default" boolean DEFAULT false
  );
  
  CREATE TABLE "content_styles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  DROP TABLE "footer_nav_items" CASCADE;
  ALTER TABLE "posts" ADD COLUMN "featured" boolean DEFAULT false;
  ALTER TABLE "posts" ADD COLUMN "notification_sent" boolean DEFAULT false;
  ALTER TABLE "_posts_v" ADD COLUMN "version_featured" boolean DEFAULT false;
  ALTER TABLE "_posts_v" ADD COLUMN "version_notification_sent" boolean DEFAULT false;
  ALTER TABLE "subscribers" ADD COLUMN "magic_link_token" varchar;
  ALTER TABLE "subscribers" ADD COLUMN "magic_link_expiry" timestamp(3) with time zone;
  ALTER TABLE "imported_posts" ADD COLUMN "content_style" "enum_imported_posts_content_style" DEFAULT 'short';
  ALTER TABLE "footer" ADD COLUMN "description" varchar;
  ALTER TABLE "footer" ADD COLUMN "copyright" varchar;
  ALTER TABLE "settings" ADD COLUMN "logo_width" numeric DEFAULT 120;
  ALTER TABLE "email_config" ADD COLUMN "templates_new_comment_admin_subject" varchar DEFAULT 'Novi komentar na post: {{postTitle}}';
  ALTER TABLE "email_config" ADD COLUMN "templates_comment_approved_subject" varchar DEFAULT 'Vaš komentar je odobren!';
  ALTER TABLE "email_config" ADD COLUMN "templates_comment_reply_subject" varchar DEFAULT 'Novi odgovor na vaš komentar: {{postTitle}}';
  ALTER TABLE "email_config" ADD COLUMN "templates_new_post_subscriber_subject" varchar DEFAULT 'Novi članak: {{postTitle}}';
  ALTER TABLE "email_config" ADD COLUMN "templates_subscribe_confirmation_subject" varchar DEFAULT 'Potvrdite pretplatu na newsletter';
  ALTER TABLE "email_config" ADD COLUMN "templates_password_reset_subject" varchar DEFAULT 'Resetiranje lozinke';
  ALTER TABLE "email_config" ADD COLUMN "templates_magic_link_subject" varchar DEFAULT 'Vaš link za prijavu';
  ALTER TABLE "email_config" ADD COLUMN "templates_magic_link" jsonb;
  ALTER TABLE "header_menus_nav_items_sub_items" ADD CONSTRAINT "header_menus_nav_items_sub_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."header_menus_nav_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_menus_nav_items" ADD CONSTRAINT "header_menus_nav_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."header_menus"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_menus" ADD CONSTRAINT "header_menus_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_columns_nav_items" ADD CONSTRAINT "footer_columns_nav_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_columns" ADD CONSTRAINT "footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_social_links" ADD CONSTRAINT "footer_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "content_styles_styles" ADD CONSTRAINT "content_styles_styles_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."content_styles"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "header_menus_nav_items_sub_items_order_idx" ON "header_menus_nav_items_sub_items" USING btree ("_order");
  CREATE INDEX "header_menus_nav_items_sub_items_parent_id_idx" ON "header_menus_nav_items_sub_items" USING btree ("_parent_id");
  CREATE INDEX "header_menus_nav_items_order_idx" ON "header_menus_nav_items" USING btree ("_order");
  CREATE INDEX "header_menus_nav_items_parent_id_idx" ON "header_menus_nav_items" USING btree ("_parent_id");
  CREATE INDEX "header_menus_order_idx" ON "header_menus" USING btree ("_order");
  CREATE INDEX "header_menus_parent_id_idx" ON "header_menus" USING btree ("_parent_id");
  CREATE INDEX "footer_columns_nav_items_order_idx" ON "footer_columns_nav_items" USING btree ("_order");
  CREATE INDEX "footer_columns_nav_items_parent_id_idx" ON "footer_columns_nav_items" USING btree ("_parent_id");
  CREATE INDEX "footer_columns_order_idx" ON "footer_columns" USING btree ("_order");
  CREATE INDEX "footer_columns_parent_id_idx" ON "footer_columns" USING btree ("_parent_id");
  CREATE INDEX "footer_social_links_order_idx" ON "footer_social_links" USING btree ("_order");
  CREATE INDEX "footer_social_links_parent_id_idx" ON "footer_social_links" USING btree ("_parent_id");
  CREATE INDEX "content_styles_styles_order_idx" ON "content_styles_styles" USING btree ("_order");
  CREATE INDEX "content_styles_styles_parent_id_idx" ON "content_styles_styles" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "content_styles_styles_key_idx" ON "content_styles_styles" USING btree ("key");
  DROP TYPE "public"."enum_footer_nav_items_link_type";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_footer_nav_items_link_type" AS ENUM('reference', 'custom');
  CREATE TABLE "footer_nav_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_footer_nav_items_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar NOT NULL
  );
  
  DROP TABLE "header_menus_nav_items_sub_items" CASCADE;
  DROP TABLE "header_menus_nav_items" CASCADE;
  DROP TABLE "header_menus" CASCADE;
  DROP TABLE "footer_columns_nav_items" CASCADE;
  DROP TABLE "footer_columns" CASCADE;
  DROP TABLE "footer_social_links" CASCADE;
  DROP TABLE "content_styles_styles" CASCADE;
  DROP TABLE "content_styles" CASCADE;
  ALTER TABLE "footer_nav_items" ADD CONSTRAINT "footer_nav_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "footer_nav_items_order_idx" ON "footer_nav_items" USING btree ("_order");
  CREATE INDEX "footer_nav_items_parent_id_idx" ON "footer_nav_items" USING btree ("_parent_id");
  ALTER TABLE "posts" DROP COLUMN "featured";
  ALTER TABLE "posts" DROP COLUMN "notification_sent";
  ALTER TABLE "_posts_v" DROP COLUMN "version_featured";
  ALTER TABLE "_posts_v" DROP COLUMN "version_notification_sent";
  ALTER TABLE "subscribers" DROP COLUMN "magic_link_token";
  ALTER TABLE "subscribers" DROP COLUMN "magic_link_expiry";
  ALTER TABLE "imported_posts" DROP COLUMN "content_style";
  ALTER TABLE "footer" DROP COLUMN "description";
  ALTER TABLE "footer" DROP COLUMN "copyright";
  ALTER TABLE "settings" DROP COLUMN "logo_width";
  ALTER TABLE "email_config" DROP COLUMN "templates_new_comment_admin_subject";
  ALTER TABLE "email_config" DROP COLUMN "templates_comment_approved_subject";
  ALTER TABLE "email_config" DROP COLUMN "templates_comment_reply_subject";
  ALTER TABLE "email_config" DROP COLUMN "templates_new_post_subscriber_subject";
  ALTER TABLE "email_config" DROP COLUMN "templates_subscribe_confirmation_subject";
  ALTER TABLE "email_config" DROP COLUMN "templates_password_reset_subject";
  ALTER TABLE "email_config" DROP COLUMN "templates_magic_link_subject";
  ALTER TABLE "email_config" DROP COLUMN "templates_magic_link";
  DROP TYPE "public"."enum_imported_posts_content_style";
  DROP TYPE "public"."enum_header_menus_nav_items_sub_items_link_type";
  DROP TYPE "public"."enum_header_menus_nav_items_link_type";
  DROP TYPE "public"."enum_footer_columns_nav_items_link_type";
  DROP TYPE "public"."enum_footer_social_links_platform";`)
}
