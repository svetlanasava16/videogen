import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.ANEK_DATABASE_URL ?? "postgres://anek:anek@127.0.0.1:5433/anek" },
});
