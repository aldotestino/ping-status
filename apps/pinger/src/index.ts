import { db } from "@ping-status/db";
import {
  type InsertPingResult,
  incident,
  pingResult,
} from "@ping-status/db/schema";
import { env } from "@ping-status/env";
import { type Monitor, monitors } from "@ping-status/monitor";
import { and, inArray, isNull } from "drizzle-orm";
import { Console, Duration, Effect, Schedule } from "effect";
import { DatabaseError, FetchError, ReadBodyError } from "@/errors";
import { toFetchParams } from "@/utils";

const closeIncidents = (incidentIds: number[]) =>
  Effect.tryPromise({
    try: () =>
      db
        .update(incident)
        .set({ closedAt: new Date() })
        .where(
          and(inArray(incident.id, incidentIds), isNull(incident.closedAt)) // be sure the incident is still open
        ),
    catch: (error: unknown) =>
      new DatabaseError({
        message: error instanceof Error ? error.message : "Unknown error",
        cause: error,
      }),
  });

const openIncidents = (monitorNames: string[]) =>
  Effect.tryPromise({
    try: () =>
      db
        .insert(incident)
        .values(monitorNames.map((name) => ({ monitorName: name })))
        .returning({
          id: incident.id,
          monitorName: incident.monitorName,
        }),
    catch: (error: unknown) =>
      new DatabaseError({
        message: error instanceof Error ? error.message : "Unknown error",
        cause: error,
      }),
  });

const getOpenIncidents = (monitorNames: string[]) =>
  Effect.tryPromise({
    try: () =>
      db
        .select()
        .from(incident)
        .where(
          and(
            inArray(incident.monitorName, monitorNames),
            isNull(incident.closedAt)
          )
        ),
    catch: (error: unknown) =>
      new DatabaseError({
        message: error instanceof Error ? error.message : "Unknown error",
        cause: error,
      }),
  });

const savePingResult = (values: InsertPingResult[]) =>
  Effect.tryPromise({
    try: () => db.insert(pingResult).values(values),
    catch: (error: unknown) =>
      new DatabaseError({
        message: error instanceof Error ? error.message : "Unknown error",
        cause: error,
      }),
  });

const fetchEndpoint = (monitor: Monitor) =>
  Effect.tryPromise({
    try: () => fetch(monitor.url, toFetchParams(monitor)),
    catch: (error: unknown) =>
      new FetchError({
        message:
          error instanceof Error ? error.message : "Failed to fetch endpoint",
        cause: error,
      }),
  });

const readBody = (response: Response) =>
  Effect.tryPromise({
    try: () => response.text(),
    catch: (error: unknown) =>
      new ReadBodyError({
        message: "Failed to read body",
        cause: error,
      }),
  });

const pingMonitor = (monitor: Monitor) =>
  Effect.gen(function* () {
    const [duration, response] = yield* Effect.timed(
      fetchEndpoint(monitor)
    ).pipe(
      Effect.tapError((err) =>
        Console.warn(
          `${monitor.name} failed to fetch endpoint: ${err.message}. Retrying...`
        )
      ),
      Effect.retry({
        times: env.MONITOR_RETRIES,
        schedule: Schedule.exponential(
          Duration.millis(env.MONITOR_RETRY_DELAY_MS)
        ),
      }),
      Effect.timeout(Duration.millis(env.MONITOR_TIMEOUT_MS))
    );

    const body = yield* readBody(response);

    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body,
      responseTime: Math.round(Duration.toMillis(duration)),
    };
  });

const processMonitor = (monitor: Monitor): Effect.Effect<InsertPingResult> =>
  Effect.gen(function* () {
    yield* Console.log(
      `pinging monitor ${monitor.name}: [${monitor.method}] ${monitor.url}`
    );

    const pr = yield* pingMonitor(monitor).pipe(
      Effect.tapBoth({
        onFailure: (error) => Console.error(error.message),
        onSuccess: (result) =>
          Console.log(
            `monitor ${monitor.name} pinged successfully (${result.status}) in ${result.responseTime}ms`
          ),
      }),
      Effect.match({
        onFailure: (error) => ({
          monitorName: monitor.name,
          responseTime: 0,
          status: 0,
          success: false,
          message: error.message,
          incidentId: null,
        }),
        onSuccess: (result) => {
          const validatorResult = monitor.validator(result);
          return {
            monitorName: monitor.name,
            responseTime: result.responseTime,
            status: result.status,
            success: validatorResult.success,
            message: validatorResult.message ?? null,
            incidentId: null,
          };
        },
      })
    );

    return pr;
  });

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: refactor later
const program = Effect.gen(function* () {
  yield* Console.log(
    `starting ping monitoring for ${monitors.length} monitors`
  );

  const pings = yield* Effect.all(monitors.map(processMonitor), {
    concurrency: env.MONITOR_CONCURRENCY,
  });

  const incidentsToOpen: string[] = []; // monitor names
  const incidentsToClose: number[] = []; // incident ids

  const currentOpenIncidents = yield* getOpenIncidents(
    monitors.map((m) => m.name)
  );

  for (const ping of pings) {
    const relatedIncident = currentOpenIncidents.find(
      (i) => i.monitorName === ping.monitorName
    );

    if (relatedIncident && !ping.success) {
      ping.incidentId = relatedIncident.id;
    }

    if (!(relatedIncident || ping.success)) {
      incidentsToOpen.push(ping.monitorName);
    }

    if (relatedIncident && ping.success) {
      incidentsToClose.push(relatedIncident.id);
    }
  }

  if (incidentsToOpen.length > 0) {
    const opened = yield* openIncidents(incidentsToOpen);
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

  if (incidentsToClose.length > 0) {
    const closed = yield* closeIncidents(incidentsToClose);
    yield* Console.log(`closed ${closed.rowCount} incidents`);
    // send notification
  }

  yield* savePingResult(pings);
});

const main = program.pipe(
  Effect.tapError((error) => Console.error(error.message)),
  Effect.schedule(
    Schedule.spaced(Duration.minutes(env.MONITOR_INTERVAL_MINUTES))
    // Schedule.spaced(Duration.seconds(20))
  )
);

Effect.runPromise(main);
