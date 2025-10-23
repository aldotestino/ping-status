import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
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

const sqlite = new Database("ping-status.db");
const db = drizzle(sqlite, { schema });

export { db };
