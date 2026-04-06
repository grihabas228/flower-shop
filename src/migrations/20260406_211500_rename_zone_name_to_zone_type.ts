import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "delivery_zones" RENAME COLUMN "zone_name" TO "zone_type";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "delivery_zones" RENAME COLUMN "zone_type" TO "zone_name";
  `)
}
