"use client";

import * as React from "react";
import { useSettings } from "@/hooks/queries";
import { getServices } from "@/services";

/**
 * Asks the browser once (after onboarding) to keep local data even under
 * storage pressure. Without it, browsers may evict IndexedDB silently.
 */
export function StoragePersistence() {
  const { settings, isSuccess } = useSettings();
  React.useEffect(() => {
    if (!isSuccess || !settings.onboarded || settings.storagePersistAsked) return;
    if (typeof navigator === "undefined" || !navigator.storage?.persist) return;
    navigator.storage
      .persist()
      .catch(() => false)
      .finally(() => getServices().data.saveSettings({ storagePersistAsked: true }));
  }, [isSuccess, settings.onboarded, settings.storagePersistAsked]);
  return null;
}
