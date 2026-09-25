"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { ui, uiStore } from "@/store/ui-store";
import { NAV_ITEMS } from "./nav-items";

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || el.getAttribute("role") === "combobox";
}

/**
 * Global keyboard shortcuts:
 *  ⌘/Ctrl+K  command center      N  new task
 *  G then D/T/C/W/M/K/P/A/G/H/Y/R/S  navigate
 */
export function GlobalShortcuts() {
  const router = useRouter();
  React.useEffect(() => {
    let pendingG = 0;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ui.toggleCommand();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      const s = uiStore.get();
      if (s.commandOpen || s.taskEditor || s.rescheduleBlockId || s.splitBlockId || s.blockEditorId || s.rolloverOpen) return;
      if (document.querySelector("[role=dialog],[role=alertdialog],[role=menu]")) return;
      const key = e.key.toLowerCase();
      if (pendingG && Date.now() - pendingG < 1200) {
        pendingG = 0;
        const item = NAV_ITEMS.find((n) => n.shortcut === key);
        if (item) {
          e.preventDefault();
          router.push(item.href);
        }
        return;
      }
      if (key === "g") {
        pendingG = Date.now();
        return;
      }
      if (key === "n") {
        e.preventDefault();
        ui.newTask();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);
  return null;
}
