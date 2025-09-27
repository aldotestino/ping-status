import { env } from "@ping-status/env";
import { drizzle } from "drizzle-orm/node-postgres";

const db = drizzle(env.DATABASE_URL);

export { db };
