import * as React from "react";
import { cn } from "@/lib/utils/cn";

/** KPI tile: label on top, a monospace metric (32px when there's room), optional hint. */
export function Stat({
  label,
  value,
  hint,
  className,
  icon,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  /** Colours the metric: "primary" for the headline number, status tones for good/bad values. */
  tone?: "primary" | "success" | "danger";
}) {
  return (
    <div className={cn("@container rounded-xl border border-border bg-card p-5", className)}>
      <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground [&_svg]:size-3.5">
        {icon}
        {label}
      </div>
      <div
        className={cn(
          "metric mt-3 text-2xl leading-none font-bold break-words @[12rem]:text-[2rem]",
          tone === "primary" && "text-primary",
          tone === "success" && "text-success",
          tone === "danger" && "text-danger",
        )}
      >
        {value}
      </div>
      {hint && <div className="mt-2 text-xs text-muted-foreground tabular">{hint}</div>}
    </div>
  );
}
