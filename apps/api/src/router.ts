import { implement } from "@orpc/server";
import contract from "@/contract";

const router = implement(contract);

const health = router.health.handler(() => ({
  name: "ping-status",
  version: "1.0.0",
  date: new Date().toISOString(),
}));

export default {
  health,
};
