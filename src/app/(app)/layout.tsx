import { AppShell } from "@/components/layout/app-shell";

/** The planner itself: onboarding gate, sidebar, command center and local data. */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
