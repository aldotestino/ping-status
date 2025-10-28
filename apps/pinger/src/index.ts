import { FetchHttpClient } from "@effect/platform";
import { BunRuntime } from "@effect/platform-bun";
import { env } from "@ping-status/config/env";
import { monitors } from "@ping-status/config/monitors";
import { type Incident, incident, pingResult } from "@ping-status/db/schema";
import { and, inArray, isNull } from "drizzle-orm";
import { Console, Duration, Effect, Layer, Option, Schedule } from "effect";
import { DrizzleWrapper } from "@/services/drizzle-wrapper";
import { MonitorPinger } from "@/services/monitor-pinger";
import { MonitorProcessor } from "@/services/monitor-processor";
import { Notifier } from "@/services/notifier";
import { getIncidentOperations, linkPingsWithIncidents } from "@/utils";

const program = Effect.gen(function* () {
  const monitorProcessor = yield* MonitorProcessor;
  const drizzle = yield* DrizzleWrapper;
  const notifier = yield* Effect.serviceOption(Notifier);

  yield* Console.log("Notifier is provided:", Option.isSome(notifier));

  const pings = yield* Effect.all(monitors.map(monitorProcessor.process), {
    concurrency: env.MONITOR_CONCURRENCY,
  });

  const currentOpenIncidents = yield* drizzle.query((client) =>
    client.select().from(incident).where(isNull(incident.closedAt))
  );

  // Calculate which incidents to open and close
  const { incidentsToOpen, incidentsToClose } = getIncidentOperations(
    pings,
    currentOpenIncidents
  );

  // open new incidents
  let openedIncidents: Incident[] = [];
  if (incidentsToOpen.length > 0) {
    openedIncidents = yield* drizzle.query((client) =>
      client.insert(incident).values(incidentsToOpen).returning()
    );

    yield* Console.log(`opened ${openedIncidents.length} incidents`);

    // send notification
    if (Option.isSome(notifier)) {
      yield* notifier.value.notifyOpenIncidents(
        openedIncidents.map((i) => {
          // biome-ignore lint/style/noNonNullAssertion: is there 100%
          const ping = pings.find((p) => p.monitorName === i.monitorName)!;

          return {
            ...i,
            message: ping.message,
            statusCode: ping.statusCode,
            responseTime: ping.responseTime,
          };
        })
      );
    }
  }

  if (incidentsToClose.length > 0) {
    // close incidents
    const closed = yield* drizzle.query((client) =>
      client
        .update(incident)
        .set({ closedAt: new Date() })
        .where(
          and(inArray(incident.id, incidentsToClose), isNull(incident.closedAt))
        )
        .returning()
    );

    yield* Console.log(`closed ${closed.length} incidents`);

    // from closed incidents, filter out the monitor names that are included in the new opened (incident escalated or de-escaleted)
    const closedIncidentsToNotify = closed.filter(
      (i) => !openedIncidents.some((o) => o.monitorName === i.monitorName)
    );

    if (closedIncidentsToNotify.length > 0 && Option.isSome(notifier)) {
      // send notification
      yield* notifier.value.notifyClosedIncidents(closedIncidentsToNotify);
    }
  }

  const newCurrentOpenIncidents = currentOpenIncidents
    .filter((i) => !incidentsToClose.includes(i.id))
    .concat(openedIncidents);

  // Link pings with incident IDs (both existing and newly opened)
  const updatedPings = linkPingsWithIncidents(pings, newCurrentOpenIncidents);

  // save pings
  yield* drizzle.query((client) =>
    client.insert(pingResult).values(updatedPings)
  );
});

// If MONITOR_INTERVAL_MINUTES is set, run on a schedule (dev mode)
// Otherwise, run once and exit (prod mode with PM2 cron)
const scheduledProgram = env.MONITOR_INTERVAL_MINUTES
  ? program.pipe(
      Effect.schedule(
        Schedule.spaced(Duration.minutes(env.MONITOR_INTERVAL_MINUTES))
      )
    )
  : program;

// do not catch database errors as they represent defects
const main = scheduledProgram.pipe(
  Effect.provide(env.SLACK_WEBHOOK_URL ? Notifier.Default : Layer.empty),
  Effect.provide(DrizzleWrapper.Default),
  Effect.provide(MonitorProcessor.Default),
  Effect.provide(MonitorPinger.Default),
  Effect.provide(FetchHttpClient.layer)
);

BunRuntime.runMain(main);
