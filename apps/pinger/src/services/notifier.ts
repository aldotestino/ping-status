import { HttpClient, HttpClientRequest } from "@effect/platform";
import { env } from "@ping-status/config/env";
import type { Incident, PingResult } from "@ping-status/db/schema";
import { formatDistance } from "date-fns";
import { Console, Duration, Effect, pipe, Schedule } from "effect";
import { table } from "table";

type OpenIncident = Incident &
  Pick<PingResult, "statusCode" | "responseTime" | "message">;

function formatOpenIncidentsMessage(incidents: OpenIncident[]) {
  const tableData = [
    ["Service Name", "#ID", "Status", "Status Code", "Message"],
    ...incidents.map((i) => [
      i.monitorName,
      i.id,
      i.type === "down" ? "🔴 Down" : "🟡 Degraded",
      i.statusCode,
      i.message,
    ]),
  ];

  return {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*🔴 Service Health Alert - ${incidents.length} incidents opened*`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `\`\`\`${table(tableData)}\`\`\``,
        },
      },
    ],
  };
}

function formatClosedIncidentsMessage(incidents: Incident[]) {
  const tableData = [
    ["Service Name", "#ID", "Status", "Duration"],
    ...incidents.map((i) => [
      i.monitorName,
      i.id,
      "🟢 Operational",
      formatDistance(i.closedAt || new Date(), i.openedAt),
    ]),
  ];

  return {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*🟢 Service Health Alert - ${incidents.length} incidents closed*`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `\`\`\`${table(tableData)}\`\`\``,
        },
      },
    ],
  };
}

export class Notifier extends Effect.Service<Notifier>()("Notifier", {
  effect: Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;

    const notify = (message: unknown) =>
      pipe(
        client.execute(
          pipe(
            // biome-ignore lint/style/noNonNullAssertion: slack webhook will be defined if the service is active
            HttpClientRequest.post(env.SLACK_WEBHOOK_URL!),
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
