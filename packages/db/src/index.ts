import { env } from "@ping-status/config/env";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  incident,
  incidentRelations,
  incidentType,
  pingResult,
  pingResultRelations,
  pingStatus,
} from "./schema";

const schema = {
  pingResult,
  incident,
  pingResultRelations,
  incidentRelations,
  pingStatus,
  incidentType,
};

const db = drizzle(env.DATABASE_URL, { schema });

export { db };
