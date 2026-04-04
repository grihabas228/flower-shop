import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "transactions" DROP COLUMN "payment_method";
  ALTER TABLE "transactions" DROP COLUMN "stripe_customer_i_d";
  ALTER TABLE "transactions" DROP COLUMN "stripe_payment_intent_i_d";
  DROP TYPE "public"."enum_transactions_payment_method";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_transactions_payment_method" AS ENUM('stripe');
  ALTER TABLE "transactions" ADD COLUMN "payment_method" "enum_transactions_payment_method";
  ALTER TABLE "transactions" ADD COLUMN "stripe_customer_i_d" varchar;
  ALTER TABLE "transactions" ADD COLUMN "stripe_payment_intent_i_d" varchar;`)
}
