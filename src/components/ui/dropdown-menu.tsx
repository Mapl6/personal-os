"use client";

import { DropdownMenu as P } from "radix-ui";
import { Check, ChevronRight } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils/cn";

export const DropdownMenu = P.Root;
export const DropdownMenuTrigger = P.Trigger;
export const DropdownMenuGroup = P.Group;
export const DropdownMenuSub = P.Sub;

export function DropdownMenuContent({ className, sideOffset = 4, ...props }: React.ComponentProps<typeof P.Content>) {
  return (
    <P.Portal>
      <P.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-44 overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-xl shadow-black/20 data-[state=open]:animate-scale-in",
          className,
        )}
        {...props}
      />
    </P.Portal>
  );
}

const itemCls =
  "relative flex cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:text-muted-foreground";

export function DropdownMenuItem({
  className,
  destructive,
  ...props
}: React.ComponentProps<typeof P.Item> & { destructive?: boolean }) {
  return <P.Item className={cn(itemCls, destructive && "text-danger [&_svg]:text-danger", className)} {...props} />;
}

export function DropdownMenuCheckboxItem({ className, children, ...props }: React.ComponentProps<typeof P.CheckboxItem>) {
  return (
    <P.CheckboxItem className={cn(itemCls, "pl-7", className)} {...props}>
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <P.ItemIndicator>
          <Check className="size-3.5" />
        </P.ItemIndicator>
      </span>
      {children}
    </P.CheckboxItem>
  );
}

export function DropdownMenuSubTrigger({ className, children, ...props }: React.ComponentProps<typeof P.SubTrigger>) {
  return (
    <P.SubTrigger className={cn(itemCls, "data-[state=open]:bg-accent", className)} {...props}>
      {children}
      <ChevronRight className="ml-auto" />
    </P.SubTrigger>
  );
}

export function DropdownMenuSubContent({ className, ...props }: React.ComponentProps<typeof P.SubContent>) {
  return (
    <P.Portal>
      <P.SubContent
        className={cn("z-50 min-w-40 rounded-lg border border-border bg-popover p-1 shadow-xl shadow-black/20", className)}
        {...props}
      />
    </P.Portal>
  );
}

export function DropdownMenuLabel({ className, ...props }: React.ComponentProps<typeof P.Label>) {
  return <P.Label className={cn("px-2 py-1.5 text-xs font-medium text-muted-foreground", className)} {...props} />;
}

export function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof P.Separator>) {
  return <P.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
}

export function DropdownMenuShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)} {...props} />;
}
