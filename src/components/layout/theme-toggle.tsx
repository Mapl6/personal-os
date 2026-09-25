"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { useAction } from "@/hooks/use-action";
import { getServices } from "@/services";

/** One-click light/dark switch; persists to settings so it survives reloads and devices' exports. */
export function ThemeToggle({ className, withLabel }: { className?: string; withLabel?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const save = useAction((theme: "light" | "dark") => getServices().data.saveSettings({ theme }), { invalidate: ["settings"] });
  const next = resolvedTheme === "dark" ? "light" : "dark";
  const button = (
    <Button
      variant="ghost"
      size={withLabel ? "sm" : "icon-sm"}
      className={className}
      aria-label={`Switch to ${next} theme`}
      onClick={() => {
        setTheme(next);
        save.mutate(next);
      }}
    >
      {/* Icons swap via CSS so SSR and client markup match. */}
      <Sun className="hidden dark:block" />
      <Moon className="dark:hidden" />
      {withLabel && <span className="hidden lg:inline">Theme</span>}
    </Button>
  );
  return withLabel ? button : <Tooltip content="Toggle light / dark">{button}</Tooltip>;
}
