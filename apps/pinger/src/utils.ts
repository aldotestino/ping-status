import type { Monitor } from "@ping-status/monitor";

export const toFetchParams = (monitor: Monitor) => ({
  method: monitor.method,
  headers: monitor.headers,
  body: monitor.body
    ? // biome-ignore lint/style/noNestedTernary: this is nice
      typeof monitor.body === "string"
      ? monitor.body
      : JSON.stringify(monitor.body)
    : undefined,
});
