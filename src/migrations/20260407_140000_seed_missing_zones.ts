import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Backfill zones that were never inserted by the original seed:
 * OUT_MKAD_15, OUT_MKAD_30, OUT_MKAD_50.
 *
 * Each zone gets price3h only (intervals 1h/exact disabled by default).
 * If a row already exists for the zone_type, it is left untouched.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  type Row = {
    zoneType: string
    price3h: number
    estimatedTime: string
  }

  const rows: Row[] = [
    { zoneType: 'OUT_MKAD_15', price3h: 1200, estimatedTime: 'от 180 мин' },
    { zoneType: 'OUT_MKAD_30', price3h: 1800, estimatedTime: 'от 240 мин' },
    { zoneType: 'OUT_MKAD_50', price3h: 2500, estimatedTime: 'от 300 мин' },
  ]

  for (const row of rows) {
    // Insert only if not already present
    await db.execute(sql.raw(`
      INSERT INTO "delivery_zones" (
        "zone_type", "price3h", "estimated_time", "active", "updated_at", "created_at"
      )
      SELECT '${row.zoneType}', ${row.price3h}, '${row.estimatedTime}', true, now(), now()
      WHERE NOT EXISTS (
        SELECT 1 FROM "delivery_zones" WHERE "zone_type" = '${row.zoneType}'
      );
    `))

    // Add the default 3h interval to the join table for the just-inserted row
    await db.execute(sql.raw(`
      INSERT INTO "delivery_zones_available_intervals" ("order", "parent_id", "value")
      SELECT 1, dz."id", '3h'::"enum_delivery_zones_available_intervals"
      FROM "delivery_zones" dz
      WHERE dz."zone_type" = '${row.zoneType}'
        AND NOT EXISTS (
          SELECT 1 FROM "delivery_zones_available_intervals" dzi
          WHERE dzi."parent_id" = dz."id"
        );
    `))
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM "delivery_zones"
    WHERE "zone_type" IN ('OUT_MKAD_15', 'OUT_MKAD_30', 'OUT_MKAD_50');
  `)
}
