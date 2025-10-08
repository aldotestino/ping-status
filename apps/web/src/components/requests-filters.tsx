import { monitors } from "@ping-status/monitor";
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

function RequestsFilters() {
  const search = useSearch({
    from: "/requests",
  });

  const navigate = useNavigate({ from: "/requests" });

  const handleStatusChange = (
    checked: boolean,
    s: (typeof search.status)[number]
  ) => {
    const newStatus = checked
      ? [...new Set([...search.status, s])]
      : search.status.filter((s1) => s1 !== s);
    navigate({ search: { ...search, status: newStatus } });
  };

  const handleValidationChange = (
    checked: boolean,
    v: (typeof search.validation)[number]
  ) => {
    const newValidation = checked
      ? [...new Set([...search.validation, v])]
      : search.validation.filter((v1) => v1 !== v);
    navigate({ search: { ...search, validation: newValidation } });
  };

  const handleMonitorNameChange = (
    checked: boolean,
    m: (typeof search.monitorName)[number]
  ) => {
    const newMonitorName = checked
      ? [...new Set([...search.monitorName, m])]
      : search.monitorName.filter((m1) => m1 !== m);
    navigate({ search: { ...search, monitorName: newMonitorName } });
  };

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
      <AccordionItem className="border-none" value="status">
        <AccordionTrigger className="px-4 py-2 text-muted-foreground hover:text-foreground hover:no-underline">
          Status
        </AccordionTrigger>
        <AccordionContent className="px-4 py-2">
          <div className="divide-y rounded-md border">
            <div className="flex items-center gap-2 p-2">
              <Checkbox
                checked={search.status.includes("2xx")}
                id="2xx"
                onCheckedChange={(checked) =>
                  handleStatusChange(checked as boolean, "2xx" as const)
                }
              />
              <Label htmlFor="2xx">2xx</Label>
            </div>
            <div className="flex items-center gap-2 p-2">
              <Checkbox
                checked={search.status.includes("4xx")}
                id="4xx"
                onCheckedChange={(checked) =>
                  handleStatusChange(checked as boolean, "4xx" as const)
                }
              />
              <Label htmlFor="4xx">4xx</Label>
            </div>
            <div className="flex items-center gap-2 p-2">
              <Checkbox
                checked={search.status.includes("5xx")}
                id="5xx"
                onCheckedChange={(checked) =>
                  handleStatusChange(checked as boolean, "5xx" as const)
                }
              />
              <Label htmlFor="5xx">5xx</Label>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem className="border-none" value="validation">
        <AccordionTrigger className="px-4 py-2 text-muted-foreground hover:text-foreground hover:no-underline">
          Validation
        </AccordionTrigger>
        <AccordionContent className="px-4 py-2">
          <div className="divide-y rounded-md border">
            <div className="flex items-center gap-2 p-2">
              <Checkbox
                checked={search.validation.includes("success")}
                id="success"
                onCheckedChange={(checked) =>
                  handleValidationChange(checked as boolean, "success")
                }
              />
              <Label htmlFor="success">Success</Label>
            </div>
            <div className="flex items-center gap-2 p-2">
              <Checkbox
                checked={search.validation.includes("fail")}
                id="fail"
                onCheckedChange={(checked) =>
                  handleValidationChange(checked as boolean, "fail")
                }
              />
              <Label htmlFor="fail">Fail</Label>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem className="border-none" value="monitorName">
        <AccordionTrigger className="px-4 py-2 text-muted-foreground hover:text-foreground hover:no-underline">
          Monitors
        </AccordionTrigger>
        <AccordionContent className="px-4 py-2">
          <div className="divide-y rounded-md border">
            {monitors.map((m) => (
              <div className="flex items-center gap-2 p-2" key={m.name}>
                <Checkbox
                  checked={search.monitorName.includes(m.name)}
                  id={m.name}
                  onCheckedChange={(checked) =>
                    handleMonitorNameChange(checked as boolean, m.name)
                  }
                />
                <Label htmlFor={m.name}>{m.name}</Label>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem className="border-none" value="incidentId">
        <AccordionTrigger className="px-4 py-2 text-muted-foreground hover:text-foreground hover:no-underline">
          Incident ID
        </AccordionTrigger>
        <AccordionContent className="px-4 py-2">
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
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export default RequestsFilters;
