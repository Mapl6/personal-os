import * as React from "react";
import { Label } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function WeekdayPicker({
  value,
  onChange,
  weekStartsOn = 1,
  label = "Days",
}: {
  value: number[];
  onChange: (days: number[]) => void;
  weekStartsOn?: number;
  label?: string;
}) {
  const names = ["S", "M", "T", "W", "T", "F", "S"];
  const full = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const order = Array.from({ length: 7 }, (_, i) => (i + weekStartsOn) % 7);
  return (
    <div role="group" aria-label={label} className="flex gap-1">
      {order.map((d) => {
        const on = value.includes(d);
        return (
          <button
            key={d}
            type="button"
            aria-pressed={on}
            aria-label={full[d]}
            onClick={() => onChange(on ? value.filter((x) => x !== d) : [...value, d].sort())}
            className={cn(
              "size-8 rounded-md border text-xs font-medium transition-colors",
              on ? "border-primary/50 bg-primary/15 text-primary" : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            {names[d]}
          </button>
        );
      })}
    </div>
  );
}
