import { createFileRoute, Link } from "@tanstack/react-router";
import ThemeToggle from "@/components/theme-toggle";

export const Route = createFileRoute("/requests")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="grid h-screen grid-rows-[auto_1fr]">
      <header className="flex h-12 items-center justify-between border-b px-4">
        <Link to="/">
          <h1 className="whitespace-nowrap font-semibold text-xl">
            Ping Status
          </h1>
        </Link>
        <ThemeToggle />
      </header>
      <div className="grid grid-cols-[auto_1fr]">
        <div className="w-64 border-r" />
        <div className="" />
      </div>
    </div>
  );
}
