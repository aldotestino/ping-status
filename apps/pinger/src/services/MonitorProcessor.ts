import type { InsertPingResult } from "@ping-status/db/schema";
import type { Monitor } from "@ping-status/monitor";
import { Console, Effect } from "effect";
import { MonitorPinger } from "@/services/MonitorPinger";

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
                success: false,
                incidentId: null,
                message: error.message,
                monitorName: monitor.name,
                responseTime: 0,
                status: 0,
              }),
              onSuccess: (result) => {
                const validation = monitor.validator({
                  body: result.body,
                  headers: result.headers,
                  status: result.status,
                });

                return {
                  success: validation.success,
                  incidentId: null,
                  message: validation.message ?? null,
                  monitorName: monitor.name,
                  responseTime: result.responseTime,
                  status: result.status,
                };
              },
            })
          ),
      };
    }),
  }
) {}
