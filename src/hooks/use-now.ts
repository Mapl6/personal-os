"use client";

import { useSyncExternalStore } from "react";
import { toDateKey, minutesOfDay, type DateKey } from "@/lib/date";

/**
 * Shared ticking clock. Server snapshot is null so nothing date-dependent is
 * rendered on the server (avoids hydration mismatches across time zones).
 */
function createClock(intervalMs: number) {
  let now = typeof window === "undefined" ? null : new Date();
  const listeners = new Set<() => void>();
  let timer: ReturnType<typeof setInterval> | null = null;
  return {
    subscribe(l: () => void) {
      listeners.add(l);
      if (!timer) {
        timer = setInterval(() => {
          now = new Date();
          listeners.forEach((fn) => fn());
        }, intervalMs);
      }
      return () => {
        listeners.delete(l);
        if (listeners.size === 0 && timer) {
          clearInterval(timer);
          timer = null;
        }
      };
    },
    get: () => {
      if (!now) now = new Date();
      return now;
    },
  };
}

const minuteClock = createClock(30_000);
const secondClock = createClock(1_000);

/** Current time, refreshed every 30s. null during SSR. */
export function useNow(): Date | null {
  return useSyncExternalStore(minuteClock.subscribe, minuteClock.get, () => null);
}

/** Current time refreshed every second — use only in small leaf components (timers). */
export function useNowSeconds(): Date | null {
  return useSyncExternalStore(secondClock.subscribe, secondClock.get, () => null);
}

export function useToday(): DateKey | null {
  const now = useNow();
  return now ? toDateKey(now) : null;
}

export function useNowMinutes(): number | null {
  const now = useNow();
  return now ? minutesOfDay(now) : null;
}
