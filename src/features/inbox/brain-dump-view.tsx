"use client";

import { Brain, Inbox } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { perform } from "@/hooks/perform";
import { getServices } from "@/services";

const DRAFT_KEY = "pos:brain-dump-draft";

/** Empty your head: one line per thought, all of it lands in the inbox at once. */
export function BrainDumpView() {
  // The app shell renders pages only on the client, so storage is available here.
  const [text, setText] = React.useState(() => {
    try {
      return localStorage.getItem(DRAFT_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [done, setDone] = React.useState<number | null>(null);
  React.useEffect(() => {
    try {
      if (text) localStorage.setItem(DRAFT_KEY, text);
      else localStorage.removeItem(DRAFT_KEY);
    } catch {}
  }, [text]);

  const lines = text.split(/\r?\n/).filter((l) => l.trim()).length;
  const submit = async () => {
    const items = await perform(() => getServices().inbox.captureLines(text), {
      success: (r) => `${r.length} thought${r.length === 1 ? "" : "s"} sent to the inbox`,
      invalidate: [["inbox"]],
    });
    if (items) {
      setText("");
      setDone(items.length);
    }
  };

  return (
    <>
      <PageHeader
        title="Brain dump"
        description="Write everything on your mind, one thought per line. Don’t sort, don’t judge — it all goes to the inbox."
      />
      <Textarea
        autoFocus
        value={text}
        onChange={(e) => { setText(e.target.value); setDone(null); }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            if (lines) submit();
          }
        }}
        placeholder={"Call the dentist\nIdea: weekly newsletter about…\nBuy a birthday gift for Sara\n…"}
        aria-label="Brain dump"
        className="min-h-[50vh] text-base leading-7"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          {lines} line{lines === 1 ? "" : "s"} · ⌘↵ to send · your draft is kept on this device
        </span>
        <Button onClick={submit} disabled={!lines}>
          <Brain /> Send {lines || ""} to inbox
        </Button>
      </div>
      {done !== null && (
        <p className="mt-6 text-sm">
          Done — {done} item{done === 1 ? "" : "s"} waiting.{" "}
          <Link href="/inbox" className="inline-flex items-center gap-1 text-primary hover:underline">
            <Inbox className="size-4" /> Process the inbox
          </Link>
        </p>
      )}
    </>
  );
}
