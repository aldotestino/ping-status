import { Hono } from "hono";

const api = new Hono().basePath("/api").get("/", (c) =>
  c.json({
    name: "ping-status",
    version: "1.0.0",
    date: new Date().toISOString(),
  })
);

export default api;
