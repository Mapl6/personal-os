"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { formatDuration, parseDurationInput } from "@/lib/date";
import { cn } from "@/lib/utils/cn";

const PRESETS = [15, 30, 45, 60, 90, 120, 180];

/** Free-text duration ("1h30", "45m") with quick presets. Value in minutes. */
export function DurationInput({
  value,
  onChange,
  id,
  presets = PRESETS,
  className,
  "aria-invalid": invalid,
}: {
  value: number;
  onChange: (minutes: number) => void;
  id?: string;
  presets?: number[];
  className?: string;
  "aria-invalid"?: boolean;
}) {
  const [text, setText] = React.useState(formatDuration(value));
  const [focused, setFocused] = React.useState(false);
  const shown = focused ? text : formatDuration(value);

  return (
    <div className={cn("space-y-1.5", className)}>
      <Input
        id={id}
        value={shown}
        inputMode="text"
        aria-invalid={invalid || (focused && parseDurationInput(text) === null)}
        onFocus={() => {
          setText(formatDuration(value));
          setFocused(true);
        }}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          setText(e.target.value);
          const parsed = parseDurationInput(e.target.value);
          if (parsed !== null && parsed > 0) onChange(parsed);
        }}
        placeholder="e.g. 1h30"
      />
      <div className="flex flex-wrap gap-1">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              onChange(p);
              setText(formatDuration(p));
            }}
            className={cn(
              "rounded-md border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              value === p && "border-primary/50 bg-primary/10 text-primary",
            )}
          >
            {formatDuration(p)}
          </button>
        ))}
      </div>
    </div>
  );
}
