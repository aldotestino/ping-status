import { monitors } from "@ping-status/monitor";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

function RequestsFilters() {
  const { status, validation, monitorName } = useSearch({ from: "/requests" });

  const navigate = useNavigate({ from: "/requests" });

  const handleStatusChange = (checked: boolean, s: (typeof status)[number]) => {
    const newStatus = checked
      ? [...new Set([...status, s])]
      : status.filter((s1) => s1 !== s);
    navigate({ search: { status: newStatus } });
  };

  const handleValidationChange = (
    checked: boolean,
    v: (typeof validation)[number]
  ) => {
    const newValidation = checked
      ? [...new Set([...validation, v])]
      : validation.filter((v1) => v1 !== v);
    navigate({ search: { validation: newValidation } });
  };

  const handleMonitorNameChange = (
    checked: boolean,
    m: (typeof monitorName)[number]
  ) => {
    const newMonitorName = checked
      ? [...new Set([...monitorName, m])]
      : monitorName.filter((m1) => m1 !== m);
    navigate({ search: { monitorName: newMonitorName } });
  };

  return (
    <Accordion type="multiple">
      <AccordionItem className="border-none" value="status">
        <AccordionTrigger className="p-2">Status</AccordionTrigger>
        <AccordionContent>
          <div className="divide-y rounded-md border">
            <div className="flex items-center gap-2 p-2">
              <Checkbox
                checked={status.includes("2xx")}
                id="2xx"
                onCheckedChange={(checked) =>
                  handleStatusChange(checked as boolean, "2xx")
                }
              />
              <Label htmlFor="2xx">2xx</Label>
            </div>
            <div className="flex items-center gap-2 p-2">
              <Checkbox
                checked={status.includes("4xx")}
                id="4xx"
                onCheckedChange={(checked) =>
                  handleStatusChange(checked as boolean, "4xx")
                }
              />
              <Label htmlFor="4xx">4xx</Label>
            </div>
            <div className="flex items-center gap-2 p-2">
              <Checkbox
                checked={status.includes("5xx")}
                id="5xx"
                onCheckedChange={(checked) =>
                  handleStatusChange(checked as boolean, "5xx")
                }
              />
              <Label htmlFor="5xx">5xx</Label>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem className="border-none" value="validation">
        <AccordionTrigger className="p-2">Validation</AccordionTrigger>
        <AccordionContent>
          <div className="divide-y rounded-md border">
            <div className="flex items-center gap-2 p-2">
              <Checkbox
                checked={validation.includes("success")}
                id="success"
                onCheckedChange={(checked) =>
                  handleValidationChange(checked as boolean, "success")
                }
              />
              <Label htmlFor="success">Success</Label>
            </div>
            <div className="flex items-center gap-2 p-2">
              <Checkbox
                checked={validation.includes("fail")}
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
        <AccordionTrigger className="p-2">Monitors</AccordionTrigger>
        <AccordionContent>
          <div className="divide-y rounded-md border">
            {monitors.map((m) => (
              <div className="flex items-center gap-2 p-2" key={m.name}>
                <Checkbox
                  checked={monitorName.includes(m.name)}
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
    </Accordion>
  );
}

export default RequestsFilters;
