"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils/cn";

export interface OrderItem {
  id: string;
  label: React.ReactNode;
  visible?: boolean;
  /** Visibility can't be toggled (e.g. Settings in navigation). */
  locked?: boolean;
}

/** Reorderable list with optional visibility toggles (keyboard friendly: up/down buttons). */
export function OrderList({
  items,
  onChange,
  showVisibility = true,
  label,
}: {
  items: OrderItem[];
  onChange: (items: OrderItem[]) => void;
  showVisibility?: boolean;
  label: string;
}) {
  const move = (index: number, dir: -1 | 1) => {
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(index + dir, 0, item);
    onChange(next);
  };
  return (
    <ul aria-label={label} className="divide-y divide-border rounded-lg border border-border">
      {items.map((item, i) => (
        <li key={item.id} className={cn("flex items-center gap-3 px-3 py-1.5 text-sm", showVisibility && item.visible === false && "text-muted-foreground")}>
          {showVisibility && (
            <Checkbox
              checked={item.visible !== false}
              disabled={item.locked}
              onCheckedChange={(v) => onChange(items.map((x) => (x.id === item.id ? { ...x, visible: !!v } : x)))}
              aria-label={`Show ${typeof item.label === "string" ? item.label : item.id}`}
            />
          )}
          <span className="flex-1">{item.label}</span>
          <Button size="icon-xs" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
            <ArrowUp />
          </Button>
          <Button size="icon-xs" variant="ghost" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
            <ArrowDown />
          </Button>
        </li>
      ))}
    </ul>
  );
}
