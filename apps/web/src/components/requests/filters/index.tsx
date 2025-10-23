import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

export default Filter;
