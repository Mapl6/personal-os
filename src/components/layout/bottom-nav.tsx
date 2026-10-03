"use client";

import { Menu, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { TimerWidget } from "@/features/time-tracking/timer-widget";
import { cn } from "@/lib/utils/cn";
import { ui, uiStore } from "@/store/ui-store";
import { useSettings } from "@/hooks/queries";
import { MOBILE_PRIMARY, NAV_SPACES, SPACE_TAB_LABELS, isActive, navItem, orderNavSpaces, spaceOf, type NavSpace } from "./nav-items";

/** Mobile navigation: four primary spaces, a central add button and a "More" sheet listing every page by space. */
export function BottomNav() {
  const pathname = usePathname();
  const moreOpen = uiStore.useStore((s) => s.mobileNavOpen);
  const { settings } = useSettings();
  const spaces = orderNavSpaces(settings.customization.navOrder, settings.customization.hiddenNav);
  const primary = NAV_SPACES.filter((n) => MOBILE_PRIMARY.includes(n.href));
  const [first, second] = [primary.slice(0, 2), primary.slice(2)];
  const current = spaceOf(pathname)?.href;
  const moreActive = !!current && !MOBILE_PRIMARY.includes(current);

  const tab = (space: NavSpace) => {
    const active = current === space.href;
    return (
      <Link
        key={space.href}
        href={space.href}
        aria-current={active ? "page" : undefined}
        className={cn("flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium", active ? "text-primary" : "text-muted-foreground")}
      >
        <space.icon className="size-5" aria-hidden />
        {space.label}
      </Link>
    );
  };

  const pageLink = (href: string) => {
    const item = navItem(href);
    if (!item) return null;
    const active = isActive(pathname, href);
    return (
      <Link
        key={href}
        href={href}
        onClick={() => ui.setMobileNav(false)}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-11 items-center gap-2.5 rounded-lg border px-3 text-sm",
          active ? "border-primary/60 bg-primary/10 text-foreground" : "border-border bg-card text-foreground",
        )}
      >
        <item.icon className={cn("size-4", active ? "text-primary" : "text-muted-foreground")} aria-hidden />
        {SPACE_TAB_LABELS[href] ?? item.label}
      </Link>
    );
  };

  return (
    <>
      <div className="fixed inset-x-3 bottom-[76px] z-30 md:hidden">
        <TimerWidget variant="floating" />
      </div>
      <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface pb-safe md:hidden">
        <div className="flex items-stretch">
          {first.map(tab)}
          <div className="flex flex-1 items-center justify-center">
            <button
              type="button"
              onClick={() => ui.newTask()}
              aria-label="New task"
              className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground active:scale-95"
            >
              <Plus className="size-5" />
            </button>
          </div>
          {second.map(tab)}
          <button
            type="button"
            onClick={() => ui.setMobileNav(true)}
            className={cn("flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium", moreActive ? "text-primary" : "text-muted-foreground")}
            aria-haspopup="dialog"
          >
            <Menu className="size-5" aria-hidden />
            More
          </button>
        </div>
      </nav>
      <Sheet open={moreOpen} onOpenChange={ui.setMobileNav}>
        <SheetContent side="bottom" className="max-h-[80dvh] overflow-y-auto p-5">
          <SheetTitle className="mb-4 text-base font-semibold">Go to</SheetTitle>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-2">{spaces.filter((sp) => sp.pages.length === 1).map((sp) => pageLink(sp.pages[0]))}</div>
            {spaces
              .filter((sp) => sp.pages.length > 1)
              .map((space) => (
                <section key={space.href}>
                  <h3 className="mb-2 text-[13px] font-medium text-muted-foreground">{space.label}</h3>
                  <div className="grid grid-cols-2 gap-2">{space.pages.map(pageLink)}</div>
                </section>
              ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
