"use client";

import { Stat } from "@/components/shared/stat";
import { Progress } from "@/components/ui/progress";
import { formatDuration } from "@/lib/date";
import type { DayProgress } from "@/lib/analytics/stats";

export function DaySummaryStrip({ progress }: { progress: DayProgress }) {
  return (
    <>
      {/* Phone: one compact line so the task list stays above the fold. */}
      <div className="rounded-xl border border-border bg-card px-4 py-3 sm:hidden">
        <div className="flex items-baseline justify-between text-sm tabular">
          <span>
            <span className="font-semibold">{formatDuration(progress.completedMinutes)}</span>
            <span className="text-muted-foreground"> of {formatDuration(progress.plannedMinutes)}</span>
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDuration(progress.remainingMinutes)} left · {progress.completionPercent}%
          </span>
        </div>
        <Progress value={progress.completionPercent} className="mt-2" label="Day progress" />
      </div>
      <div className="hidden grid-cols-4 gap-2 sm:grid">
        <Stat label="Planned" value={formatDuration(progress.plannedMinutes)} hint={`${progress.blocksTotal} blocks`} />
        <Stat
          label="Completed"
          value={formatDuration(progress.completedMinutes)}
          hint={`${progress.blocksCompleted} done${progress.blocksSkipped ? ` · ${progress.blocksSkipped} skipped` : ""}`}
        />
        <Stat label="Remaining" value={formatDuration(progress.remainingMinutes)} hint={`Tracked ${formatDuration(progress.trackedMinutes)}`} />
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <div className="text-xs text-muted-foreground">Progress</div>
          <div className="mt-1 text-xl font-semibold tabular">{progress.completionPercent}%</div>
          <Progress value={progress.completionPercent} className="mt-2" label="Day progress" />
        </div>
      </div>
    </>
  );
}
