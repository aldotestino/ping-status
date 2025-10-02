import { FetchHttpClient } from "@effect/platform";
import { BunRuntime } from "@effect/platform-bun";
import { incident, pingResult } from "@ping-status/db/schema";
import { env } from "@ping-status/env";
import { monitors } from "@ping-status/monitor";
import { and, inArray, isNull } from "drizzle-orm";
import { Console, Duration, Effect, Schedule } from "effect";
import { DrizzleWrapper } from "@/services/DrizzleWrapper";
import { MonitorPinger } from "@/services/MonitorPinger";
import { MonitorProcessor } from "@/services/MonitorProcessor";

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: refactor later
const program = Effect.gen(function* () {
  const monitorProcessor = yield* MonitorProcessor;
  const drizzle = yield* DrizzleWrapper;

  const pings = yield* Effect.all(monitors.map(monitorProcessor.process), {
    concurrency: env.MONITOR_CONCURRENCY,
  });

  const incidentsToOpen: string[] = []; // monitor names
  const incidentsToClose: number[] = []; // incident ids

  const currentOpenIncidents = yield* drizzle.query((client) =>
    client.select().from(incident).where(isNull(incident.closedAt))
  );

  for (const ping of pings) {
    // find the incident related to this monitor, if any
    const relatedIncident = currentOpenIncidents.find(
      (i) => i.monitorName === ping.monitorName
    );

    // monitor failed and related to an incident, link the incident to the ping
    if (relatedIncident && !ping.success) {
      ping.incidentId = relatedIncident.id;
    }

    // monitor failed and not linked to an incident yet
    if (!(relatedIncident || ping.success)) {
      incidentsToOpen.push(ping.monitorName);
    }

    // monitor succeeded and related to an incident, close the incident
    if (relatedIncident && ping.success) {
      incidentsToClose.push(relatedIncident.id);
    }
  }

  // open new incidents
  if (incidentsToOpen.length > 0) {
    const opened = yield* drizzle.query((client) =>
      client
        .insert(incident)
        .values(incidentsToOpen.map((name) => ({ monitorName: name })))
        .returning({
          id: incident.id,
          monitorName: incident.monitorName,
        })
    );

    yield* Console.log(`opened ${opened.length} incidents`);

    // link the incidents to the pings
    for (const o of opened) {
      const ping = pings.find((p) => p.monitorName === o.monitorName);
      if (ping) {
        ping.incidentId = o.id;
      }
    }

    // send notification
  }

  // close incidents
  if (incidentsToClose.length > 0) {
    const closed = yield* drizzle.query((client) =>
      client
        .update(incident)
        .set({ closedAt: new Date() })
        .where(
          and(inArray(incident.id, incidentsToClose), isNull(incident.closedAt))
        )
    );

    yield* Console.log(`closed ${closed.rowCount} incidents`);

    // send notification
  }

  // save pings
  yield* drizzle.query((client) => client.insert(pingResult).values(pings));
}).pipe(
  Effect.schedule(
    Schedule.spaced(Duration.minutes(env.MONITOR_INTERVAL_MINUTES))
  )
);

// do not catch database errors as they represent defects
const main = program.pipe(
  Effect.provide(DrizzleWrapper.Default),
  Effect.provide(MonitorProcessor.Default),
  Effect.provide(MonitorPinger.Default),
  Effect.provide(FetchHttpClient.layer)
);

BunRuntime.runMain(main);
