import { format, formatDistance } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { client } from "@/lib/orpc";
import { cn } from "@/lib/utils";

type MonitorHistoryProps = Awaited<ReturnType<typeof client.history>>[number];
type MonitorStatusDay = MonitorHistoryProps["days"][number];

function getColors(m: MonitorStatusDay) {
  return {
    "bg-muted-foreground/20 data-[state=delayed-open]:bg-muted-foreground/30":
      m.total === 0,
    "bg-monitor-status-operational/90 data-[state=delayed-open]:bg-monitor-status-operational":
      m.total > 0 && m.operational === m.total,
    "bg-monitor-status-degraded/90 data-[state=delayed-open]:bg-monitor-status-degraded":
      m.degraded >= 1,
    "bg-monitor-status-down/90 data-[state=delayed-open]:bg-monitor-status-down":
      m.down >= 1,
  };
}

function getDescription(m: MonitorStatusDay) {
  if (m.total === 0) {
    return "Missing";
  }

  if (m.down >= 1) {
    return "Downtime";
  }

  if (m.degraded >= 1) {
    return "Degraded";
  }

  return "Operational";
}

function MonitorStatusDay(v: MonitorStatusDay) {
  return (
    <Tooltip delayDuration={200} key={v.day}>
      <TooltipTrigger asChild>
        <div
          className={cn("h-full rounded-full transition-colors", getColors(v))}
        />
      </TooltipTrigger>
      <TooltipContent
        arrow={false}
        className="w-52 border bg-background p-1.5 text-foreground shadow"
        sideOffset={4}
      >
        <div className="space-y-2">
          <div className="grid grid-cols-[auto_1fr] gap-2">
            <div className={cn("h-full w-1 rounded-full", getColors(v))} />
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">
                  {getDescription(v)}
                </span>
                <span className="text-muted-foreground text-sm">
                  {format(v.day, "MMM d")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>
                  <span className="text-monitor-status-operational text-sm">
                    {v.total}
                  </span>{" "}
                  requests
                </span>
                <span>
                  <span className="text-monitor-status-down text-sm">
                    {v.down}
                  </span>{" "}
                  down
                </span>
              </div>
            </div>
          </div>
          {v.totalDowntime && (
            <>
              <Separator />
              <span className="font-medium text-muted-foreground">
                Downtime for {formatDistance(0, v.totalDowntime * 1000)}
              </span>
            </>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function MonitorHistory({
  days,
  monitorName,
  successRate,
  lastStatus,
}: MonitorHistoryProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{monitorName}</span>
          {lastStatus && lastStatus !== "operational" && (
            <Badge
              className={cn("capitalize", {
                "bg-monitor-status-degraded/20 text-monitor-status-degraded":
                  lastStatus === "degraded",
                "bg-monitor-status-down/20 text-monitor-status-down":
                  lastStatus === "down",
              })}
            >
              {lastStatus}
            </Badge>
          )}
        </div>
        <span className="text-muted-foreground text-sm">
          {successRate.toFixed(2)}%
        </span>
      </div>
      <div className="grid h-12 grid-cols-[repeat(45,1fr)] gap-0.5 md:gap-1">
        {days.map((v) => (
          <MonitorStatusDay key={v.day} {...v} />
        ))}
      </div>
      <div className="flex justify-between text-muted-foreground text-sm">
        <span>45 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}

export default MonitorHistory;
