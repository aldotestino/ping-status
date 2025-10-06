import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { ChevronsUpDown } from "lucide-react";
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
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(
      orpc.requests.queryOptions({
        input: {
          limit: 100,
        },
      })
    ),
  component: RouteComponent,
});

function RouteComponent() {
  const { data: requests } = useSuspenseQuery(
    orpc.requests.queryOptions({
      input: {
        limit: 100,
      },
    })
  );

  return (
    <Table>
      <TableHeader className="bg-muted">
        <TableRow>
          <TableHead className="text-muted-foreground">Monitor</TableHead>
          <TableHead className="cursor-pointer text-muted-foreground hover:text-foreground">
            <div className="flex items-center justify-between">
              <span className="">Date</span>
              <ChevronsUpDown className="size-4" />
            </div>
          </TableHead>
          <TableHead className="text-muted-foreground">Status</TableHead>
          <TableHead className="text-muted-foreground">Method</TableHead>
          <TableHead className="text-muted-foreground">Host</TableHead>
          <TableHead className="text-muted-foreground">Pathname</TableHead>
          <TableHead className="cursor-pointer text-muted-foreground hover:text-foreground">
            <div className="flex items-center justify-between">
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
                className={cn(!request.responseTime && "text-muted-foreground")}
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
  );
}
