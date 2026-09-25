"use client";

import { Dialog as P } from "radix-ui";
import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils/cn";

export const Sheet = P.Root;
export const SheetTrigger = P.Trigger;
export const SheetTitle = P.Title;
export const SheetDescription = P.Description;

export function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof P.Content> & { side?: "left" | "right" | "bottom" }) {
  return (
    <P.Portal>
      <P.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-fade-in" />
      <P.Content
        className={cn(
          "fixed z-50 flex flex-col bg-popover text-popover-foreground shadow-2xl data-[state=open]:animate-slide-up",
          side === "right" && "inset-y-0 right-0 w-[min(28rem,100vw)] border-l border-border",
          side === "left" && "inset-y-0 left-0 w-72 border-r border-border",
          side === "bottom" && "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl border-t border-border pb-safe",
          className,
        )}
        {...props}
      >
        {children}
        <P.Close className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </P.Close>
      </P.Content>
    </P.Portal>
  );
}
