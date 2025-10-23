import { env } from "@ping-status/env";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import {
  incident,
  incidentRelations,
  pingResult,
  pingResultRelations,
} from "./schema";

const schema = {
  pingResult,
  incident,
  pingResultRelations,
  incidentRelations,
};

// Ensure the database directory exists
const dbPath = env.DATABASE_URL;
const dbDir = dirname(dbPath);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

export { db };
