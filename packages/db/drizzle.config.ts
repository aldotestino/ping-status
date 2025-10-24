import { env } from "@ping-status/env";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: env.DATABASE_PATH,
  },
  verbose: true,
});
