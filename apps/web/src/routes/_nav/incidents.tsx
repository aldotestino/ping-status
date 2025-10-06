import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { CircleSlash, Filter, PartyPopper } from "lucide-react";
import { z } from "zod/v4";
import { IncidentCard } from "@/components/incident-card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/_nav/incidents")({
  validateSearch: z.object({
    status: z
      .array(z.enum(["open", "closed"]))
      .max(2)
      .default(["open"])
      .transform((arr) => Array.from(new Set(arr)).sort()),
  }),
  search: {
    middlewares: [
      stripSearchParams({
        status: ["open"],
      }),
    ],
  },
  loaderDeps: ({ search }) => search,
  loader: ({ context: { queryClient }, deps }) =>
    queryClient.ensureQueryData(orpc.incidents.queryOptions({ input: deps })),
  component: RouteComponent,
  pendingComponent: () => (
    <div className="mx-auto max-w-screen-lg space-y-4 px-4 py-10 md:px-6">
      {Array.from({ length: 3 }).map((_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
        <Skeleton className="h-40" key={index} />
      ))}
    </div>
  ),
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { status } = Route.useSearch();

  const { data: incidents } = useSuspenseQuery(
    orpc.incidents.queryOptions({ input: { status } })
  );

  return (
    <main className="mx-auto max-w-screen-lg space-y-6 px-4 py-10 md:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Last 10</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline">
                <Filter />
                {status.length === 1 ? status[0] : "closed, open"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Status
              </DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={status.includes("open")}
                onCheckedChange={(checked) => {
                  const newStatus = checked
                    ? [...new Set([...status, "open" as const])]
                    : status.filter((s) => s !== "open");
                  navigate({ search: { status: newStatus } });
                }}
              >
                Open
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={status.includes("closed")}
                onCheckedChange={(checked) => {
                  const newStatus = checked
                    ? [...new Set([...status, "closed" as const])]
                    : status.filter((s) => s !== "closed");
                  navigate({ search: { status: newStatus } });
                }}
              >
                Closed
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <span>
            <span className="font-semibold">incidents</span> and their
            durations.
          </span>
        </div>
      </div>

      {incidents.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia>
              {status.length === 1 && status.includes("open") ? (
                <PartyPopper />
              ) : (
                <CircleSlash />
              )}
            </EmptyMedia>
            <EmptyTitle>
              {status.length === 1 &&
                status.includes("open") &&
                "Everything's vibing perfectly!"}
              {status.length === 1 &&
                status.includes("closed") &&
                "No closed incidents"}
              {(status.length === 0 || status.length === 2) &&
                "Squeaky clean incident history"}
            </EmptyTitle>
            <EmptyDescription>
              {status.length === 1 &&
                status.includes("open") &&
                "Your services are running smoother than a freshly zambonied ice rink. Our monitoring hamsters are getting bored over here!"}
              {status.length === 1 &&
                status.includes("closed") &&
                "No resolved incidents to show. Either everything's been perfect, or we just got started!"}
              {(status.length === 0 || status.length === 2) &&
                "Not a single incident in sight. You're either a DevOps wizard or this is a brand new setup. Either way, impressive!"}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-4">
          {incidents?.map((incident) => (
            <IncidentCard {...incident} key={incident.id} />
          ))}
        </div>
      )}
    </main>
  );
}
