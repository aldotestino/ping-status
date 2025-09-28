import { eachDayOfInterval, format, subDays } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const end = new Date();
const start = subDays(end, 44);
const days = eachDayOfInterval({ start, end });

const pingIntervalMinutes = 10;
const requestsInADay = (24 * 60) / pingIntervalMinutes;

const values = days.map((day) => {
  let success = requestsInADay;

  if (Math.random() > 0.8) {
    success -= Math.floor(Math.random() * 20);
  }

  const failures = requestsInADay - success;

  return {
    date: day,
    total: requestsInADay,
    success,
    failures,
  };
});

const totalRequests = values.reduce((acc, v) => acc + v.total, 0);
const totalSuccess = values.reduce((acc, v) => acc + v.success, 0);

const successRate = (totalSuccess / totalRequests) * 100;

function MonitorStatus() {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="font-semibold">example-monitor</span>
        <span className="text-muted-foreground text-sm">
          {successRate.toFixed(2)}%
        </span>
      </div>
      <div className="grid h-12 grid-cols-[repeat(45,1fr)] gap-1">
        {values.map((v) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: no ids yet
          <Tooltip key={v.date.toISOString()}>
            <TooltipTrigger asChild>
              <div
                className={cn("h-full rounded-full", {
                  "bg-green-600/80": v.success === v.total,
                  "bg-yellow-600/80": v.failures >= 1,
                  "bg-red-600/80": v.failures > 10,
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
                    "bg-green-600/80": v.success === v.total,
                    "bg-yellow-600/80": v.failures >= 1,
                    "bg-red-600/80": v.failures > 10,
                  })}
                />
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium text-sm">Operational</span>
                    <span className="text-muted-foreground">
                      {format(v.date, "MMM d")}
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
                        {v.failures}
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
