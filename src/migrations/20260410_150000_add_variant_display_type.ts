import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Create enum
  await db.execute(sql`
    CREATE TYPE "public"."enum_products_variant_display_type" AS ENUM('size', 'quantity');
  `)

  // Add column with default 'size'
  await db.execute(sql`
    ALTER TABLE "products"
      ADD COLUMN "variant_display_type" "enum_products_variant_display_type" DEFAULT 'size';
  `)

  // Also add to _draft versions table if it exists
  await db.execute(sql`
    ALTER TABLE "_products_v"
      ADD COLUMN "version_variant_display_type" "enum_products_variant_display_type" DEFAULT 'size';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" DROP COLUMN IF EXISTS "variant_display_type";
  `)
  await db.execute(sql`
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_variant_display_type";
  `)
  await db.execute(sql`
    DROP TYPE IF EXISTS "public"."enum_products_variant_display_type";
  `)
}
