import { sql } from "drizzle-orm";
import { blob, index, int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const pingResult = sqliteTable(
  "pingResult",
  {
    id: int().primaryKey({ autoIncrement: true }),
    monitorId: int().notNull(),
    success: int().notNull(),
    responseTime: int().notNull(),
    status: int().notNull(),
    body: blob({ mode: "json" }),
    createdAt: text().default(sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => [index("monitorId_idx").on(table.monitorId)]
);
