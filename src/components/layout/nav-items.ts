import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  CheckSquare,
  Compass,
  FolderKanban,
  House,
  Layers,
  ChartLine,
  NotebookPen,
  Repeat,
  Settings,
  Sun,
  Target,
  CalendarClock,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Two-key "g x" shortcut. */
  shortcut?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: House, shortcut: "d" },
  { href: "/today", label: "Today", icon: Sun, shortcut: "t" },
  { href: "/calendar", label: "Calendar", icon: CalendarClock, shortcut: "c" },
  { href: "/week", label: "Week", icon: CalendarRange, shortcut: "w" },
  { href: "/month", label: "Month", icon: CalendarDays, shortcut: "m" },
  { href: "/tasks", label: "Tasks", icon: CheckSquare, shortcut: "k" },
  { href: "/projects", label: "Projects", icon: FolderKanban, shortcut: "p" },
  { href: "/areas", label: "Areas", icon: Compass, shortcut: "a" },
  { href: "/goals", label: "Goals", icon: Target, shortcut: "g" },
  { href: "/habits", label: "Habits", icon: Repeat, shortcut: "h" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, shortcut: "y" },
  { href: "/reviews", label: "Reviews", icon: NotebookPen, shortcut: "r" },
  { href: "/settings", label: "Settings", icon: Settings, shortcut: "s" },
];

/**
 * Spaces group related pages so the sidebar stays short: a space links to its
 * first page and shows the rest as tabs (SpaceTabs). Every page keeps its own
 * route, so links, shortcuts and bookmarks keep working.
 */
export interface NavSpace {
  /** Stable id, stored in settings.customization.navOrder / hiddenNav. */
  href: string;
  label: string;
  icon: LucideIcon;
  /** Pages in this space, in tab order. The first one is where the space opens. */
  pages: string[];
}

export const NAV_SPACES: NavSpace[] = [
  { href: "/", label: "Home", icon: House, pages: ["/"] },
  { href: "/today", label: "Today", icon: Sun, pages: ["/today"] },
  { href: "/calendar", label: "Plan", icon: CalendarRange, pages: ["/calendar", "/week", "/month"] },
  { href: "/tasks", label: "Tasks", icon: CheckSquare, pages: ["/tasks"] },
  { href: "/goals", label: "Life", icon: Layers, pages: ["/goals", "/projects", "/areas", "/habits"] },
  { href: "/analytics", label: "Insights", icon: ChartLine, pages: ["/analytics", "/reviews"] },
  { href: "/settings", label: "Settings", icon: Settings, pages: ["/settings"] },
];

/** Tab labels inside a space, where they differ from the page's own nav label. */
export const SPACE_TAB_LABELS: Record<string, string> = { "/week": "Week plan", "/month": "Month plan" };

export const MOBILE_PRIMARY = ["/", "/today", "/calendar", "/tasks"];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function navItem(href: string): NavItem | undefined {
  return NAV_ITEMS.find((n) => n.href === href);
}

export function spaceOf(pathname: string): NavSpace | undefined {
  return NAV_SPACES.find((s) => s.pages.some((p) => isActive(pathname, p)));
}

/** Applies the user's order + visibility to spaces. Settings can never be hidden. */
export function orderNavSpaces(order: string[], hidden: string[]): NavSpace[] {
  const byHref = new Map(NAV_SPACES.map((n) => [n.href, n]));
  const ordered = [
    ...order.map((h) => byHref.get(h)).filter((n): n is NavSpace => !!n),
    ...NAV_SPACES.filter((n) => !order.includes(n.href)),
  ];
  return ordered.filter((n) => n.href === "/settings" || !hidden.includes(n.href));
}
