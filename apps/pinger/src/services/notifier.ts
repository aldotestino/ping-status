import { HttpClient, HttpClientRequest } from "@effect/platform";
import { env } from "@ping-status/config/env";
import type { Incident } from "@ping-status/db/schema";
import { Console, Duration, Effect, pipe, Schedule } from "effect";
import {
  formatClosedIncidentsMessage,
  formatOpenIncidentsMessage,
  type OpenIncident,
} from "@/utils/slack";

export class Notifier extends Effect.Service<Notifier>()("Notifier", {
  effect: Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;

    const notify = (message: unknown) =>
      pipe(
        client.execute(
          pipe(
            HttpClientRequest.post(env.SLACK_WEBHOOK_URL ?? ""), // if we reach this the SLACK_WEBHOOK_URL is defined
            HttpClientRequest.bodyUnsafeJson(message)
          )
        ),
        Effect.tap((res) => Console.log(`Notification sent: ${res.status}`)),
        Effect.andThen((res) => res.text),
        Effect.tap((res) => Console.log(`Notification sent: ${res}`)),
        Effect.tapError((err) =>
          Console.warn(`Failed to notify: ${err.message}`)
        ),
        Effect.retry({
          times: 3,
          schedule: Schedule.exponential(Duration.millis(1000)),
        }),
        Effect.orDie
      );

    return {
      notifyOpenIncidents: (openIncidents: OpenIncident[]) =>
        notify(formatOpenIncidentsMessage(openIncidents)),
      notifyClosedIncidents: (closedIncidents: Incident[]) =>
        notify(formatClosedIncidentsMessage(closedIncidents)),
    };
  }),
}) {}
