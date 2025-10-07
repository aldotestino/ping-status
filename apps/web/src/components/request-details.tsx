import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Item, ItemContent } from "@/components/ui/item";
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { client } from "@/lib/orpc";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
      {typeof children === "string" && (label.length + children.length) > 40 ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="min-w-0 truncate">{children}</div>
          </TooltipTrigger>
          <TooltipContent>
            {children}
          </TooltipContent>
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
    <SheetContent className="grid w-[500px] grid-rows-[auto_1fr] gap-0 overflow-y-hidden">
      <SheetHeader>
        <SheetTitle>{request?.monitorName}</SheetTitle>
        <SheetDescription className="sr-only">Description</SheetDescription>
      </SheetHeader>
      <div className="overflow-y-auto p-4">
        <div className="divide-y">
          <RequestDetailsItem label="Request ID">
            #{request.id}
          </RequestDetailsItem>
          <RequestDetailsItem label="Date">
            {format(request.createdAt, "LLL d, yyyy HH:mm:ss")}
          </RequestDetailsItem>
          <RequestDetailsItem label="Status">
            <span
              className={cn({
                "text-monitor-status-operational":
                  request.status >= 200 && request.status < 300,
                "text-monitor-status-degraded":
                  request.status >= 400 && request.status < 500,
                "text-monitor-status-down":
                  request.status >= 500 && request.status < 600,
              })}
            >
              {request.status || "-"}
            </span>
          </RequestDetailsItem>
          <RequestDetailsItem label="Method">
            {request.method}
          </RequestDetailsItem>
          <RequestDetailsItem label="Host">{url.host}</RequestDetailsItem>
          <RequestDetailsItem label="Pathname">
            {url.pathname}
          </RequestDetailsItem>
          <RequestDetailsItem label="Response Time">
            <span>
              {request.responseTime || "-"}
              {request.responseTime > 0 && (
                <span className="text-muted-foreground text-sm">ms</span>
              )}
            </span>
          </RequestDetailsItem>
          <RequestDetailsItem label="Validation">
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
          </RequestDetailsItem>
          {request.incidentId && (
            <>
              <RequestDetailsItem label="Incident ID">
                #{request.incidentId}
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
