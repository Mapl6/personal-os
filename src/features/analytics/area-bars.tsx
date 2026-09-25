"use client";

import { AreaDot, areaColorVar } from "@/components/shared/area";
import type { AreaTime } from "@/lib/analytics/stats";
import { formatDuration } from "@/lib/date";

/** "Where did my time go?" — horizontal bars, actual vs planned per area. */
export function AreaBars({ rows, emptyLabel = "No tracked or completed time in this period." }: { rows: AreaTime[]; emptyLabel?: string }) {
  const total = rows.reduce((s, r) => s + r.minutes, 0);
  const max = Math.max(1, ...rows.map((r) => Math.max(r.minutes, r.plannedMinutes)));
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.areaId ?? "none"}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-1.5 font-medium">
              <AreaDot color={r.color} /> {r.name}
            </span>
            <span className="text-xs text-muted-foreground tabular">
              <span className="text-foreground">{formatDuration(r.minutes)}</span> of {formatDuration(r.plannedMinutes)} planned
              {total > 0 && ` · ${Math.round((r.minutes / total) * 100)}%`}
            </span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${r.name}: ${formatDuration(r.minutes)} actual, ${formatDuration(r.plannedMinutes)} planned`}>
            <div className="absolute inset-y-0 left-0 rounded-full opacity-30" style={{ width: `${(r.plannedMinutes / max) * 100}%`, background: areaColorVar(r.color) }} />
            <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(r.minutes / max) * 100}%`, background: areaColorVar(r.color) }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
