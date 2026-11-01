"use client";

import { ImagePlus, Send } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { ui, uiStore } from "@/store/ui-store";
import { captureToInbox } from "./capture";

/** Quick capture from anywhere (press C, or the inbox button on mobile). */
export function CaptureSheet() {
  const open = uiStore.useStore((s) => s.captureOpen);
  const [text, setText] = React.useState("");
  const fileRef = React.useRef<HTMLInputElement>(null);
  const send = async (files: File[] = []) => {
    if (!text.trim() && !files.length) return;
    const ok = await captureToInbox({ text, files: files.map((f) => ({ blob: f, name: f.name })) });
    if (ok) {
      setText("");
      ui.closeCapture();
    }
  };
  return (
    <Sheet open={open} onOpenChange={(o) => (o ? ui.openCapture() : ui.closeCapture())}>
      <SheetContent side="bottom" className="mx-auto w-full max-w-xl gap-3 p-4 md:bottom-auto md:top-24 md:rounded-2xl md:border">
        <SheetTitle className="text-base font-semibold">Capture</SheetTitle>
        <SheetDescription className="sr-only">Send a thought, link or file to your inbox.</SheetDescription>
        <Textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="What’s on your mind?"
          aria-label="Capture text"
          className="min-h-24 text-base"
        />
        <div className="flex items-center justify-between gap-2">
          <input
            ref={fileRef}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              const files = [...(e.target.files ?? [])];
              e.target.value = "";
              if (files.length) send(files);
            }}
          />
          <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
            <ImagePlus /> Add file
          </Button>
          <Button size="sm" onClick={() => send()} disabled={!text.trim()}>
            <Send /> Send to inbox
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
