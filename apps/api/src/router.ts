import { implement } from "@orpc/server";
import { monitors as monitorsArray } from "@ping-status/monitor";
import contract from "@/contract";

const router = implement(contract);

const health = router.health.handler(() => ({
  name: "ping-status",
  version: "1.0.0",
  date: new Date().toISOString(),
}));

const monitors = router.monitors.handler(() =>
  monitorsArray.map(({ validator: _, ...m }) => m)
);

export default {
  health,
  monitors,
};
