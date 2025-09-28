import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { client } from "@/lib/orpc";
import { cn } from "@/lib/utils";

type MonitorHistoryProps = Awaited<ReturnType<typeof client.history>>[number];
type MonitorStatusDay = MonitorHistoryProps["days"][number];

function getColors({ fail, success, total }: MonitorStatusDay) {
  return {
    "bg-muted-foreground/20 data-[state=delayed-open]:bg-muted-foreground/30":
      total === 0,
    "bg-monitor-status-operational/90 data-[state=delayed-open]:bg-monitor-status-operational":
      total > 0 && success === total,
    "bg-monitor-status-down/90 data-[state=delayed-open]:bg-monitor-status-down":
      fail >= 1,
  };
}

function getDescription({ success, total }: MonitorStatusDay) {
  if (total === 0) {
    return "Missing";
  }

  if (success === total) {
    return "Operational";
  }

  return "Degraded";
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
        className="w-44 border bg-background p-1.5 text-foreground shadow"
        sideOffset={4}
      >
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <div className={cn("h-full w-1 rounded-full", getColors(v))} />
          <div className="space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">{getDescription(v)}</span>
              <span className="text-muted-foreground text-sm">
                {format(v.day, "MMM d")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>
                <span className="font-mono text-monitor-status-operational text-sm">
                  {v.total}
                </span>{" "}
                requests
              </span>
              <span>
                <span className="font-mono text-monitor-status-down text-sm">
                  {v.fail}
                </span>{" "}
                failed
              </span>
            </div>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function MonitorHistory({
  days,
  monitorName,
  successRate,
}: MonitorHistoryProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="font-semibold">{monitorName}</span>
        <span className="font-mono text-muted-foreground text-sm">
          {successRate.toFixed(2)}%
        </span>
      </div>
      <div className="grid h-12 grid-cols-[repeat(45,1fr)] gap-1">
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
