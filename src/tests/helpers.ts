import { createMemoryStore } from "@/repositories/memory-store";
import { createServices } from "@/services";

/** A controllable clock + services over an in-memory store. */
export function setupServices(start = new Date(2026, 8, 24, 10, 0)) {
  let now = new Date(start);
  const clock = {
    now: () => new Date(now),
    set(d: Date) {
      now = new Date(d);
    },
    advance(minutes: number) {
      now = new Date(now.getTime() + minutes * 60000);
    },
  };
  const store = createMemoryStore();
  const services = createServices(store, clock.now);
  return { services, store, clock };
}
