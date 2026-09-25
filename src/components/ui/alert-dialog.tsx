"use client";

import { AlertDialog as P } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { buttonVariants } from "./button";

/** Confirmation dialog for destructive actions. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  destructive,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  return (
    <P.Root open={open} onOpenChange={onOpenChange}>
      <P.Portal>
        <P.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-fade-in" />
        <P.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-popover p-5 shadow-2xl data-[state=open]:animate-scale-in">
          <P.Title className="text-base font-semibold">{title}</P.Title>
          {description && <P.Description className="mt-2 text-sm text-muted-foreground">{description}</P.Description>}
          <div className="mt-5 flex justify-end gap-2">
            <P.Cancel className={buttonVariants({ variant: "ghost", size: "sm" })}>Cancel</P.Cancel>
            <P.Action
              className={cn(buttonVariants({ variant: destructive ? "destructive" : "default", size: "sm" }))}
              onClick={onConfirm}
            >
              {confirmLabel}
            </P.Action>
          </div>
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}
