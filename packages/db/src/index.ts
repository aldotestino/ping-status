import { Database } from "bun:sqlite";
import { env } from "@ping-status/env";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { pingResult } from "@/schema";

const sqlite = new Database(env.DATABASE_FILENAME);
const db = drizzle(sqlite, { schema: { pingResult } });
migrate(db, { migrationsFolder: "./drizzle" });

export { db };
