import { env } from "@ping-status/env";
import { drizzle } from "drizzle-orm/node-postgres";
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

const db = drizzle(env.DATABASE_URL, { schema });

export { db };
