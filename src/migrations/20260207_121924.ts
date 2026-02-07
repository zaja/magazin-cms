import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "email_config" ADD COLUMN "templates_weekly_digest_subject" varchar DEFAULT 'Tjedni pregled — {{postCount}} novih članaka';
  ALTER TABLE "email_config" ADD COLUMN "templates_weekly_digest" jsonb;
  ALTER TABLE "email_config" ADD COLUMN "templates_post_notification_batch_subject" varchar DEFAULT '{{postCount}} novih članaka na portalu';
  ALTER TABLE "email_config" ADD COLUMN "templates_post_notification_batch" jsonb;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "email_config" DROP COLUMN "templates_weekly_digest_subject";
  ALTER TABLE "email_config" DROP COLUMN "templates_weekly_digest";
  ALTER TABLE "email_config" DROP COLUMN "templates_post_notification_batch_subject";
  ALTER TABLE "email_config" DROP COLUMN "templates_post_notification_batch";`)
}
