import { cn } from "@/lib/utils/cn";

/**
 * App mark: a progress ring closing around a check. Drawn in currentColor so
 * it follows the theme and accent; src/app/icon.svg is the standalone copy
 * used for the favicon and app icons.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="8.5" strokeWidth={2.6} opacity={0.3} />
      <path d="M12 3.5a8.5 8.5 0 1 1-8.5 8.5" strokeWidth={2.6} />
      <path d="M8.4 12.3l2.6 2.6 4.6-5.2" strokeWidth={2.3} />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground", className)}>
      <LogoMark className="size-5" />
    </div>
  );
}
