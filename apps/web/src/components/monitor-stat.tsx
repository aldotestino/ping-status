import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { cn } from "@/lib/utils";

type MonitorStatProps = {
  name: string;
  value: number | string;
  change?: number;
  unit?: string;
  positiveChangeIsGood?: boolean;
};

function MonitorStat({
  name,
  value,
  change,
  unit,
  positiveChangeIsGood = false,
  ...props
}: MonitorStatProps & React.ComponentProps<typeof Item>) {
  return (
    <Item variant="outline" {...props}>
      <ItemContent>
        <ItemDescription className="uppercase">{name}</ItemDescription>
        <ItemTitle className="text-lg">
          {value}
          {unit && (
            <span className="text-muted-foreground text-sm">{unit}</span>
          )}
        </ItemTitle>
      </ItemContent>
      {typeof change === "number" && change !== 0 && (
        <ItemActions>
          <Badge variant="outline">
            {change > 0 ? (
              <ArrowUpRight
                className={cn(
                  positiveChangeIsGood
                    ? "text-monitor-status-operational"
                    : "text-monitor-status-down"
                )}
              />
            ) : (
              <ArrowDownRight
                className={cn(
                  positiveChangeIsGood
                    ? "text-monitor-status-down"
                    : "text-monitor-status-operational"
                )}
              />
            )}
            {Math.abs(change).toFixed(2)}%
          </Badge>
        </ItemActions>
      )}
    </Item>
  );
}

export default MonitorStat;
