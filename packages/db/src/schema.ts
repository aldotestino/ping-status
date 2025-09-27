import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

export const pingResult = pgTable(
  "pingResult",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    monitorId: integer().notNull(),
    success: boolean().notNull(),
    message: text(),
    responseTime: integer().notNull(),
    status: integer().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => [index("monitorId_idx").on(table.monitorId)]
);

export const pingResultSchema = createSelectSchema(pingResult);
export const insertPingResultSchema = pingResultSchema.omit({
  id: true,
  createdAt: true,
});

export type InsertPingResult = z.infer<typeof insertPingResultSchema>;
export type PingResult = z.infer<typeof pingResultSchema>;
