"use client";

import type { QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { getQueryClient } from "@/lib/query/client";

const WORK_KEYS: QueryKey[] = [["tasks"], ["blocks"], ["timeEntries"]];

export async function invalidateWork(extra: QueryKey[] = []) {
  const qc = getQueryClient();
  await Promise.all([...WORK_KEYS, ...extra].map((queryKey) => qc.invalidateQueries({ queryKey })));
}

/**
 * Fire-and-forget action for quick buttons/menus (complete, skip, timer…).
 * Always toasts errors; optionally toasts success with an Undo.
 */
export async function perform<T>(
  fn: () => Promise<T>,
  options: {
    success?: string | ((r: T) => string);
    undo?: (r: T) => Promise<unknown>;
    invalidate?: QueryKey[];
    optimistic?: () => (() => void) | void;
  } = {},
): Promise<T | undefined> {
  const rollback = options.optimistic?.();
  try {
    const result = await fn();
    await invalidateWork(options.invalidate);
    const message = typeof options.success === "function" ? options.success(result) : options.success;
    if (message) {
      toast.success(
        message,
        options.undo
          ? {
              action: {
                label: "Undo",
                onClick: () =>
                  options.undo!(result).then(
                    () => invalidateWork(options.invalidate),
                    (e: Error) => toast.error(e.message),
                  ),
              },
            }
          : undefined,
      );
    }
    return result;
  } catch (e) {
    rollback?.();
    await invalidateWork(options.invalidate);
    toast.error(e instanceof Error ? e.message : "Something went wrong");
    return undefined;
  }
}
