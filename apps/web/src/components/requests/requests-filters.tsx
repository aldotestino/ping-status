import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Search } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";

function Filter({
  label,
  children,
  className,
  ...props
}: {
  label: string;
  children: React.ReactNode;
} & Omit<React.ComponentProps<typeof AccordionItem>, "children">) {
  return (
    <AccordionItem className={cn("border-none px-2", className)} {...props}>
      <AccordionTrigger className="p-2 text-muted-foreground hover:text-foreground hover:no-underline">
        {label}
      </AccordionTrigger>
      <AccordionContent className="p-2">{children}</AccordionContent>
    </AccordionItem>
  );
}

function CheckboxFilter<T extends string>({
  values,
  onValuesChange,
  options,
}: {
  values: T[];
  onValuesChange: (values: T[]) => void;
  options: {
    value: T;
    label: string;
  }[];
}) {
  const handleCheckedChange = (checked: boolean, value: T) => {
    const newValues = checked
      ? [...new Set([...values, value])]
      : values.filter((v1) => v1 !== value);
    onValuesChange(newValues);
  };

  return (
    <div className="divide-y rounded-md border">
      {options.map((o) => (
        <div className="flex items-center gap-2 p-2" key={o.value}>
          <Checkbox
            checked={values.includes(o.value)}
            id={o.value}
            onCheckedChange={(checked) =>
              handleCheckedChange(checked as boolean, o.value)
            }
          />
          <Label htmlFor={o.value}>{o.label}</Label>
        </div>
      ))}
    </div>
  );
}

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
            { value: "operational", label: "Operational" },
            { value: "degraded", label: "Degraded" },
            { value: "down", label: "Down" },
          ]}
          values={search.status}
        />
      </Filter>
      <Filter label="Monitors" value="monitorName">
        <CheckboxFilter
          onValuesChange={(values) =>
            navigate({ search: { ...search, monitorName: values } })
          }
          options={monitors.map((m) => ({ value: m.name, label: m.name }))}
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
