"use client";

import { Checkbox as P } from "radix-ui";
import { Check } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Checkbox({ className, ...props }: React.ComponentProps<typeof P.Root>) {
  return (
    <P.Root
      className={cn(
        "peer size-4 shrink-0 rounded border border-input transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        className,
      )}
      {...props}
    >
      <P.Indicator className="flex items-center justify-center">
        <Check className="size-3" strokeWidth={3} />
      </P.Indicator>
    </P.Root>
  );
}
