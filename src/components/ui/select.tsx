"use client";

import { Select as P } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils/cn";

export const Select = P.Root;
export const SelectValue = P.Value;
export const SelectGroup = P.Group;

export function SelectTrigger({ className, children, ...props }: React.ComponentProps<typeof P.Trigger>) {
  return (
    <P.Trigger
      className={cn(
        "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-sm data-[placeholder]:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50 [&>span]:truncate",
        className,
      )}
      {...props}
    >
      {children}
      <P.Icon asChild>
        <ChevronDown className="size-4 opacity-50" />
      </P.Icon>
    </P.Trigger>
  );
}

export function SelectContent({ className, children, position = "popper", ...props }: React.ComponentProps<typeof P.Content>) {
  return (
    <P.Portal>
      <P.Content
        position={position}
        sideOffset={4}
        className={cn(
          "z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-xl shadow-black/20 data-[state=open]:animate-scale-in",
          className,
        )}
        {...props}
      >
        <P.Viewport className="p-1">{children}</P.Viewport>
      </P.Content>
    </P.Portal>
  );
}

export function SelectItem({ className, children, ...props }: React.ComponentProps<typeof P.Item>) {
  return (
    <P.Item
      className={cn(
        "relative flex w-full cursor-default select-none items-center gap-2 rounded-md py-1.5 pl-2 pr-8 text-sm outline-none data-[highlighted]:bg-accent data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <P.ItemText>{children}</P.ItemText>
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <P.ItemIndicator>
          <Check className="size-3.5" />
        </P.ItemIndicator>
      </span>
    </P.Item>
  );
}
