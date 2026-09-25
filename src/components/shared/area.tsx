import type { Area, AreaColor } from "@/types/domain";
import { cn } from "@/lib/utils/cn";

export function areaColorVar(color: AreaColor | string | undefined | null): string {
  return `var(--area-${color ?? "slate"})`;
}

export function AreaDot({ color, className }: { color?: AreaColor | string | null; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2 shrink-0 rounded-full", className)}
      style={{ background: areaColorVar(color) }}
    />
  );
}

export function AreaLabel({ area, className }: { area?: Pick<Area, "name" | "color"> | null; className?: string }) {
  if (!area) return <span className={cn("text-muted-foreground", className)}>No area</span>;
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <AreaDot color={area.color} />
      <span className="truncate">{area.name}</span>
    </span>
  );
}
