import { cn } from "@/lib/utils/cn";

export function Progress({
  value,
  className,
  indicatorClassName,
  color,
  label,
}: {
  value: number;
  className?: string;
  indicatorClassName?: string;
  color?: string;
  label?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v)}
      aria-label={label}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn("h-full rounded-full bg-primary transition-[width] duration-500 ease-out", indicatorClassName)}
        style={{ width: `${v}%`, ...(color ? { background: color } : {}) }}
      />
    </div>
  );
}
