import type { InsertPingResult } from "@ping-status/db/schema";
import type { Monitor } from "@ping-status/monitor";
import { Console, Effect } from "effect";
import { MonitorPinger } from "@/services/monitor-pinger";

export class MonitorProcessor extends Effect.Service<MonitorProcessor>()(
  "MonitorProcessor",
  {
    effect: Effect.gen(function* () {
      const monitorPinger = yield* MonitorPinger;

      return {
        process: (monitor: Monitor): Effect.Effect<InsertPingResult> =>
          monitorPinger.ping(monitor).pipe(
            Effect.tapBoth({
              onFailure: (error) =>
                Console.warn(
                  `[${monitor.name}] Error pinging: ${error.message}`
                ),
              onSuccess: (result) =>
                Console.log(
                  `[${monitor.name}] Pinged successfully (${result.status}) in ${result.responseTime}ms`
                ),
            }),
            Effect.match({
              onFailure: (error) => ({
                status: "down",
                incidentId: null,
                message: error.message,
                monitorName: monitor.name,
                responseTime: 0,
                statusCode: 0,
              }),
              onSuccess: (result) => {
                const validation = monitor.validator({
                  body: result.body,
                  headers: result.headers,
                  status: result.status,
                });

                if (!validation.success) {
                  return {
                    status: "down",
                    statusCode: result.status,
                    message: validation.message,
                    monitorName: monitor.name,
                    responseTime: result.responseTime,
                    incidentId: null,
                  };
                }

                if (
                  monitor.degradedThreshold &&
                  result.responseTime > monitor.degradedThreshold
                ) {
                  return {
                    status: "degraded",
                    statusCode: result.status,
                    monitorName: monitor.name,
                    responseTime: result.responseTime,
                    message: null,
                    incidentId: null,
                  };
                }

                return {
                  status: "operational",
                  statusCode: result.status,
                  incidentId: null,
                  monitorName: monitor.name,
                  responseTime: result.responseTime,
                  message: null,
                };
              },
            })
          ),
      };
    }),
  }
) {}
