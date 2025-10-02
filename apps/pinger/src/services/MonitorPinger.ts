import { HttpClient, HttpClientRequest } from "@effect/platform";
import { env } from "@ping-status/env";
import type { Monitor } from "@ping-status/monitor";
import { Console, Duration, Effect, Match, pipe, Schedule } from "effect";

const createRequest = (monitor: Monitor) =>
  pipe(
    Match.value(monitor.method).pipe(
      Match.when("GET", () => HttpClientRequest.get(monitor.url)),
      Match.when("POST", () => HttpClientRequest.post(monitor.url)),
      Match.when("PUT", () => HttpClientRequest.put(monitor.url)),
      Match.exhaustive
    ),
    (request) =>
      Match.value(monitor.headers).pipe(
        Match.when(Match.defined, (headers) =>
          HttpClientRequest.setHeaders(request, headers)
        ),
        Match.when(Match.undefined, () => request),
        Match.exhaustive
      ),
    (request) =>
      Match.value(monitor.body).pipe(
        Match.when(Match.string, (body) =>
          HttpClientRequest.bodyText(request, body)
        ),
        Match.when(Match.record, (body) =>
          HttpClientRequest.bodyUnsafeJson(request, body)
        ),
        Match.when(Match.undefined, () => request),
        Match.exhaustive
      )
  );

export class MonitorPinger extends Effect.Service<MonitorPinger>()(
  "MonitorPinger",
  {
    effect: Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient;

      return {
        ping: (monitor: Monitor) =>
          Effect.gen(function* () {
            const [duration, response] = yield* Effect.timed(
              client
                .execute(createRequest(monitor))
                .pipe(Effect.timeout(Duration.millis(env.MONITOR_TIMEOUT_MS)))
            ).pipe(
              // retries only for request and response errors (as defined in while clause)
              Effect.tapErrorTag("RequestError", (err) =>
                Console.warn(
                  `[${monitor.name}] Error pinging: ${err.message}. Retrying...`
                )
              ),
              Effect.tapErrorTag("ResponseError", (err) =>
                Console.warn(
                  `[${monitor.name}] Timeout pinging: ${err.message}. Retrying...`
                )
              ),
              Effect.retry({
                times: env.MONITOR_RETRIES,
                schedule: Schedule.exponential(
                  Duration.millis(env.MONITOR_RETRY_DELAY_MS)
                ),
                while: (err) => err._tag !== "TimeoutException",
              })
            );

            const body = yield* response.text;
            const headers = response.headers;

            return {
              status: response.status,
              body,
              headers,
              responseTime: Math.round(Duration.toMillis(duration)),
            };
          }),
      };
    }),
  }
) {}
