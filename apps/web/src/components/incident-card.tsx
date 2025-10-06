import { format, formatDistance, formatDistanceToNow } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { client } from "@/lib/orpc";
import { cn } from "@/lib/utils";

type IncidentCardProps = Awaited<ReturnType<typeof client.incidents>>[number];

export function IncidentCard(incident: IncidentCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle>{incident.monitorName}</CardTitle>
            <CardDescription>Incident #{incident.id}</CardDescription>
          </div>
          <Badge
            className={cn({
              "bg-monitor-status-operational/20 text-monitor-status-operational":
                incident.closedAt,
              "bg-monitor-status-down/20 text-monitor-status-down":
                !incident.closedAt,
            })}
          >
            {incident.closedAt ? "Closed" : "Open"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Started</Label>
            <div className="space-y-0.5">
              <p className="font-medium text-sm">
                {format(new Date(incident.openedAt), "MMM d, yyyy 'at' HH:mm")}
              </p>
              <p className="text-muted-foreground text-xs">
                {formatDistanceToNow(new Date(incident.openedAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>

          {incident.closedAt ? (
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Resolved</Label>
              <div className="space-y-0.5">
                <p className="font-medium text-sm">
                  {format(
                    new Date(incident.closedAt),
                    "MMM d, yyyy 'at' HH:mm"
                  )}
                </p>
                <p className="text-muted-foreground text-xs">
                  {formatDistanceToNow(new Date(incident.closedAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Duration</Label>
              <p className="font-medium text-sm">
                {formatDistanceToNow(new Date(incident.openedAt))}
              </p>
            </div>
          )}
        </div>

        {incident.closedAt && (
          <>
            <Separator />
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">
                Total Downtime
              </Label>
              <p className="font-semibold text-sm">
                {formatDistance(
                  new Date(incident.openedAt),
                  new Date(incident.closedAt)
                )}
              </p>
            </div>
          </>
        )}

        {incident.pingResults.length > 0 && (
          <>
            <Separator />
            <Accordion collapsible type="single">
              <AccordionItem className="border-0" value="messages">
                <AccordionTrigger className="py-0 hover:no-underline">
                  <Label className="cursor-pointer text-muted-foreground text-xs">
                    Error Messages ({incident.pingResults.length})
                  </Label>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 pt-2">
                    {incident.pingResults.map(({ message, id, createdAt }) => (
                      <p
                        className="rounded-md bg-muted px-2 py-1.5 font-mono text-xs"
                        key={id}
                      >
                        [{format(new Date(createdAt), "HH:mm")}] {message}
                      </p>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        )}
      </CardContent>
    </Card>
  );
}
