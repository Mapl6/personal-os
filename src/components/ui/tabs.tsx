"use client";

import { Tabs as P } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils/cn";

export const Tabs = P.Root;

export function TabsList({ className, ...props }: React.ComponentProps<typeof P.List>) {
  return (
    <P.List
      className={cn("inline-flex h-9 items-center gap-0.5 rounded-lg border border-border bg-surface p-0.5", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof P.Trigger>) {
  return (
    <P.Trigger
      className={cn(
        "inline-flex h-full items-center justify-center gap-1.5 rounded-md px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:shadow-sm [&_svg]:size-3.5",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.ComponentProps<typeof P.Content>) {
  return <P.Content className={cn("mt-4 outline-none", className)} {...props} />;
}
