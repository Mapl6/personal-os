"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { useAction } from "@/hooks/use-action";
import { getServices } from "@/services";

/** Flips light/dark and persists it to settings, so ThemeSync doesn't revert it and it survives reloads. */
export function useToggleTheme() {
  const { resolvedTheme, setTheme } = useTheme();
  const save = useAction((theme: "light" | "dark") => getServices().data.saveSettings({ theme }), { invalidate: ["settings"] });
  const next: "light" | "dark" = resolvedTheme === "dark" ? "light" : "dark";
  const toggle = () => {
    setTheme(next);
    save.mutate(next);
  };
  return { next, toggle };
}

/** One-click light/dark switch; persists to settings so it survives reloads and devices' exports. */
export function ThemeToggle({ className, withLabel }: { className?: string; withLabel?: boolean }) {
  const { next, toggle } = useToggleTheme();
  const button = (
    <Button
      variant="ghost"
      size={withLabel ? "sm" : "icon-sm"}
      className={className}
      aria-label={`Switch to ${next} theme`}
      onClick={toggle}
    >
      {/* Icons swap via CSS so SSR and client markup match. */}
      <Sun className="hidden dark:block" />
      <Moon className="dark:hidden" />
      {withLabel && <span className="hidden lg:inline">Theme</span>}
    </Button>
  );
  return withLabel ? button : <Tooltip content="Toggle light / dark">{button}</Tooltip>;
}
