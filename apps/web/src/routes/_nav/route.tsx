import { createFileRoute, Outlet } from "@tanstack/react-router";
import Nav from "@/components/nav";

export const Route = createFileRoute("/_nav")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <Nav />
      <Outlet />
    </div>
  );
}
