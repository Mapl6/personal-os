import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils/cn";

/** Inline alert: tinted box with a 4px status bar on the leading edge (DESIGN.md §3). */
const alertVariants = cva(
  "flex items-start gap-2.5 rounded-md border-s-4 px-4 py-3 text-sm [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        danger: "border-danger bg-danger-surface text-danger",
        warning: "border-warning bg-warning/10 text-warning",
        info: "border-primary bg-primary/10 text-foreground [&_svg]:text-primary",
      },
    },
    defaultVariants: { variant: "danger" },
  },
);

export function Alert({ className, variant, ...props }: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>) {
  return <div className={cn(alertVariants({ variant }), className)} {...props} />;
}
