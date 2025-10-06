import { useSuspenseQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  stripSearchParams,
} from "@tanstack/react-router";
import { format } from "date-fns";
import { ChevronsUpDown } from "lucide-react";
import z from "zod/v4";
import RequestsFilters from "@/components/requests-filters";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/requests")({
  validateSearch: z.object({
    limit: z.coerce.number().min(1).max(100).default(100),
    monitorName: z.array(z.string().trim().min(1)).default([]),
    status: z.array(z.enum(["2xx", "4xx", "5xx"])).default([]),
    validation: z.array(z.enum(["success", "fail"])).default([]),
    page: z.coerce.number().min(1).default(1),
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
        limit: 100,
        monitorName: [],
        status: [],
        validation: [],
        page: 1,
        sort: {
          field: "createdAt",
          order: "desc",
        },
      }),
    ],
  },
  loaderDeps: ({ search }) => search,
  loader: ({ context: { queryClient }, deps }) =>
    queryClient.ensureQueryData(orpc.requests.queryOptions({ input: deps })),
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  const { data: requests } = useSuspenseQuery(
    orpc.requests.queryOptions({
      input: search,
    })
  );

  return (
    <div className="grid h-screen grid-cols-[auto_1fr]">
      <div className="grid w-64 grid-rows-[auto_1fr] border-r">
        <div className="flex h-16 items-center border-b px-4">
          <Link to="/">
            <h1 className="font-semibold text-lg">Ping Status</h1>
          </Link>
        </div>
        <div className="p-2">
          <RequestsFilters />
        </div>
      </div>
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead className="text-muted-foreground">Monitor</TableHead>
            <TableHead className="cursor-pointer text-muted-foreground hover:text-foreground">
              <div className="flex items-center justify-between gap-2">
                <span className="">Date</span>
                <ChevronsUpDown className="size-4" />
              </div>
            </TableHead>
            <TableHead className="text-muted-foreground">Status</TableHead>
            <TableHead className="text-muted-foreground">Method</TableHead>
            <TableHead className="text-muted-foreground">Host</TableHead>
            <TableHead className="text-muted-foreground">Pathname</TableHead>
            <TableHead className="cursor-pointer text-muted-foreground hover:text-foreground">
              <div className="flex items-center justify-between gap-2">
                <span>Response Time</span>
                <ChevronsUpDown className="size-4" />
              </div>
            </TableHead>
            <TableHead className="text-muted-foreground">Validation</TableHead>
            <TableHead className="text-muted-foreground">Incident ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => {
            const url = new URL(request.url);
            return (
              <TableRow
                className={cn({
                  "bg-monitor-status-degraded/10 hover:bg-monitor-status-degraded/20":
                    request.status >= 400 && request.status < 500,
                  "bg-monitor-status-down/10 hover:bg-monitor-status-down/20":
                    !request.success ||
                    (request.status >= 500 && request.status < 600),
                })}
                key={request.id}
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
                <TableCell>{request.incidentId}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
