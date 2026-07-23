import { createRequire } from "node:module";
import process from "node:process";

import postgres from "postgres";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  console.error("DATABASE_URL is required to check the database.");
  process.exit(1);
}

const expectedTables = [
  "account_deletion_requests",
  "app_records",
  "auth_sessions",
  "rate_limits",
  "schema_migrations",
  "usage_quotas",
  "users",
];
const sql = postgres(connectionString, { max: 1, prepare: false });
const smokeId = `db-check-${crypto.randomUUID()}`;

try {
  const rows = await sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name in ${sql(expectedTables)}
  `;
  const existing = new Set(rows.map((row) => row.table_name));
  const missing = expectedTables.filter((table) => !existing.has(table));
  if (missing.length) {
    throw new Error(`Missing database tables: ${missing.join(", ")}`);
  }

  await sql`
    insert into app_records (collection, id, data)
    values ('__database_check', ${smokeId}, ${sql.json({ ok: true })})
  `;
  const smoke = await sql`
    select data ->> 'ok' as ok
    from app_records
    where collection = '__database_check' and id = ${smokeId}
  `;
  if (smoke[0]?.ok !== "true") {
    throw new Error("Database write/read check did not return the expected value.");
  }
  await sql`
    delete from app_records
    where collection = '__database_check' and id = ${smokeId}
  `;

  console.log("Neon database schema and write/read/delete checks passed.");
} finally {
  await sql`
    delete from app_records
    where collection = '__database_check' and id = ${smokeId}
  `.catch(() => undefined);
  await sql.end();
}
