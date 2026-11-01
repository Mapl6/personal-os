"use client";

import { Archive, CheckSquare, FileText, Image as ImageIcon, Inbox, Link2, Paperclip, RotateCcw, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Kbd } from "@/components/ui/command";
import { Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { perform } from "@/hooks/perform";
import { useAttachment, useInbox } from "@/hooks/queries";
import { getServices } from "@/services";
import type { InboxItem } from "@/types/domain";
import { captureToInbox, extractTransfer } from "./capture";

const KEYS = [["inbox"], ["attachments"], ["pages"], ["trash"]];
type Status = InboxItem["status"];

const KIND_ICON = { text: FileText, link: Link2, image: ImageIcon, file: Paperclip } as const;

const act = {
  toTask: (item: InboxItem) =>
    perform(() => getServices().inbox.toTask(item.id), { success: (t) => `Task “${t.title}” created`, invalidate: KEYS }),
  toPage: (item: InboxItem) =>
    perform(() => getServices().inbox.toPage(item.id), { success: (p) => `Page “${p.title}” created`, invalidate: KEYS }),
  archive: (item: InboxItem) =>
    perform(() => getServices().inbox.archive(item.id), {
      success: "Archived",
      invalidate: KEYS,
      undo: () => getServices().inbox.reopen(item.id),
    }),
  reopen: (item: InboxItem) => perform(() => getServices().inbox.reopen(item.id), { success: "Moved back to inbox", invalidate: KEYS }),
  remove: (item: InboxItem) =>
    perform(() => getServices().inbox.remove(item.id), {
      success: "Moved to trash",
      invalidate: KEYS,
      undo: (t) => getServices().trash.restore(t.id),
    }),
};

/**
 * Capture now, decide later. Keyboard: j/k move, t → task, p → page,
 * e → archive, # or Delete → trash.
 */
export function InboxView() {
  const inbox = useInbox();
  const [tab, setTab] = React.useState<Status>("new");
  const [cursor, setCursor] = React.useState(0);
  const listRef = React.useRef<HTMLUListElement>(null);
  const items = React.useMemo(() => (inbox.data ?? []).filter((i) => i.status === tab), [inbox.data, tab]);
  const counts = React.useMemo(() => {
    const c = { new: 0, processed: 0, archived: 0 };
    for (const i of inbox.data ?? []) c[i.status]++;
    return c;
  }, [inbox.data]);
  const current = items[Math.min(cursor, items.length - 1)];

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (document.querySelector("[role=dialog]")) return;
      if (e.key === "j" || e.key === "ArrowDown") setCursor((c) => Math.min(c + 1, Math.max(items.length - 1, 0)));
      else if (e.key === "k" || e.key === "ArrowUp") setCursor((c) => Math.max(c - 1, 0));
      else if (!current) return;
      else if (e.key === "t" && tab === "new") act.toTask(current);
      else if (e.key === "p" && tab === "new") act.toPage(current);
      else if (e.key === "e") (tab === "new" ? act.archive : act.reopen)(current);
      else if (e.key === "#" || e.key === "Delete") act.remove(current);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items.length, current, tab]);

  React.useEffect(() => {
    listRef.current?.querySelector<HTMLElement>("[data-active=true]")?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  return (
    <>
      <PageHeader
        title="Inbox"
        description="Capture anything — thoughts, links, images, files — and sort it out later."
        actions={
          <Button size="sm" variant="ghost" asChild>
            <Link href="/brain-dump">Brain dump</Link>
          </Button>
        }
      />
      <CaptureBox />
      <Tabs value={tab} onValueChange={(v) => { setTab(v as Status); setCursor(0); }} className="mb-3 mt-6">
        <TabsList>
          <TabsTrigger value="new">Inbox {counts.new > 0 && <Badge variant="primary">{counts.new}</Badge>}</TabsTrigger>
          <TabsTrigger value="processed">Processed</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>
      {inbox.isLoading ? (
        <Skeleton className="h-64" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={tab === "new" ? "Inbox zero." : tab === "processed" ? "Nothing processed yet." : "Nothing archived."}
          description={tab === "new" ? "Paste or drop anything here, or press ⌘K and ⌘↵ to capture from anywhere." : undefined}
        />
      ) : (
        <>
          <Card className="overflow-hidden">
            <ul ref={listRef} className="divide-y divide-border" aria-label={`${tab} inbox items`}>
              {items.map((item, i) => (
                <InboxRow key={item.id} item={item} active={item === current} onFocus={() => setCursor(i)} />
              ))}
            </ul>
          </Card>
          <p className="mt-3 hidden flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground md:flex">
            <span><Kbd>J</Kbd>/<Kbd>K</Kbd> move</span>
            {tab === "new" && <span><Kbd>T</Kbd> task</span>}
            {tab === "new" && <span><Kbd>P</Kbd> page</span>}
            <span><Kbd>E</Kbd> {tab === "new" ? "archive" : "back to inbox"}</span>
            <span><Kbd>#</Kbd> delete</span>
          </p>
        </>
      )}
    </>
  );
}

function CaptureBox() {
  const [text, setText] = React.useState("");
  const [over, setOver] = React.useState(false);
  const submit = async () => {
    if (!text.trim()) return;
    const ok = await captureToInbox({ text });
    if (ok) setText("");
  };
  return (
    <div
      className={`rounded-xl border bg-card p-3 transition-colors ${over ? "border-primary bg-primary/5" : "border-border"}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const input = extractTransfer(e.dataTransfer);
        if (input) captureToInbox(input);
      }}
    >
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onPaste={(e) => {
          if (e.clipboardData.files.length === 0) return;
          e.preventDefault();
          const input = extractTransfer(e.clipboardData);
          if (input) captureToInbox({ ...input, text: [text, input.text].filter(Boolean).join("\n") }).then((ok) => ok && setText(""));
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Capture a thought, paste a link or image, drop a file…"
        aria-label="Capture to inbox"
        className="min-h-14 resize-none border-0 px-1 focus-visible:ring-0"
      />
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-xs text-muted-foreground">↵ to capture · ⇧↵ new line · drop files here</span>
        <Button size="sm" onClick={submit} disabled={!text.trim()}>
          <Send /> Capture
        </Button>
      </div>
    </div>
  );
}

function InboxRow({ item, active, onFocus }: { item: InboxItem; active: boolean; onFocus: () => void }) {
  const Icon = KIND_ICON[item.kind];
  const created = new Date(item.createdAt);
  return (
    <li
      data-active={active}
      tabIndex={-1}
      onClick={onFocus}
      className="flex items-start gap-3 px-4 py-3 data-[active=true]:bg-accent/60"
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        {item.text && item.text !== item.url && <p className="whitespace-pre-wrap break-words text-sm">{item.text}</p>}
        {item.url && (
          <a href={item.url} target="_blank" rel="noreferrer noopener" className="break-all text-sm text-primary underline-offset-2 hover:underline">
            {item.url}
          </a>
        )}
        {item.attachmentIds.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {item.attachmentIds.map((id) => (
              <AttachmentChip key={id} id={id} />
            ))}
          </div>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {created.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
          {item.source !== "app" && ` · via ${item.source.replace("_", " ")}`}
          {item.processedTo && (
            <>
              {" · "}
              <Link className="underline-offset-2 hover:underline" href={item.processedTo.type === "page" ? `/pages/${item.processedTo.id}` : "/tasks"}>
                became a {item.processedTo.type}
              </Link>
            </>
          )}
        </p>
        {item.error && <p className="mt-1 text-xs text-danger">Couldn’t process: {item.error}</p>}
      </div>
      <div className="flex shrink-0 gap-1">
        {item.status === "new" ? (
          <>
            <Button size="icon-sm" variant="ghost" onClick={() => act.toTask(item)} aria-label="Make task" title="Make task (T)">
              <CheckSquare />
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={() => act.toPage(item)} aria-label="Make page" title="Make page (P)">
              <FileText />
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={() => act.archive(item)} aria-label="Archive" title="Archive (E)">
              <Archive />
            </Button>
          </>
        ) : (
          <Button size="icon-sm" variant="ghost" onClick={() => act.reopen(item)} aria-label="Back to inbox" title="Back to inbox (E)">
            <RotateCcw />
          </Button>
        )}
        <Button size="icon-sm" variant="ghost" onClick={() => act.remove(item)} aria-label="Delete" title="Delete (#)">
          <Trash2 />
        </Button>
      </div>
    </li>
  );
}

function AttachmentChip({ id }: { id: string }) {
  const att = useAttachment(id).data;
  const url = React.useMemo(() => (att ? URL.createObjectURL(att.blob) : null), [att]);
  React.useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  if (!att || !url) return <Skeleton className="h-16 w-24" />;
  if (att.mime.startsWith("image/")) {
    return (
      <a href={url} target="_blank" rel="noreferrer" title={att.name}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={att.name} className="h-20 max-w-40 rounded-md border border-border object-cover" />
      </a>
    );
  }
  return (
    <a href={url} download={att.name} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs hover:bg-accent">
      <Paperclip className="size-3" /> {att.name} <span className="text-muted-foreground">{Math.max(1, Math.round(att.size / 1024))} KB</span>
    </a>
  );
}
