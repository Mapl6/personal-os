/**
 * Persistent-storage helpers.
 *
 * All data lives in IndexedDB, which browsers (Safari especially) may evict
 * under storage pressure unless the site has persistent storage. These
 * helpers degrade gracefully where the Storage API is unavailable.
 */

/** Whether storage is currently persisted. `null` when the API is missing. */
export async function isStoragePersisted(): Promise<boolean | null> {
  try {
    if (typeof navigator === "undefined" || !navigator.storage?.persisted) return null;
    return await navigator.storage.persisted();
  } catch {
    return null;
  }
}

/** Ask the browser for persistent storage. `null` when the API is missing. */
export async function requestPersistentStorage(): Promise<boolean | null> {
  try {
    if (typeof navigator === "undefined" || !navigator.storage?.persist) return null;
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}

/** Storage usage estimate. `null` when the API is missing. */
export async function getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
  try {
    if (typeof navigator === "undefined" || !navigator.storage?.estimate) return null;
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    return { usage, quota };
  } catch {
    return null;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
