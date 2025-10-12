import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import type { client } from "@/lib/orpc";
import { cn } from "@/lib/utils";

function RequestRow({
  request,
  onSelect,
  isSelected,
}: {
  request: Awaited<ReturnType<typeof client.requests>>["requests"][number];
  onSelect: () => void;
  isSelected: boolean;
}) {
  const url = new URL(request.url);
  return (
    <TableRow
      className={cn("cursor-pointer data-[selected=true]:bg-muted", {
        "bg-monitor-status-degraded/10 hover:bg-monitor-status-degraded/20 data-[selected=true]:bg-monitor-status-degraded/20 data-[selected=true]:ring-monitor-status-degraded":
          request.status === "degraded",
        "bg-monitor-status-down/10 hover:bg-monitor-status-down/20 data-[selected=true]:bg-monitor-status-down/20 data-[selected=true]:ring-monitor-status-down":
          request.status === "down",
      })}
      data-selected={isSelected}
      key={request.id}
      onClick={onSelect}
    >
      <TableCell className="border-r font-medium">
        {request.monitorName}
      </TableCell>
      <TableCell className="border-r">
        {format(request.createdAt, "LLL d, yyyy HH:mm:ss")}
      </TableCell>
      <TableCell
        className={cn(
          "border-r",
          {
            "text-monitor-status-operational":
              request.statusCode >= 200 && request.statusCode < 300,
            "text-monitor-status-degraded":
              request.statusCode >= 400 && request.statusCode < 500,
            "text-monitor-status-down":
              request.statusCode >= 500 && request.statusCode < 600,
          },
          !request.status && "text-muted-foreground"
        )}
      >
        {request.statusCode || "-"}
      </TableCell>
      <TableCell className="border-r text-muted-foreground">
        {request.method}
      </TableCell>
      <TableCell className="border-r">{url.host}</TableCell>
      <TableCell className="max-w-40 truncate border-r">
        {url.pathname}
      </TableCell>
      <TableCell
        className={cn(
          "border-r",
          !request.responseTime && "text-muted-foreground"
        )}
      >
        {request.responseTime || "-"}
      </TableCell>
      <TableCell>
        <Badge
          className={cn("capitalize", {
            "bg-monitor-status-operational/20 text-monitor-status-operational":
              request.status === "operational",
            "bg-monitor-status-degraded/20 text-monitor-status-degraded":
              request.status === "degraded",
            "bg-monitor-status-down/20 text-monitor-status-down":
              request.status === "down",
          })}
        >
          {request.status}
        </Badge>
      </TableCell>
    </TableRow>
  );
}

export default RequestRow;
