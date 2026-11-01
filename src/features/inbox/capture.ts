"use client";

import { perform } from "@/hooks/perform";
import { getServices } from "@/services";
import type { CaptureInput } from "@/services/inbox-service";

const INBOX_KEYS = [["inbox"], ["attachments"]];

/** Captures into the inbox with a toast + undo. Shared by ⌘K, the inbox page, paste/drop and mobile capture. */
export function captureToInbox(input: CaptureInput, success = "Added to inbox") {
  return perform(() => getServices().inbox.capture(input), {
    success,
    invalidate: INBOX_KEYS,
    undo: (item) => getServices().inbox.remove(item.id).then((t) => getServices().trash.deleteForever(t.id)),
  });
}

/** Files and text from a paste or drop event. */
export function extractTransfer(dt: DataTransfer | null): CaptureInput | null {
  if (!dt) return null;
  const files = [...dt.files].map((f) => ({ blob: f as Blob, name: f.name }));
  const text = dt.getData("text/uri-list").split(/\r?\n/).find((l) => l && !l.startsWith("#")) || dt.getData("text/plain");
  if (!files.length && !text.trim()) return null;
  return { text, files };
}
