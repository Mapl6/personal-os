/** Deep copy that keeps Blobs by reference (they are immutable, and not every runtime can structured-clone them). */
export function deepClone<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (typeof Blob !== "undefined" && value instanceof Blob) return value;
  if (Array.isArray(value)) return value.map(deepClone) as T;
  if (Object.getPrototypeOf(value) === Object.prototype) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = deepClone(v);
    return out as T;
  }
  return structuredClone(value);
}
