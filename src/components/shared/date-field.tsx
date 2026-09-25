"use client";

import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSettings } from "@/hooks/queries";
import { useToday } from "@/hooks/use-now";
import {
  addMonthsKey,
  calParts,
  daysInRange,
  formatDateKey,
  localizeDigits,
  monthGridRange,
  sameMonth,
  weekdayName,
  type WeekdayIndex,
} from "@/lib/date";
import { cn } from "@/lib/utils/cn";

interface DateFieldProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
}

/**
 * Date input that follows the calendar setting. Gregorian uses the native
 * picker; Shamsi (Jalali) shows a Jalali month grid. The value is always a
 * Gregorian `yyyy-MM-dd` key, so storage is identical either way.
 */
export function DateField(props: DateFieldProps) {
  const { settings } = useSettings();
  if (settings.calendar.system === "gregorian") {
    return (
      <Input
        id={props.id}
        type="date"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className={props.className}
        aria-label={props["aria-label"]}
        aria-invalid={props["aria-invalid"]}
      />
    );
  }
  return <JalaliPicker {...props} weekStartsOn={settings.weekStartsOn as WeekdayIndex} />;
}

function JalaliPicker({
  value,
  onChange,
  id,
  className,
  placeholder = "Pick a date",
  weekStartsOn,
  ...aria
}: DateFieldProps & { weekStartsOn: WeekdayIndex }) {
  const today = useToday() ?? "";
  const [open, setOpen] = React.useState(false);
  const [cursor, setCursor] = React.useState(value || today);
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- re-anchor the grid when reopened
    if (open) setCursor(value || today);
  }, [open, value, today]);

  const anchor = cursor || today;
  const days = anchor ? daysInRange(monthGridRange(anchor, weekStartsOn)) : [];
  const headers = Array.from({ length: 7 }, (_, i) => weekdayName((i + weekStartsOn) % 7, "narrow"));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          aria-label={aria["aria-label"]}
          className={cn(
            aria["aria-invalid"] && "border-danger",
            "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{value ? formatDateKey(value, "EEE d MMMM yyyy") : placeholder}</span>
          <CalendarDays className="size-4 shrink-0 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="mb-2 flex items-center justify-between">
          <Button size="icon-xs" variant="ghost" onClick={() => setCursor(addMonthsKey(anchor, -1))} aria-label="Previous month">
            <ChevronLeft />
          </Button>
          <span className="text-sm font-medium">{anchor && formatDateKey(anchor, "MMMM yyyy")}</span>
          <Button size="icon-xs" variant="ghost" onClick={() => setCursor(addMonthsKey(anchor, 1))} aria-label="Next month">
            <ChevronRight />
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center" role="grid" aria-label="Choose a date">
          {headers.map((h, i) => (
            <span key={i} className="py-1 text-[11px] text-muted-foreground">
              {h}
            </span>
          ))}
          {days.map((d) => {
            const inMonth = sameMonth(d, anchor);
            const selected = d === value;
            return (
              <button
                key={d}
                type="button"
                onClick={() => {
                  onChange(d);
                  setOpen(false);
                }}
                aria-label={formatDateKey(d, "EEEE d MMMM yyyy")}
                aria-pressed={selected}
                className={cn(
                  "flex h-8 items-center justify-center rounded-md text-sm tabular transition-colors hover:bg-accent",
                  !inMonth && "text-muted-foreground/50",
                  d === today && !selected && "text-primary font-semibold",
                  selected && "bg-primary text-primary-foreground hover:bg-primary",
                )}
              >
                {localizeDigits(String(calParts(d).day))}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between">
          <Button size="xs" variant="ghost" onClick={() => { onChange(today); setOpen(false); }}>
            Today
          </Button>
          {value && (
            <Button size="xs" variant="ghost" onClick={() => { onChange(""); setOpen(false); }}>
              <X /> Clear
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
