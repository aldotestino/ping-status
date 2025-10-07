import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import type { client } from "@/lib/orpc";
import { cn } from "@/lib/utils";

function RequestRow({
  request,
  onSelect,
  isSelect,
}: {
  request: Awaited<ReturnType<typeof client.requests>>["requests"][number];
  onSelect: () => void;
  isSelect: boolean;
}) {
  const url = new URL(request.url);
  return (
    <TableRow
      className={cn(
        "cursor-pointer divide-x data-[selected=true]:bg-muted data-[selected=true]:ring",
        {
          "bg-monitor-status-degraded/10 hover:bg-monitor-status-degraded/20 data-[selected=true]:bg-monitor-status-degraded/20 data-[selected=true]:ring-monitor-status-degraded":
            request.status >= 400 && request.status < 500,
          "bg-monitor-status-down/10 hover:bg-monitor-status-down/20 data-[selected=true]:bg-monitor-status-down/20 data-[selected=true]:ring-monitor-status-down":
            !request.success || (request.status >= 500 && request.status < 600),
        }
      )}
      data-selected={isSelect}
      key={request.id}
      onClick={onSelect}
    >
      <TableCell className="font-medium">{request.monitorName}</TableCell>
      <TableCell>{format(request.createdAt, "LLL d, yyyy HH:mm:ss")}</TableCell>
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
      <TableCell className="text-muted-foreground">{request.method}</TableCell>
      <TableCell>{url.host}</TableCell>
      <TableCell className="max-w-40 truncate">{url.pathname}</TableCell>
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
    </TableRow>
  );
}

export default RequestRow;
