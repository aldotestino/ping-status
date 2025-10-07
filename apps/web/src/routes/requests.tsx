import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  stripSearchParams,
} from "@tanstack/react-router";
import { format } from "date-fns";
import { ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import z from "zod/v4";
import RequestDetails from "@/components/request-details";
import RequestsFilters from "@/components/requests-filters";
import { Badge } from "@/components/ui/badge";
import { Sheet } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { client, orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/requests")({
  validateSearch: z.object({
    monitorName: z.array(z.string().trim().min(1)).default([]),
    status: z.array(z.enum(["2xx", "4xx", "5xx"])).default([]),
    validation: z.array(z.enum(["success", "fail"])).default([]),
    incidentId: z.coerce.number().min(0).optional(),
    sort: z
      .object({
        field: z.enum(["createdAt", "responseTime"]).default("createdAt"),
        order: z.enum(["asc", "desc"]).default("desc"),
      })
      .default({ field: "createdAt", order: "desc" }),
  }),
  search: {
    middlewares: [
      stripSearchParams({
        monitorName: [],
        status: [],
        validation: [],
        sort: {
          field: "createdAt",
          order: "desc",
        },
      }),
    ],
  },
  loaderDeps: ({ search }) => search,
  loader: ({ context: { queryClient }, deps }) =>
    queryClient.ensureInfiniteQueryData(orpc.requests.infiniteOptions({
      initialPageParam: 1,
      getNextPageParam: (last) => last.meta.nextPage,
      getPreviousPageParam: (last) => last.meta.previousPage,
      input: (pageParam) => ({
        ...deps,
        limit: 100,
        page: pageParam,
      })
    })),
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = useSuspenseInfiniteQuery(
    orpc.requests.infiniteOptions({
      input: (pageParam) => ({
        ...search,
        limit: 100,
        page: pageParam,
      }),
      initialPageParam: 1,
      getNextPageParam: (last) => last.meta.nextPage,
      getPreviousPageParam: (last) => last.meta.previousPage,
    })
  );

  const [selectedRequest, setSelectedRequest] = useState<Awaited<ReturnType<typeof client.requests>>["requests"][number] | null>(null);

  const handleSort = (field: "createdAt" | "responseTime") => {
    const newSort = {
      field,
      order: search.sort.order === "asc" ? "desc" : ("asc" as "asc" | "desc"),
    };
    navigate({ search: { ...search, sort: newSort } });
  };

  return (
    <>
      <div className="grid h-screen grid-cols-[auto_1fr] overflow-hidden">
        <div className="grid w-72 grid-rows-[auto_1fr_auto] overflow-hidden border-r">
          <div className="flex items-center p-2">
            <Link to="/">
              <h1 className="font-semibold text-lg">Ping Status</h1>
            </Link>
          </div>
          <div className="overflow-y-auto pt-0">
            <RequestsFilters />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="sticky top-0 bg-muted hover:bg-muted">
              <TableHead className="text-muted-foreground">Monitor</TableHead>
              <TableHead
                className="cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={() => handleSort("createdAt")}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="">Date</span>
                  <ChevronsUpDown className="size-4" />
                </div>
              </TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Method</TableHead>
              <TableHead className="text-muted-foreground">Host</TableHead>
              <TableHead className="text-muted-foreground">Pathname</TableHead>
              <TableHead
                className="cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={() => handleSort("responseTime")}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>Response Time</span>
                  <ChevronsUpDown className="size-4" />
                </div>
              </TableHead>
              <TableHead className="text-muted-foreground">
                Validation
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.pages.flatMap((page) => page.requests).map((request) => {
              const url = new URL(request.url);
              return (
                <TableRow
                  className={cn(
                    "cursor-pointer data-[selected=true]:bg-muted data-[selected=true]:ring",
                    {
                      "bg-monitor-status-degraded/10 hover:bg-monitor-status-degraded/20 data-[selected=true]:bg-monitor-status-degraded/20 data-[selected=true]:ring-monitor-status-degraded":
                        request.status >= 400 && request.status < 500,
                      "bg-monitor-status-down/10 hover:bg-monitor-status-down/20 data-[selected=true]:bg-monitor-status-down/20 data-[selected=true]:ring-monitor-status-down":
                        !request.success ||
                        (request.status >= 500 && request.status < 600),
                    }
                  )}
                  data-selected={request.id === selectedRequest?.id}
                  key={request.id}
                  onClick={() =>
                    setSelectedRequest((prevReq) =>
                      prevReq?.id === request.id ? null : request
                    )
                  }
                >
                  <TableCell className="font-medium">
                    {request.monitorName}
                  </TableCell>
                  <TableCell>
                    {format(request.createdAt, "LLL d, yyyy HH:mm:ss")}
                  </TableCell>
                  <TableCell
                    className={cn(
                      {
                        "text-monitor-status-operational":
                          request.status >= 200 && request.status < 300,
                        "text-monitor-status-degraded":
                          request.status >= 400 && request.status < 500,
                        "text-monitor-status-down":
                          request.status >= 500 && request.status < 600,
                      },
                      !request.status && "text-muted-foreground"
                    )}
                  >
                    {request.status || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {request.method}
                  </TableCell>
                  <TableCell>{url.host}</TableCell>
                  <TableCell>{url.pathname}</TableCell>
                  <TableCell
                    className={cn(
                      !request.responseTime && "text-muted-foreground"
                    )}
                  >
                    {request.responseTime || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn({
                        "bg-monitor-status-operational/20 text-monitor-status-operational":
                          request.success,
                        "bg-monitor-status-down/20 text-monitor-status-down":
                          !request.success,
                      })}
                    >
                      {request.success ? "Success" : "Fail"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
            {hasNextPage && <TableRow><TableCell colSpan={8} className="text-center cursor-pointer" onClick={() => fetchNextPage()}>{
              isFetchingNextPage ? "Loading more..." : "Load more..."}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <Sheet
        onOpenChange={() => setSelectedRequest(null)}
        open={!!selectedRequest}
      >
        <RequestDetails request={selectedRequest} />
      </Sheet>
    </>
  );
}
