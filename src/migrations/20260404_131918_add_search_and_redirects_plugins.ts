import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // No-op: search and redirects tables already exist in the database
  // (created automatically by plugins on first app initialization)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // No-op
}
