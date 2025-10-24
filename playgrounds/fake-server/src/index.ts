import { sleep } from "bun";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { logger } from "hono/logger";

const app = new Hono();

app.use(logger());

app.use(
  createMiddleware(async (c, next) => {
    const ms = Number(c.req.query("sleep"));

    if (!Number.isNaN(ms)) {
      await sleep(ms);
    }

    await next();
  })
);

app.get("/200", (c) => c.text("200 OK"));
app.get("/201", (c) => c.text("201 Created"));
app.get("/204", (c) => {
  c.status(204);
  return c.body(null);
});

app.get("/301", (c) => c.text("301 Moved Permanently", 301));
app.get("/302", (c) => c.text("302 Found", 302));
app.get("/304", (c) => {
  c.status(304);
  return c.body(null);
});

app.get("/400", (c) => c.text("400 Bad Request", 400));
app.get("/401", (c) => c.text("401 Unauthorized", 401));
app.get("/403", (c) => c.text("403 Forbidden", 403));
app.get("/404", (c) => c.text("404 Not Found", 404));
app.get("/405", (c) => c.text("405 Method Not Allowed", 405));
app.get("/409", (c) => c.text("409 Conflict", 409));
app.get("/422", (c) => c.text("422 Unprocessable Entity", 422));
app.get("/429", (c) => c.text("429 Too Many Requests", 429));

app.get("/500", (c) => c.text("500 Internal Server Error", 500));
app.get("/502", (c) => c.text("502 Bad Gateway", 502));
app.get("/503", (c) => c.text("503 Service Unavailable", 503));
app.get("/504", (c) => c.text("504 Gateway Timeout", 504));

export default {
  port: 4000,
  fetch: app.fetch,
};
