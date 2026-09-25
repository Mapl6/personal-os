"use client";

import { ChevronsLeft, ChevronsRight, Command, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/command";
import { Tooltip } from "@/components/ui/tooltip";
import { TimerWidget } from "@/features/time-tracking/timer-widget";
import { cn } from "@/lib/utils/cn";
import { ui } from "@/store/ui-store";
import { NAV_ITEMS, isActive } from "./nav-items";

const COLLAPSE_KEY = "pos-sidebar-collapsed";

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 px-2", collapsed && "justify-center px-0")}>
      <div className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
          <path d="M4 12a8 8 0 1 0 16 0 8 8 0 0 0-16 0" opacity=".35" />
          <path d="M12 4a8 8 0 0 1 8 8" strokeLinecap="round" />
          <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
        </svg>
      </div>
      {!collapsed && <span className="text-sm font-semibold tracking-tight">Personal OS</span>}
    </div>
  );
}

/**
 * Desktop: full sidebar (collapsible). Tablet (md): icon rail by default.
 * Mobile uses BottomNav instead.
 */
export function Sidebar() {
  const pathname = usePathname();
  const [collapsedPref, setCollapsedPref] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    try {
      const v = localStorage.getItem(COLLAPSE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read persisted UI pref after hydration
      if (v !== null) setCollapsedPref(v === "1");
    } catch {}
  }, []);

  const toggle = () => {
    // In "auto" mode the rail is collapsed below lg, so the first click expands there.
    const visuallyCollapsed = collapsedPref ?? !window.matchMedia("(min-width: 1024px)").matches;
    const next = !visuallyCollapsed;
    setCollapsedPref(next);
    try {
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
    } catch {}
  };

  // On md (tablet) the rail is collapsed unless the user expanded it; on lg it's expanded unless collapsed.
  const collapsed = collapsedPref ?? false;

  return (
    <aside
      aria-label="Main navigation"
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border bg-surface py-3 md:flex",
        collapsed ? "w-16" : "w-16 lg:w-60",
        collapsedPref === false && "md:w-60",
      )}
      data-collapsed={collapsed}
    >
      <div className="mb-3 flex items-center justify-between px-3">
        <span className={cn(collapsed ? "" : "lg:hidden", collapsedPref === false && "md:hidden")}>
          <Brand collapsed />
        </span>
        <span className={cn("hidden", !collapsed && "lg:block", collapsedPref === false && "md:block")}>
          <Brand collapsed={false} />
        </span>
      </div>

      <div className="space-y-1 px-2">
        <SidebarButton collapsed={collapsed} expanded={collapsedPref === false} label="New task" onClick={() => ui.newTask()} icon={<Plus />} hint={<Kbd>N</Kbd>} primary />
        <SidebarButton collapsed={collapsed} expanded={collapsedPref === false} label="Command" onClick={() => ui.openCommand()} icon={<Command />} hint={<Kbd>⌘K</Kbd>} />
      </div>

      <nav className="mt-3 flex-1 space-y-0.5 overflow-y-auto px-2 scrollbar-thin">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const link = (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors",
                active ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                collapsed ? "justify-center px-0" : "justify-center px-0 lg:justify-start lg:px-2.5",
                collapsedPref === false && "md:justify-start md:px-2.5",
              )}
            >
              <item.icon className={cn("size-4 shrink-0", active && "text-primary")} aria-hidden />
              <span className={cn("sr-only", !collapsed && "lg:not-sr-only", collapsedPref === false && "md:not-sr-only")}>{item.label}</span>
            </Link>
          );
          return (
            <div key={item.href}>
              <span className={cn(!collapsed && "lg:hidden", collapsedPref === false && "md:hidden")}>
                <Tooltip content={item.label} side="right">
                  {link}
                </Tooltip>
              </span>
              <span className={cn("hidden", !collapsed && "lg:block", collapsedPref === false && "md:block")}>{link}</span>
            </div>
          );
        })}
      </nav>

      <div className={cn("hidden px-2 pb-2", !collapsed && "lg:block", collapsedPref === false && "md:block")}>
        <TimerWidget variant="sidebar" />
      </div>
      <div className="px-2">
        <Button variant="ghost" size="sm" className="w-full justify-center" onClick={toggle} aria-label="Toggle sidebar">
          {collapsedPref === null ? (
            <>
              <ChevronsRight className="lg:hidden" />
              <ChevronsLeft className="hidden lg:block" />
            </>
          ) : collapsed ? (
            <ChevronsRight />
          ) : (
            <ChevronsLeft />
          )}
        </Button>
      </div>
    </aside>
  );
}

function SidebarButton({
  collapsed,
  expanded,
  label,
  onClick,
  icon,
  hint,
  primary,
}: {
  collapsed: boolean;
  expanded: boolean;
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  hint?: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <Button
      variant={primary ? "default" : "secondary"}
      size="sm"
      onClick={onClick}
      aria-label={label}
      className={cn("w-full", collapsed ? "px-0" : "px-0 lg:justify-start lg:px-2.5", expanded && "md:justify-start md:px-2.5")}
    >
      {icon}
      <span className={cn("hidden", !collapsed && "lg:inline", expanded && "md:inline")}>{label}</span>
      <span className={cn("ml-auto hidden opacity-70", !collapsed && "lg:inline-flex", expanded && "md:inline-flex")}>{hint}</span>
    </Button>
  );
}
