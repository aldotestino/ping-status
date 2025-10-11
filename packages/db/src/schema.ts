import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

export const pingStatus = pgEnum("status", ["operational", "degraded", "down"]);

export const incidentType = pgEnum("type", ["degraded", "down"]);

// success = passed validation
// degraded = passed validation but response time is above degraded threshold
// failed = validation failed (or cannot connect)
// timeout = connection timed out

export const pingResult = pgTable(
  "pingResult",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    monitorName: text().notNull(),
    status: pingStatus().notNull(),
    message: text(),
    responseTime: integer().notNull(),
    statusCode: integer().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    incidentId: integer().references(() => incident.id),
  },
  (table) => [index("pingResult_monitorName_idx").on(table.monitorName)]
);

export const pingResultSchema = createSelectSchema(pingResult);
export const insertPingResultSchema = pingResultSchema.omit({
  id: true,
  createdAt: true,
});

export type InsertPingResult = z.infer<typeof insertPingResultSchema>;
export type PingResult = z.infer<typeof pingResultSchema>;

export const incident = pgTable(
  "incident",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    monitorName: text().notNull(),
    type: incidentType().notNull(),
    openedAt: timestamp().notNull().defaultNow(),
    closedAt: timestamp(),
  },
  (table) => [index("incident_monitorName_idx").on(table.monitorName)]
);

export const incidentSchema = createSelectSchema(incident);
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
