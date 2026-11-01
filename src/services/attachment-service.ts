import { createId } from "@/lib/utils/id";
import { MAX_ATTACHMENT_BYTES, type Attachment } from "@/types/domain";
import { DomainError, type ServiceContext } from "./context";

async function sha256(blob: Blob): Promise<string> {
  const buf =
    typeof blob.arrayBuffer === "function"
      ? await blob.arrayBuffer()
      : await new Promise<ArrayBuffer>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as ArrayBuffer);
          r.onerror = () => reject(r.error);
          r.readAsArrayBuffer(blob);
        });
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const hash = await crypto.subtle.digest("SHA-256", buf);
    return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Non-secure contexts have no SubtleCrypto: fall back to a cheap fingerprint (dedupe only).
  const bytes = new Uint8Array(buf);
  let h = 2166136261;
  for (let i = 0; i < bytes.length; i++) h = Math.imul(h ^ bytes[i], 16777619);
  return `fnv-${(h >>> 0).toString(16)}-${bytes.length}`;
}

/** Files people capture or paste. Identical bytes are stored once. */
export function createAttachmentService(ctx: ServiceContext) {
  const { store } = ctx;
  return {
    async add(blob: Blob, name: string): Promise<Attachment> {
      if (blob.size > MAX_ATTACHMENT_BYTES) {
        throw new DomainError(`“${name}” is ${(blob.size / 1024 / 1024).toFixed(1)} MB — the limit is ${MAX_ATTACHMENT_BYTES / 1024 / 1024} MB.`);
      }
      const hash = await sha256(blob);
      const existing = (await store.attachments.listBy("sha256", hash))[0];
      if (existing) return existing;
      const now = ctx.now().toISOString();
      const att: Attachment = {
        id: createId("att"),
        name: name || "file",
        mime: blob.type || "application/octet-stream",
        size: blob.size,
        sha256: hash,
        blob,
        createdAt: now,
        updatedAt: now,
      };
      try {
        return await store.attachments.put(att);
      } catch (e) {
        if (e instanceof DOMException && e.name === "QuotaExceededError") {
          throw new DomainError("Storage is full — free some space or export and delete old attachments.");
        }
        throw e;
      }
    },
    /** Deletes attachments nothing refers to any more (run from boot). */
    async cleanupUnreferenced(): Promise<number> {
      const [atts, inbox, contents, trash] = await Promise.all([
        store.attachments.list(),
        store.inbox.list(),
        store.pageContents.list(),
        store.trash.list(),
      ]);
      const used = new Set(inbox.flatMap((i) => i.attachmentIds));
      const haystack = JSON.stringify([contents.map((c) => c.doc), trash.map((t) => t.rows)]);
      const orphans = atts.filter((a) => !used.has(a.id) && !haystack.includes(a.id));
      await store.attachments.deleteMany(orphans.map((a) => a.id));
      return orphans.length;
    },
  };
}

export type AttachmentService = ReturnType<typeof createAttachmentService>;
