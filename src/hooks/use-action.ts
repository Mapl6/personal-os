"use client";

import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";

export type InvalidateGroup = "work" | "goals" | "habits" | "reviews" | "templates" | "areas" | "projects" | "settings" | "all";

const GROUPS: Record<Exclude<InvalidateGroup, "all">, QueryKey[]> = {
  // Anything touching tasks/blocks/time can affect goals & analytics too.
  work: [["tasks"], ["blocks"], ["timeEntries"]],
  goals: [["goals"], ["goalProgress"]],
  habits: [["habits"], ["habitEntries"]],
  reviews: [["reviews"]],
  templates: [["templates"]],
  areas: [["areas"], ["tasks"], ["projects"]],
  projects: [["projects"], ["tasks"]],
  settings: [["settings"]],
};

export interface ActionOptions<TVars, TResult> {
  invalidate: InvalidateGroup[];
  /** Success toast. Omit for silent success (e.g. frequent drag moves). */
  success?: string | ((result: TResult, vars: TVars) => string | null);
  /** Optional undo shown in the success toast. */
  undo?: (result: TResult, vars: TVars) => Promise<unknown>;
  onSuccess?: (result: TResult, vars: TVars) => void;
  optimistic?: (vars: TVars, qc: ReturnType<typeof useQueryClient>) => (() => void) | void;
}

/**
 * Wraps a service call as a mutation with loading state, cache invalidation,
 * success toasts and — always — an error toast. Nothing fails silently.
 */
export function useAction<TVars = void, TResult = unknown>(
  fn: (vars: TVars) => Promise<TResult>,
  options: ActionOptions<TVars, TResult>,
) {
  const qc = useQueryClient();
  const invalidate = async (): Promise<void> => {
    const keys = options.invalidate.includes("all")
      ? null
      : options.invalidate.flatMap((g) => GROUPS[g as Exclude<InvalidateGroup, "all">]);
    if (!keys) return qc.invalidateQueries();
    await Promise.all(keys.map((queryKey) => qc.invalidateQueries({ queryKey })));
  };
  return useMutation<TResult, Error, TVars, { rollback?: () => void }>({
    mutationFn: fn,
    onMutate: (vars) => {
      const rollback = options.optimistic?.(vars, qc);
      return { rollback: rollback ?? undefined };
    },
    onError: (error, _vars, context) => {
      context?.rollback?.();
      toast.error(error.message || "Something went wrong");
    },
    onSuccess: (result, vars) => {
      options.onSuccess?.(result, vars);
      const message = typeof options.success === "function" ? options.success(result, vars) : options.success;
      if (message) {
        toast.success(message, options.undo
          ? {
              action: {
                label: "Undo",
                onClick: () => {
                  options.undo!(result, vars).then(invalidate, (e: Error) => toast.error(e.message));
                },
              },
            }
          : undefined);
      }
    },
    onSettled: () => invalidate(),
  });
}
