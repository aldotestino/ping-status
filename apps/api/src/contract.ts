import { oc } from "@orpc/contract";
import { z } from "zod";

const health = oc
  .route({
    tags: ["health"],
    method: "GET",
    path: "/health",
  })
  .output(
    z.object({
      name: z.literal("ping-status"),
      version: z.string(),
      date: z.iso.datetime(),
    })
  );

export default {
  health,
};
