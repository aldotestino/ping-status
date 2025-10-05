import { useQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { CircleSlash, Filter, PartyPopper } from "lucide-react";
import { z } from "zod/v4";
import { IncidentCard } from "@/components/incident-card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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

export const Route = createFileRoute("/incidents")({
  validateSearch: z.object({
    status: z
      .array(z.enum(["open", "closed"]))
      .max(2)
      .default(["open"])
      .transform((arr) => Array.from(new Set(arr))),
  }),
  search: {
    middlewares: [
      stripSearchParams({
        status: [],
      }),
    ],
  },
  // loaderDeps: ({ search }) => search,
  // loader: ({ context: { queryClient }, deps }) =>
  //   queryClient.ensureQueryData(
  //     orpc.incidents.queryOptions({ input: { status: deps.status } })
  //   ),
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { status } = Route.useSearch();

  const { data: incidents, isLoading } = useQuery(
    orpc.incidents.queryOptions({ input: { status } })
  );

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          Last 10{" "}
          <span className="font-semibold text-foreground">
            {status.length === 2 ? "All" : status.join(", ")} incidents
          </span>{" "}
          and their durations.
        </p>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline">
              <Filter />
              Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
      </div>

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
            <Skeleton className="h-40" key={index} />
          ))}
        </div>
      )}

      {incidents?.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
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
              {status.length === 2 && "Squeaky clean incident history"}
            </EmptyTitle>
            <EmptyDescription>
              {status.length === 1 &&
                status.includes("open") &&
                "Your services are running smoother than a freshly zambonied ice rink. Our monitoring hamsters are getting bored over here!"}
              {status.length === 1 &&
                status.includes("closed") &&
                "No resolved incidents to show. Either everything's been perfect, or we just got started!"}
              {status.length === 2 &&
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
