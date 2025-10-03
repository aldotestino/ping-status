import { useQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { CircleSlash, Filter, PartyPopper } from "lucide-react";
import { z } from "zod/v4";
import { IncidentCard } from "@/components/incident-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/incidents")({
  validateSearch: z.object({
    status: z.enum(["open", "closed", "all"]).default("open"),
  }),
  search: {
    middlewares: [
      stripSearchParams({
        status: "open",
      }),
    ],
  },
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
          Last{" "}
          <span className="font-semibold text-foreground">10 incidents</span>{" "}
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
            <DropdownMenuRadioGroup
              onValueChange={(value) =>
                navigate({
                  search: { status: value as "open" | "closed" | "all" },
                })
              }
              value={status}
            >
              <DropdownMenuRadioItem value="open">Open</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="closed">
                Closed
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
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
        <Card className="border-dashed">
          <CardContent className="grid place-items-center gap-2 text-muted-foreground">
            {status === "open" ? (
              <PartyPopper className="size-10" />
            ) : (
              <CircleSlash className="size-10" />
            )}
            <p>No incidents found</p>
          </CardContent>
        </Card>
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
