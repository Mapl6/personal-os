"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { formatDuration } from "@/lib/date";

const axis = { stroke: "var(--muted-foreground)", fontSize: 11, fontFamily: "var(--font-mono)", tickLine: false, axisLine: false } as const;
const grid = { vertical: false, stroke: "var(--chart-grid)" } as const;

function TooltipBox({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg shadow-black/30">
      <div className="mb-1 font-medium">{label}</div>
      {payload.map((p) => (
        <div key={String(p.dataKey)} className="flex items-center gap-2 tabular">
          <span className="size-2 rounded-sm" style={{ background: p.color }} aria-hidden />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto pl-3 text-foreground">{formatDuration(Number(p.value) * 60)}</span>
        </div>
      ))}
    </div>
  );
}

export interface DayPoint {
  label: string;
  planned: number; // hours
  completed: number;
  actual: number;
}

export function PlannedVsCompletedChart({ data }: { data: DayPoint[] }) {
  return (
    <div>
      <div className="mb-2 flex gap-4 text-xs text-muted-foreground" aria-hidden>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-muted-foreground/40" /> Planned</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-primary" /> Completed</span>
      </div>
      <div className="h-56" role="img" aria-label="Planned versus completed hours per day">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
            <CartesianGrid {...grid} />
            <XAxis dataKey="label" {...axis} interval="preserveStartEnd" minTickGap={8} />
            <YAxis {...axis} allowDecimals={false} unit="h" />
            <Tooltip content={TooltipBox} cursor={{ fill: "var(--accent)", opacity: 0.5 }} />
            <Bar dataKey="planned" name="Planned" fill="var(--muted-foreground)" fillOpacity={0.3} radius={[3, 3, 0, 0]} maxBarSize={18} />
            <Bar dataKey="completed" name="Completed" fill="var(--chart-1)" radius={[3, 3, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Area chart (DESIGN.md: area fills smooth out peaks) — cyan line over a cyan→green gradient. */
export function FocusTrendChart({ data, average }: { data: DayPoint[]; average: number }) {
  const gradientId = `focus-${React.useId().replace(/:/g, "")}`;
  return (
    <div className="h-56" role="img" aria-label={`Actual focused hours per day, average ${average.toFixed(1)} hours`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid {...grid} />
          <XAxis dataKey="label" {...axis} interval="preserveStartEnd" minTickGap={8} />
          <YAxis {...axis} allowDecimals={false} unit="h" />
          <Tooltip content={TooltipBox} cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }} />
          <Area
            type="monotoneX"
            dataKey="actual"
            name="Focused"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeeklyTrendChart({ data }: { data: { label: string; actual: number }[] }) {
  return (
    <div className="h-48" role="img" aria-label="Actual hours per week">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
          <CartesianGrid {...grid} />
          <XAxis dataKey="label" {...axis} />
          <YAxis {...axis} allowDecimals={false} unit="h" />
          <Tooltip content={TooltipBox} cursor={{ fill: "var(--accent)", opacity: 0.5 }} />
          <Bar dataKey="actual" name="Actual" fill="var(--chart-1)" radius={[3, 3, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
