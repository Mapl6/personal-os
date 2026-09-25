"use client";

import { Menu, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { TimerWidget } from "@/features/time-tracking/timer-widget";
import { cn } from "@/lib/utils/cn";
import { ui, uiStore } from "@/store/ui-store";
import { MOBILE_PRIMARY, NAV_ITEMS, isActive } from "./nav-items";

/** Mobile navigation: four primary tabs, a central add button and a "More" sheet. */
export function BottomNav() {
  const pathname = usePathname();
  const moreOpen = uiStore.useStore((s) => s.mobileNavOpen);
  const primary = NAV_ITEMS.filter((n) => MOBILE_PRIMARY.includes(n.href));
  const [first, second] = [primary.slice(0, 2), primary.slice(2)];

  const tab = (item: (typeof NAV_ITEMS)[number]) => {
    const active = isActive(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn("flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium", active ? "text-primary" : "text-muted-foreground")}
      >
        <item.icon className="size-5" aria-hidden />
        {item.label}
      </Link>
    );
  };

  return (
    <>
      <div className="fixed inset-x-3 bottom-[76px] z-30 md:hidden">
        <TimerWidget variant="floating" />
      </div>
      <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-safe backdrop-blur md:hidden">
        <div className="flex items-stretch">
          {first.map(tab)}
          <div className="flex flex-1 items-center justify-center">
            <button
              type="button"
              onClick={() => ui.newTask()}
              aria-label="New task"
              className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 active:scale-95"
            >
              <Plus className="size-5" />
            </button>
          </div>
          {second.map(tab)}
          <button
            type="button"
            onClick={() => ui.setMobileNav(true)}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground"
            aria-haspopup="dialog"
          >
            <Menu className="size-5" aria-hidden />
            More
          </button>
        </div>
      </nav>
      <Sheet open={moreOpen} onOpenChange={ui.setMobileNav}>
        <SheetContent side="bottom" className="p-4">
          <SheetTitle className="mb-3 text-sm font-semibold">Navigate</SheetTitle>
          <div className="grid grid-cols-3 gap-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => ui.setMobileNav(false)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border border-border py-3 text-xs",
                  isActive(pathname, item.href) ? "border-primary/50 bg-primary/10 text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-5" aria-hidden />
                {item.label}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
