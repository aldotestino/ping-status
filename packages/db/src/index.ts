import { Database } from "bun:sqlite";
import { env } from "@ping-status/config/env";
import { drizzle } from "drizzle-orm/bun-sqlite";
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

const sqlite = new Database(env.DATABASE_PATH);
const db = drizzle(sqlite, { schema });

export { db };
