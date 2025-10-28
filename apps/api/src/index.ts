import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { env } from "@ping-status/config/env";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { serveWebApp } from "@/middlewares";
import router from "@/router";

const handler = new OpenAPIHandler(router, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
      docsPath: "/docs",
      specGenerateOptions: {
        info: {
          title: "Ping Status API",
          version: "1.0.0",
        },
        servers: [{ url: "/api" }],
      },
    }),
  ],
});

const api = new Hono()
  .use("*", serveWebApp)
  .basePath("/api")
  .use(logger())
  .use("/*", async (c, next) => {
    const { matched, response } = await handler.handle(c.req.raw, {
      prefix: "/api",
      context: {
        headers: c.req.raw.headers,
      },
    });

    if (matched) {
      return c.newResponse(response.body, response);
    }

    await next();
  });

export default {
  port: env.PORT,
  fetch: api.fetch,
};
