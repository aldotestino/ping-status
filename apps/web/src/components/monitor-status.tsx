import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { client } from "@/lib/orpc";
import { cn } from "@/lib/utils";

function MonitorStatus({
  days,
  monitorName,
  successRate,
}: Awaited<ReturnType<typeof client.history>>[number]) {
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
          <Tooltip key={v.day}>
            <TooltipTrigger asChild>
              <div
                className={cn("h-full rounded-full", {
                  "bg-muted": v.total === 0,
                  "bg-green-600/80": v.total > 0 && v.success === v.total,
                  "bg-yellow-600/80": v.fail >= 1,
                  "bg-red-600/80": v.fail > 10,
                })}
              />
            </TooltipTrigger>
            <TooltipContent
              arrow={false}
              className="bg-background text-foreground shadow"
              sideOffset={4}
            >
              <div className="grid grid-cols-[auto_1fr] gap-2">
                <div
                  className={cn("h-full w-1 rounded-full", {
                    "bg-muted": v.total === 0,
                    "bg-green-600/80": v.success === v.total,
                    "bg-yellow-600/80": v.fail >= 1,
                    "bg-red-600/80": v.fail > 10,
                  })}
                />
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium text-sm">Operational</span>
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
