import { cn } from "@/lib/utils/cn";

/**
 * App mark: a day dial of four time blocks around "now", with one block pulled
 * out of the ring, because plans are hypotheses and blocks move. Drawn in
 * currentColor so it follows the theme and accent; src/app/icon.svg is the
 * standalone copy used for the favicon and app icons.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" aria-hidden>
      <path d="M18.62 14.28A7 7 0 0 1 14.28 18.62" opacity={0.45} />
      <path d="M9.72 18.62A7 7 0 0 1 5.38 14.28" opacity={0.45} />
      <path d="M5.38 9.72A7 7 0 0 1 9.72 5.38" opacity={0.45} />
      <path d="M15.98 3.68A7 7 0 0 1 20.32 8.02" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
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
