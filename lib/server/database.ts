import "server-only";

import postgres from "postgres";

type DatabaseClient = ReturnType<typeof postgres>;

declare global {
  var __preporaDatabase: DatabaseClient | undefined;
}

export function database(): DatabaseClient {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!globalThis.__preporaDatabase) {
    globalThis.__preporaDatabase = postgres(connectionString, {
      max: process.env.NODE_ENV === "production" ? 10 : 2,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });
  }

  return globalThis.__preporaDatabase;
}

export async function checkDatabaseConnection(): Promise<void> {
  const sql = database();
  await sql`select 1`;
}
