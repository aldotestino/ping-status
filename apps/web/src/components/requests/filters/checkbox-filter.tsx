import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

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
    addon?: React.ReactNode;
  }[];
}) {
  const handleCheckedChange = (checked: boolean, value: T) => {
    const newValues = checked
      ? [...new Set([...values, value])]
      : values.filter((v1) => v1 !== value);
    onValuesChange(newValues);
  };

  return (
    <FieldGroup className="gap-0 divide-y overflow-hidden rounded-md border">
      {options.map((o) => (
        <Field
          className="p-2 transition-colors hover:bg-accent hover:text-accent-foreground"
          key={o.value}
          orientation="horizontal"
        >
          <Checkbox
            checked={values.includes(o.value)}
            id={o.value}
            onCheckedChange={(checked) =>
              handleCheckedChange(checked as boolean, o.value)
            }
          />
          <FieldLabel htmlFor={o.value}>{o.label}</FieldLabel>
          {o.addon}
        </Field>
      ))}
    </FieldGroup>
  );
}

export default CheckboxFilter;
