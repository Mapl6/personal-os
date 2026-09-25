import { useSyncExternalStore } from "react";

/**
 * Minimal selector-based store (zustand-like). Components subscribe to the
 * slice they read, so opening a dialog doesn't re-render the whole tree.
 */
export function createStore<S>(initial: S) {
  let state = initial;
  const listeners = new Set<() => void>();
  const get = () => state;
  const set = (patch: Partial<S> | ((s: S) => Partial<S>)) => {
    const next = typeof patch === "function" ? patch(state) : patch;
    state = { ...state, ...next };
    listeners.forEach((l) => l());
  };
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };
  function useStore<T>(selector: (s: S) => T): T {
    return useSyncExternalStore(
      subscribe,
      () => selector(state),
      () => selector(initial),
    );
  }
  return { get, set, subscribe, useStore };
}
