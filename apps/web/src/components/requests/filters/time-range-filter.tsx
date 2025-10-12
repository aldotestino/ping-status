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

function TimeRangePresets({
  onSelect,
}: {
  onSelect: (dateRange: { from: Date; to: Date }) => void;
}) {
  const handleSelectPreset = (
    preset:
      | "lastHour"
      | "today"
      | "yesterday"
      | "last7Days"
      | "last14Days"
      | "last30Days"
  ) => {
    const now = new Date();

    switch (preset) {
      case "lastHour":
        onSelect({
          from: subHours(now, 1),
          to: now,
        });
        break;
      case "today":
        onSelect({
          from: startOfDay(now),
          to: endOfDay(now),
        });
        break;
      case "yesterday":
        onSelect({
          from: startOfDay(subDays(now, 1)),
          to: endOfDay(subDays(now, 1)),
        });
        break;
      case "last7Days":
        onSelect({
          from: subDays(startOfDay(now), 6),
          to: endOfDay(now),
        });
        break;
      case "last14Days":
        onSelect({
          from: subDays(startOfDay(now), 13),
          to: endOfDay(now),
        });
        break;
      case "last30Days":
        onSelect({
          from: subDays(startOfDay(now), 29),
          to: endOfDay(now),
        });
        break;
      default:
        break;
    }
  };

  useHotKeys([
    { key: "h", callback: () => handleSelectPreset("lastHour") },
    { key: "t", callback: () => handleSelectPreset("today") },
    { key: "y", callback: () => handleSelectPreset("yesterday") },
    { key: "w", callback: () => handleSelectPreset("last7Days") },
    { key: "b", callback: () => handleSelectPreset("last14Days") },
    { key: "m", callback: () => handleSelectPreset("last30Days") },
  ]);

  return (
    <div className="space-y-2 p-3">
      <Label className="text-muted-foreground uppercase">Date Range</Label>
      <div className="flex flex-col gap-px">
        <Button
          className="w-full justify-between gap-4"
          onClick={() => handleSelectPreset("lastHour")}
          variant="ghost"
        >
          Last hour
          <Kbd>H</Kbd>
        </Button>
        <Button
          className="w-full justify-between gap-4"
          onClick={() => handleSelectPreset("today")}
          variant="ghost"
        >
          Today
          <Kbd>T</Kbd>
        </Button>
        <Button
          className="w-full justify-between gap-4"
          onClick={() => handleSelectPreset("yesterday")}
          variant="ghost"
        >
          Yesterday
          <Kbd>Y</Kbd>
        </Button>
        <Button
          className="w-full justify-between gap-4"
          onClick={() => handleSelectPreset("last7Days")}
          variant="ghost"
        >
          Last 7 days
          <Kbd>W</Kbd>
        </Button>
        <Button
          className="w-full justify-between gap-4"
          onClick={() => handleSelectPreset("last14Days")}
          variant="ghost"
        >
          Last 14 days
          <Kbd>B</Kbd>
        </Button>
        <Button
          className="w-full justify-between gap-4"
          onClick={() => handleSelectPreset("last30Days")}
          variant="ghost"
        >
          Last 30 days
          <Kbd>M</Kbd>
        </Button>
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
                disabled={!timeRange.from}
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
                disabled={!timeRange.to}
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
