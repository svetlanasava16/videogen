import { drizzle } from "drizzle-orm/postgres-js";
import { migrate as runMigrations } from "drizzle-orm/postgres-js/migrator";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import * as schema from "./schema.js";

export * as schema from "./schema.js";

/** Локально: postgres из infra/docker-compose.yml (порт 5433). */
export const DEFAULT_URL = "postgres://anek:anek@127.0.0.1:5433/anek";

export function connect(url = process.env.ANEK_DATABASE_URL ?? DEFAULT_URL) {
  const client = postgres(url, { max: 4, onnotice: () => {} });
  const db = drizzle(client, { schema });
  return { db, close: () => client.end() };
}
export type Db = ReturnType<typeof connect>["db"];

export async function migrate(db: Db) {
  await runMigrations(db, { migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)) });
}
