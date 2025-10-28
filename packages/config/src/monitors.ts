import { monitor } from "@ping-status/monitor";

export const monitors = [
  monitor({
    name: "example-monitor",
    url: "http://localhost:4000/200",
    timeout: 2500,
    degradedThreshold: 100,
    validator: ({ status }) =>
      status === 200
        ? { success: true }
        : { success: false, message: "Status is not 200" },
  }),
  monitor({
    name: "example-monitor-2",
    url: "http://localhost:4000/204",
    degradedThreshold: 200,
    validator: ({ status }) =>
      status === 204
        ? { success: true }
        : { success: false, message: "Status is not 204" },
  }),
];
