import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Search } from "lucide-react";
import Filter from "@/components/requests/filters";
import CheckboxFilter from "@/components/requests/filters/checkbox-filter";
import TimeRangeFilter from "@/components/requests/filters/time-range-filter";
import { Accordion } from "@/components/ui/accordion";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { orpc } from "@/lib/orpc";

function RequestsFilters() {
  const search = useSearch({
    from: "/requests",
  });

  const { data: monitors } = useSuspenseQuery(
    orpc.monitors.queryOptions({
      staleTime: Number.POSITIVE_INFINITY,
    })
  );

  const navigate = useNavigate({ from: "/requests" });

  const handleIncidentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const n = Number(e.target.value);
      navigate({
        search: { ...search, incidentId: Number.isInteger(n) ? n : undefined },
      });
    } else {
      navigate({ search: { ...search, incidentId: undefined } });
    }
  };

  return (
    <Accordion type="multiple">
      <Filter label="Time Range" value="time">
        <TimeRangeFilter
          onValuesChange={(timeRange) =>
            navigate({
              search: { ...search, ...timeRange },
            })
          }
          timeRange={{ from: search.from, to: search.to }}
        />
      </Filter>
      <Filter label="Status Code" value="statusCode">
        <CheckboxFilter
          onValuesChange={(values) =>
            navigate({ search: { ...search, statusCode: values } })
          }
          options={[
            { value: "2xx", label: "2xx" },
            { value: "4xx", label: "4xx" },
            { value: "5xx", label: "5xx" },
          ]}
          values={search.statusCode}
        />
      </Filter>
      <Filter label="Status" value="status">
        <CheckboxFilter
          onValuesChange={(values) =>
            navigate({ search: { ...search, status: values } })
          }
          options={[
            {
              value: "operational",
              label: "Operational",
              addon: (
                <div className="size-3 rounded bg-monitor-status-operational" />
              ),
            },
            {
              value: "degraded",
              label: "Degraded",
              addon: (
                <div className="size-3 rounded bg-monitor-status-degraded" />
              ),
            },
            {
              value: "down",
              label: "Down",
              addon: <div className="size-3 rounded bg-monitor-status-down" />,
            },
          ]}
          values={search.status}
        />
      </Filter>
      <Filter label="Monitors" value="monitorName">
        <CheckboxFilter
          onValuesChange={(values) =>
            navigate({ search: { ...search, monitorName: values } })
          }
          options={monitors.map((m) => ({
            value: m.name,
            label: m.name,
            addon: (
              <span className="text-muted-foreground text-xs">{m.method}</span>
            ),
          }))}
          values={search.monitorName}
        />
      </Filter>
      <Filter label="Incident ID" value="incidentId">
        <InputGroup>
          <InputGroupInput
            onChange={handleIncidentIdChange}
            placeholder="Insert incident ID"
            value={search.incidentId?.toString() || ""}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
      </Filter>
    </Accordion>
  );
}

export default RequestsFilters;
