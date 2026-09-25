"use client";

import { Popover as P } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils/cn";

export const Popover = P.Root;
export const PopoverTrigger = P.Trigger;
export const PopoverAnchor = P.Anchor;

export function PopoverContent({ className, align = "center", sideOffset = 6, ...props }: React.ComponentProps<typeof P.Content>) {
  return (
    <P.Portal>
      <P.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-xl shadow-black/20 outline-none data-[state=open]:animate-scale-in",
          className,
        )}
        {...props}
      />
    </P.Portal>
  );
}
