import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  CheckSquare,
  Compass,
  FolderKanban,
  LayoutDashboard,
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
  { href: "/", label: "Dashboard", icon: LayoutDashboard, shortcut: "d" },
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

export const MOBILE_PRIMARY = ["/", "/today", "/week", "/tasks"];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
