"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { SPACE_TAB_LABELS, isActive, navItem, spaceOf } from "./nav-items";

/** Tab bar for the pages inside the current space (e.g. Plan → Calendar · Week plan · Month plan). */
export function SpaceTabs() {
  const pathname = usePathname();
  const space = spaceOf(pathname);
  if (!space || space.pages.length < 2) return null;
  return (
    <nav aria-label={space.label} className="-mx-4 mb-6 border-b border-border px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
      <div className="-mb-px flex gap-6 overflow-x-auto scrollbar-thin">
        {space.pages.map((href) => {
          const item = navItem(href);
          if (!item) return null;
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-11 shrink-0 items-center gap-2 border-b-2 text-sm transition-colors",
                active ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon className={cn("size-4", active && "text-primary")} aria-hidden />
              {SPACE_TAB_LABELS[href] ?? item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
