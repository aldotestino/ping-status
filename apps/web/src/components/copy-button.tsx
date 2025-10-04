import { Check, Copy } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

type CopyButtonProps = ComponentProps<typeof Button> & {
  value: string;
};

function CopyButton({ children, value, ...props }: CopyButtonProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard();

  return (
    <Button onClick={() => copyToClipboard(value)} {...props}>
      {isCopied ? <Check /> : <Copy />}
      {children}
    </Button>
  );
}

export default CopyButton;
