import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/monitors")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Monitors</div>;
}
