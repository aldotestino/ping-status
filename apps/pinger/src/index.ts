import { db } from "@ping-status/db";
import { type InsertPingResult, pingResult } from "@ping-status/db/schema";
import { env } from "@ping-status/env";
import { type Monitor, monitors } from "@ping-status/monitor";
import { Console, Duration, Effect, Schedule } from "effect";
import { DatabaseError, FetchError, ReadBodyError } from "@/errors";
import { toFetchParams } from "@/utils";

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
          monitorId: monitor.id,
          responseTime: 0,
          status: 0,
          success: false,
          message: error.message,
        }),
        onSuccess: (result) => {
          const validatorResult = monitor.validator(result);
          return {
            monitorId: monitor.id,
            responseTime: result.responseTime,
            status: result.status,
            success: validatorResult.success,
            message: validatorResult.message ?? null,
          };
        },
      })
    );

    return pr;
  });

const program = Effect.gen(function* () {
  yield* Console.log(
    `starting ping monitoring for ${monitors.length} monitors`
  );

  const results = yield* Effect.all(monitors.map(processMonitor), {
    concurrency: env.MONITOR_CONCURRENCY,
  });

  yield* savePingResult(results).pipe(
    Effect.tapBoth({
      onFailure: (error) => Console.error(error.message),
      onSuccess: () =>
        Console.log(`ping results saved for ${results.length} monitors`),
    })
  );
});

const main = program.pipe(
  Effect.schedule(
    Schedule.spaced(Duration.minutes(env.MONITOR_INTERVAL_MINUTES))
  )
);

Effect.runPromise(main);
