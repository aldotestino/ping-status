import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { client } from "@/lib/orpc";
import { cn } from "@/lib/utils";

type MonitorStatusProps = Awaited<ReturnType<typeof client.history>>[number];
type MonitorStatusDay = MonitorStatusProps["days"][number];

function getColors({ fail, success, total }: MonitorStatusDay) {
  return {
    "bg-muted": total === 0,
    "bg-green-600/80": total > 0 && success === total,
    "bg-yellow-600/80": fail >= 1,
    "bg-red-600/80": fail > 10,
  };
}

function getDescription({ fail, success, total }: MonitorStatusDay) {
  if (total === 0) {
    return "Missing";
  }

  if (success === total) {
    return "Operational";
  }

  if (fail > 10) {
    return "Partial Outage";
  }

  return "Degraded Performance";
}

function MonitorStatusDay(v: MonitorStatusDay) {
  return (
    <Tooltip key={v.day}>
      <TooltipTrigger asChild>
        <div className={cn("h-full rounded-full", getColors(v))} />
      </TooltipTrigger>
      <TooltipContent
        arrow={false}
        className="bg-background text-foreground shadow"
        sideOffset={4}
      >
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <div className={cn("h-full w-1 rounded-full", getColors(v))} />
          <div className="space-y-0.5">
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium text-sm">{getDescription(v)}</span>
              <span className="text-muted-foreground">
                {format(v.day, "MMM d")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>
                <span className="font-mono text-green-600/80 text-sm">
                  {v.total}
                </span>{" "}
                requests
              </span>
              <span>
                <span className="font-mono text-red-600/80 text-sm">
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

function MonitorStatus({ days, monitorName, successRate }: MonitorStatusProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="font-semibold">{monitorName}</span>
        <span className="text-muted-foreground text-sm">
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

export default MonitorStatus;
