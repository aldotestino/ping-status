import { sql } from "drizzle-orm";
import { index, int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const pingResult = sqliteTable(
  "pingResult",
  {
    id: int().primaryKey({ autoIncrement: true }),
    monitorId: int().notNull(),
    success: int().notNull(),
    message: text(),
    responseTime: int().notNull(),
    status: int().notNull(),
    createdAt: text().default(sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => [index("monitorId_idx").on(table.monitorId)]
);
