import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// SQLite doesn't have enums, so we use text with check constraints
export const pingStatusValues = ["operational", "degraded", "down"] as const;
export const incidentTypeValues = ["degraded", "down"] as const;

// success = passed validation
// degraded = passed validation but response time is above degraded threshold
// failed = validation failed (or cannot connect)
// timeout = connection timed out

export const pingResult = sqliteTable(
  "pingResult",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    monitorName: text().notNull(),
    status: text().$type<(typeof pingStatusValues)[number]>().notNull(),
    message: text(),
    responseTime: integer().notNull(),
    statusCode: integer().notNull(),
    createdAt: integer({ mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    incidentId: integer().references(() => incident.id),
  },
  (table) => [index("pingResult_monitorName_idx").on(table.monitorName)]
);

export const pingResultSchema = createSelectSchema(pingResult, {
  status: z.enum(pingStatusValues),
});
export const insertPingResultSchema = pingResultSchema.omit({
  id: true,
  createdAt: true,
});

export type InsertPingResult = z.infer<typeof insertPingResultSchema>;
export type PingResult = z.infer<typeof pingResultSchema>;

export const incident = sqliteTable(
  "incident",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    monitorName: text().notNull(),
    type: text().$type<(typeof incidentTypeValues)[number]>().notNull(),
    openedAt: integer({ mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    closedAt: integer({ mode: "timestamp" }),
  },
  (table) => [index("incident_monitorName_idx").on(table.monitorName)]
);

export const incidentSchema = createSelectSchema(incident, {
  type: z.enum(incidentTypeValues),
});
export const insertIncidentSchema = incidentSchema.omit({
  id: true,
  openedAt: true,
  closedAt: true,
});

export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type Incident = z.infer<typeof incidentSchema>;

export const incidentRelations = relations(incident, ({ many }) => ({
  pingResults: many(pingResult),
}));

export const pingResultRelations = relations(pingResult, ({ one }) => ({
  incident: one(incident, {
    fields: [pingResult.incidentId],
    references: [incident.id],
  }),
}));
