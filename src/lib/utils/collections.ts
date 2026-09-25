export function groupBy<T, K extends string | number>(
  items: readonly T[],
  key: (item: T) => K,
): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const item of items) {
    const k = key(item);
    (out[k] ??= []).push(item);
  }
  return out;
}

export function indexBy<T, K extends string>(items: readonly T[], key: (item: T) => K): Map<K, T> {
  const map = new Map<K, T>();
  for (const item of items) map.set(key(item), item);
  return map;
}

export function sumBy<T>(items: readonly T[], fn: (item: T) => number): number {
  let total = 0;
  for (const item of items) total += fn(item);
  return total;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function percent(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}
