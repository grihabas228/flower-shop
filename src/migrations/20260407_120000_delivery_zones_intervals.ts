import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // 1. Create enum for available intervals
  await db.execute(sql`
    CREATE TYPE "public"."enum_delivery_zones_available_intervals" AS ENUM('3h', '1h', 'exact');
  `)

  // 2. Add new price columns
  await db.execute(sql`
    ALTER TABLE "delivery_zones"
      ADD COLUMN "price3h" numeric,
      ADD COLUMN "price1h" numeric,
      ADD COLUMN "price_exact" numeric;
  `)

  // 3. Migrate existing price → price3h
  await db.execute(sql`
    UPDATE "delivery_zones" SET "price3h" = "price";
  `)

  // 4. Make price3h NOT NULL after migration, drop legacy price column
  await db.execute(sql`
    ALTER TABLE "delivery_zones" ALTER COLUMN "price3h" SET NOT NULL;
  `)
  await db.execute(sql`
    ALTER TABLE "delivery_zones" DROP COLUMN "price";
  `)

  // 5. Create select table for available_intervals (hasMany select pattern)
  await db.execute(sql`
    CREATE TABLE "delivery_zones_available_intervals" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_delivery_zones_available_intervals",
      "id" serial PRIMARY KEY NOT NULL
    );
  `)

  // 6. FKs and indexes
  await db.execute(sql`
    ALTER TABLE "delivery_zones_available_intervals"
      ADD CONSTRAINT "delivery_zones_available_intervals_parent_fk"
      FOREIGN KEY ("parent_id") REFERENCES "public"."delivery_zones"("id")
      ON DELETE cascade ON UPDATE no action;
  `)
  await db.execute(sql`
    CREATE INDEX "delivery_zones_available_intervals_order_idx"
      ON "delivery_zones_available_intervals" USING btree ("order");
  `)
  await db.execute(sql`
    CREATE INDEX "delivery_zones_available_intervals_parent_idx"
      ON "delivery_zones_available_intervals" USING btree ("parent_id");
  `)

  // 7. Seed price matrix + intervals for known zones (replaces existing data)
  // Seed data table format: zone_type | p3h | p1h | pExact | intervals
  const seed: Array<{
    zoneType: string
    p3h: number
    p1h: number | null
    pExact: number | null
    intervals: string[]
    freeFrom: number | null
    estimatedTime: string
  }> = [
    { zoneType: 'IN_MKAD',     p3h: 500,  p1h: 700,  pExact: 1200, intervals: ['3h', '1h', 'exact'], freeFrom: 5000, estimatedTime: 'от 90 мин' },
    { zoneType: 'OUT_MKAD_5',  p3h: 700,  p1h: 1000, pExact: 1500, intervals: ['3h', '1h', 'exact'], freeFrom: 8000, estimatedTime: 'от 120 мин' },
    { zoneType: 'OUT_MKAD_10', p3h: 900,  p1h: 1300, pExact: null, intervals: ['3h', '1h'],         freeFrom: 10000, estimatedTime: 'от 150 мин' },
    { zoneType: 'OUT_MKAD_15', p3h: 1200, p1h: null, pExact: null, intervals: ['3h'],               freeFrom: null,  estimatedTime: 'от 180 мин' },
    { zoneType: 'OUT_MKAD_30', p3h: 1800, p1h: null, pExact: null, intervals: ['3h'],               freeFrom: null,  estimatedTime: 'от 240 мин' },
    { zoneType: 'OUT_MKAD_50', p3h: 2500, p1h: null, pExact: null, intervals: ['3h'],               freeFrom: null,  estimatedTime: 'от 300 мин' },
  ]

  for (const row of seed) {
    // Update prices/freeFrom/estimatedTime for the zone (if it exists)
    await db.execute(sql.raw(`
      UPDATE "delivery_zones"
      SET "price3h" = ${row.p3h},
          "price1h" = ${row.p1h === null ? 'NULL' : row.p1h},
          "price_exact" = ${row.pExact === null ? 'NULL' : row.pExact},
          "free_from" = ${row.freeFrom === null ? 'NULL' : row.freeFrom},
          "estimated_time" = '${row.estimatedTime.replace(/'/g, "''")}'
      WHERE "zone_type" = '${row.zoneType}';
    `))

    // Clear any existing intervals for this zone, then insert defaults
    await db.execute(sql.raw(`
      DELETE FROM "delivery_zones_available_intervals"
      WHERE "parent_id" IN (SELECT "id" FROM "delivery_zones" WHERE "zone_type" = '${row.zoneType}');
    `))

    for (let i = 0; i < row.intervals.length; i++) {
      const value = row.intervals[i]
      await db.execute(sql.raw(`
        INSERT INTO "delivery_zones_available_intervals" ("order", "parent_id", "value")
        SELECT ${i + 1}, "id", '${value}'::"enum_delivery_zones_available_intervals"
        FROM "delivery_zones" WHERE "zone_type" = '${row.zoneType}';
      `))
    }
  }

  // PICKUP zone — set price3h to 0 if exists, no intervals required
  await db.execute(sql`
    UPDATE "delivery_zones" SET "price3h" = COALESCE("price3h", 0) WHERE "zone_type" = 'PICKUP';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Drop intervals table + enum
  await db.execute(sql`DROP TABLE IF EXISTS "delivery_zones_available_intervals" CASCADE;`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_delivery_zones_available_intervals";`)

  // Restore price column (copy from price3h)
  await db.execute(sql`
    ALTER TABLE "delivery_zones" ADD COLUMN "price" numeric;
  `)
  await db.execute(sql`
    UPDATE "delivery_zones" SET "price" = "price3h";
  `)
  await db.execute(sql`
    ALTER TABLE "delivery_zones" ALTER COLUMN "price" SET NOT NULL;
  `)

  // Drop new columns
  await db.execute(sql`
    ALTER TABLE "delivery_zones"
      DROP COLUMN "price3h",
      DROP COLUMN "price1h",
      DROP COLUMN "price_exact";
  `)
}
