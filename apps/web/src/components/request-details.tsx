import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Item, ItemContent } from "@/components/ui/item";
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { client } from "@/lib/orpc";
import { cn } from "@/lib/utils";

type RequestDetailsProps = {
  request:
    | Awaited<ReturnType<typeof client.requests>>["requests"][number]
    | null;
};

function RequestDetailsItem({
  label,
  orientation = "horizontal",
  children,
}: {
  label: string;
  orientation?: "horizontal" | "vertical";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("flex items-center justify-between gap-4 py-2 text-sm", {
        "flex-col items-start": orientation === "vertical",
      })}
    >
      <p className="text-muted-foreground">{label}</p>
      {typeof children === "string" && label.length + children.length > 40 ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="min-w-0 truncate">{children}</div>
          </TooltipTrigger>
          <TooltipContent>{children}</TooltipContent>
        </Tooltip>
      ) : (
        children
      )}
    </div>
  );
}

function RequestDetails({ request }: RequestDetailsProps) {
  if (!request) {
    return null;
  }

  const url = new URL(request.url);

  return (
    <SheetContent className="grid grid-rows-[auto_1fr] gap-0 overflow-y-hidden">
      <SheetHeader>
        <SheetTitle>{request?.monitorName}</SheetTitle>
        <SheetDescription className="sr-only">Description</SheetDescription>
      </SheetHeader>
      <div className="overflow-y-auto p-4">
        <div className="divide-y">
          <RequestDetailsItem label="Request ID">
            <div className="space-x-0.5">
              <span className="text-muted-foreground">#</span>
              <span>{request.id}</span>
            </div>
          </RequestDetailsItem>
          <RequestDetailsItem label="Date">
            {format(request.createdAt, "LLL d, yyyy HH:mm:ss")}
          </RequestDetailsItem>
          <RequestDetailsItem label="Status">
            <span
              className={cn({
                "text-monitor-status-operational":
                  request.statusCode >= 200 && request.statusCode < 300,
                "text-monitor-status-degraded":
                  request.statusCode >= 400 && request.statusCode < 500,
                "text-monitor-status-down":
                  request.statusCode >= 500 && request.statusCode < 600,
              })}
            >
              {request.statusCode || "-"}
            </span>
          </RequestDetailsItem>
          <RequestDetailsItem label="Method">
            {request.method}
          </RequestDetailsItem>
          <RequestDetailsItem label="Host">{url.host}</RequestDetailsItem>
          <RequestDetailsItem label="Pathname">
            {url.pathname}
          </RequestDetailsItem>
          {url.searchParams.size > 0 && (
            <RequestDetailsItem label="Search">
              {url.searchParams.toString()}
            </RequestDetailsItem>
          )}
          <RequestDetailsItem label="Response Time">
            <div className="space-x-0.5">
              <span>{request.responseTime || "-"}</span>
              {request.responseTime > 0 && (
                <span className="text-muted-foreground text-sm">ms</span>
              )}
            </div>
          </RequestDetailsItem>
          <RequestDetailsItem label="Status">
            <Badge
              className={cn("capitalize", {
                "bg-monitor-status-operational/20 text-monitor-status-operational":
                  request.status === "operational",
                "bg-monitor-status-down/20 text-monitor-status-down":
                  request.status === "down",
                "bg-monitor-status-degraded/20 text-monitor-status-degraded":
                  request.status === "degraded",
              })}
            >
              {request.status}
            </Badge>
          </RequestDetailsItem>
          {request.incidentId && (
            <>
              <RequestDetailsItem label="Incident ID">
                <div className="space-x-0.5">
                  <span className="text-muted-foreground">#</span>
                  <span>{request.incidentId}</span>
                </div>
              </RequestDetailsItem>
              <RequestDetailsItem label="Message" orientation="vertical">
                <Item
                  className="w-full bg-monitor-status-down/20 text-monitor-status-down"
                  variant="muted"
                >
                  <ItemContent className="break-all">
                    {request.message}
                  </ItemContent>
                </Item>
              </RequestDetailsItem>
            </>
          )}
        </div>
      </div>
    </SheetContent>
  );
}

export default RequestDetails;
