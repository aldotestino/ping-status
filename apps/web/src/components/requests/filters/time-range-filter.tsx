import { endOfDay, format, startOfDay, subDays, subHours } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDebounce } from "@/hooks/use-debouce";
import { useHotKeys } from "@/hooks/use-hot-keys";

function TimeRangeFilter({
  timeRange,
  onValuesChange,
}: {
  timeRange: {
    from?: number;
    to?: number;
  };
  onValuesChange: (timeRange: { from?: number; to?: number }) => void;
}) {
  const handleDateRangeChange = (dateRange: { from?: Date; to?: Date }) => {
    onValuesChange({
      from: dateRange.from?.getTime(),
      to: dateRange.to?.getTime(),
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="w-full justify-start" variant="outline">
          <CalendarIcon />
          {timeRange.from && timeRange.to
            ? `${format(new Date(timeRange.from), "LLL d, yy")} - ${format(
                new Date(timeRange.to),
                "LLL d, yy"
              )}`
            : "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <div className="grid grid-rows-[auto_1fr] divide-y">
          <div className="grid grid-cols-[auto_1fr] divide-x">
            <TimeRangePresets onSelect={handleDateRangeChange} />
            <Calendar
              disabled={(date) => date > new Date()}
              mode="range"
              numberOfMonths={1}
              onSelect={handleDateRangeChange}
              required
              selected={{
                from: timeRange.from ? new Date(timeRange.from) : undefined,
                to: timeRange.to ? new Date(timeRange.to) : undefined,
              }}
            />
          </div>
          <CustomTimeRange
            onValuesChange={handleDateRangeChange}
            timeRange={timeRange}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default TimeRangeFilter;

const presets = {
  lastHour: {
    name: "Last hour",
    value: "lastHour",
    shortcut: "h",
    apply: () => {
      const now = new Date();
      return {
        from: subHours(now, 1),
        to: now,
      };
    },
  },
  today: {
    name: "Today",
    value: "today",
    shortcut: "t",
    apply: () => {
      const now = new Date();
      return {
        from: startOfDay(now),
        to: endOfDay(now),
      };
    },
  },
  yesterday: {
    name: "Yesterday",
    value: "yesterday",
    shortcut: "y",
    apply: () => {
      const now = new Date();
      return {
        from: startOfDay(subDays(now, 1)),
        to: endOfDay(subDays(now, 1)),
      };
    },
  },
  last7Days: {
    name: "Last 7 days",
    value: "last7Days",
    shortcut: "w",
    apply: () => {
      const now = new Date();
      return {
        from: subDays(startOfDay(now), 6),
        to: endOfDay(now),
      };
    },
  },
  last14Days: {
    name: "Last 14 days",
    value: "last14Days",
    shortcut: "b",
    apply: () => {
      const now = new Date();
      return {
        from: subDays(startOfDay(now), 13),
        to: endOfDay(now),
      };
    },
  },
  last30Days: {
    name: "Last 30 days",
    value: "last30Days",
    shortcut: "m",
    apply: () => {
      const now = new Date();
      return {
        from: subDays(startOfDay(now), 29),
        to: endOfDay(now),
      };
    },
  },
};

function TimeRangePresets({
  onSelect,
}: {
  onSelect: (dateRange: { from: Date; to: Date }) => void;
}) {
  useHotKeys([
    { key: "h", callback: () => onSelect(presets.lastHour.apply()) },
    { key: "t", callback: () => onSelect(presets.today.apply()) },
    { key: "y", callback: () => onSelect(presets.yesterday.apply()) },
    { key: "w", callback: () => onSelect(presets.last7Days.apply()) },
    { key: "b", callback: () => onSelect(presets.last14Days.apply()) },
    { key: "m", callback: () => onSelect(presets.last30Days.apply()) },
  ]);

  return (
    <div className="space-y-2 p-3">
      <Label className="text-muted-foreground uppercase">Date Range</Label>
      <div className="flex flex-col gap-px">
        {Object.values(presets).map((preset) => (
          <Button
            className="w-full justify-between gap-4"
            key={preset.value}
            onClick={() => onSelect(preset.apply())}
            variant="ghost"
          >
            {preset.name}
            <Kbd>{preset.shortcut}</Kbd>
          </Button>
        ))}
      </div>
    </div>
  );
}

function CustomTimeRange({
  timeRange,
  onValuesChange,
}: {
  timeRange: {
    from?: number;
    to?: number;
  };
  onValuesChange: (timeRange: { from?: Date; to?: Date }) => void;
}) {
  const [customFrom, setCustomFrom] = useState<Date | undefined>(
    timeRange.from ? new Date(timeRange.from) : undefined
  );
  const [customTo, setCustomTo] = useState<Date | undefined>(
    timeRange.to ? new Date(timeRange.to) : undefined
  );

  const debouncedCustomFrom = useDebounce(customFrom, 1000);
  const debouncedCustomTo = useDebounce(customTo, 1000);

  // biome-ignore lint/correctness/useExhaustiveDependencies: no-need
  useEffect(() => {
    onValuesChange({
      from: debouncedCustomFrom,
      to: debouncedCustomTo,
    });
  }, [debouncedCustomFrom, debouncedCustomTo]);

  const toInputFormat = (date: number | undefined) => {
    return date ? format(new Date(date), "yyyy-MM-dd'T'HH:mm") : "";
  };

  return (
    <div className="space-y-2 p-3">
      <FieldSet className="gap-2">
        <FieldLabel className="text-muted-foreground uppercase">
          Custom Range
        </FieldLabel>
        <FieldGroup>
          <div className="grid grid-cols-2 gap-2">
            <Field className="gap-1">
              <FieldLabel>From</FieldLabel>
              <Input
                className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                defaultValue={toInputFormat(timeRange.from)}
                key={toInputFormat(timeRange.from)}
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  setCustomFrom(date);
                }}
                type="datetime-local"
              />
            </Field>
            <Field className="gap-1">
              <FieldLabel>To</FieldLabel>
              <Input
                className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                defaultValue={toInputFormat(timeRange.to)}
                key={toInputFormat(timeRange.to)}
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  setCustomTo(date);
                }}
                type="datetime-local"
              />
            </Field>
          </div>
        </FieldGroup>
      </FieldSet>
    </div>
  );
}
