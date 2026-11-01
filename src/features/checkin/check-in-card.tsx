"use client";

import { X } from "lucide-react";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { perform } from "@/hooks/perform";
import { useCheckIns, useDayRating } from "@/hooks/queries";
import { cn } from "@/lib/utils/cn";
import { getServices } from "@/services";
import type { CheckIn } from "@/types/domain";

export const MOODS = ["😞", "🙁", "😐", "🙂", "😄"] as const;
export const MOOD_LABELS = ["Awful", "Bad", "Okay", "Good", "Great"] as const;
export const ENERGY_LABELS = ["Drained", "Low", "Okay", "Good", "Great"] as const;
const KEYS = [["checkIns"], ["dayRatings"]];

function Scale({
  label,
  value,
  onPick,
  render,
}: {
  label: string;
  value: number | null;
  onPick: (n: number) => void;
  render: (n: number) => React.ReactNode;
}) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          onClick={() => onPick(n)}
          className={cn(
            "h-9 flex-1 rounded-md border text-sm transition-colors",
            value === n ? "border-primary/60 bg-primary/15 text-primary" : "border-border hover:bg-accent",
          )}
        >
          {render(n)}
        </button>
      ))}
    </div>
  );
}

/** Two taps: mood, then (optionally) energy. Several check-ins a day are fine. */
export function CheckInCard({ date }: { date: string }) {
  const entries = useCheckIns(date).data ?? [];
  const [pending, setPending] = React.useState<CheckIn | null>(null);

  const pickMood = async (mood: number) => {
    const entry = await perform(() => getServices().checkIns.log({ mood, date }), { invalidate: KEYS });
    if (entry) setPending(entry);
  };
  const pickEnergy = async (energy: number) => {
    if (!pending) return;
    await perform(() => getServices().checkIns.update(pending.id, { energy }), { success: "Check-in saved", invalidate: KEYS });
    setPending(null);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{pending ? "And your energy?" : "How are you feeling?"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pending ? (
          <>
            <Scale label="Energy" value={null} onPick={pickEnergy} render={(n) => ENERGY_LABELS[n - 1]} />
            <button type="button" onClick={() => setPending(null)} className="text-xs text-muted-foreground hover:text-foreground">
              Skip energy
            </button>
          </>
        ) : (
          <Scale label="Mood" value={null} onPick={pickMood} render={(n) => <span aria-label={MOOD_LABELS[n - 1]}>{MOODS[n - 1]}</span>} />
        )}
        {entries.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Today’s check-ins">
            {entries.map((c) => (
              <li key={c.id} className="group inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                <span>{new Date(c.at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
                {c.mood && <span title={MOOD_LABELS[c.mood - 1]}>{MOODS[c.mood - 1]}</span>}
                {c.energy && <span>· {ENERGY_LABELS[c.energy - 1]}</span>}
                <button
                  type="button"
                  aria-label="Delete check-in"
                  className="opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                  onClick={() => perform(() => getServices().checkIns.remove(c.id), { invalidate: KEYS })}
                >
                  <X className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** One 1–5 rating per day, set in the daily review. */
export function DayRatingField({ date }: { date: string }) {
  const rating = useDayRating(date).data;
  return (
    <Scale
      label="Rate the day"
      value={rating?.rating ?? null}
      onPick={(n) => perform(() => getServices().checkIns.rateDay(date, n), { invalidate: KEYS })}
      render={(n) => "★".repeat(n)}
    />
  );
}
