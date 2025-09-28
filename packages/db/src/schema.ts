import { relations } from "drizzle-orm";
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
    monitorName: text().notNull(),
    success: boolean().notNull(),
    message: text(),
    responseTime: integer().notNull(),
    status: integer().notNull(),
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
