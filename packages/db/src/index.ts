import { Database } from "bun:sqlite";
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

const sqlite = new Database("ping-status.db");
const db = drizzle(sqlite, { schema });

export { db };
