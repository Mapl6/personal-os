"use client";

import { useTheme } from "next-themes";
import * as React from "react";
import { useSettings } from "@/hooks/queries";

export const APPEARANCE_KEY = "pos-appearance";

/** Applies persisted appearance settings (theme, accent, density) to <html>. */
export function ThemeSync() {
  const { settings, isSuccess } = useSettings();
  const { setTheme } = useTheme();
  React.useEffect(() => {
    if (!isSuccess) return;
    const root = document.documentElement;
    root.dataset.accent = settings.accent;
    root.dataset.density = settings.density;
    root.dataset.dateLang = settings.calendar.language;
    setTheme(settings.theme);
    try {
      localStorage.setItem(APPEARANCE_KEY, JSON.stringify({ accent: settings.accent, density: settings.density, dateLang: settings.calendar.language }));
    } catch {
      /* storage unavailable — appearance still applied for this session */
    }
  }, [isSuccess, settings.accent, settings.density, settings.theme, settings.calendar.language, setTheme]);
  return null;
}

/** Inline script (runs before paint) to avoid an accent/density flash. */
export const appearanceScript = `try{var a=JSON.parse(localStorage.getItem("${APPEARANCE_KEY}")||"{}");var r=document.documentElement;if(a.accent)r.dataset.accent=a.accent;if(a.density)r.dataset.density=a.density;if(a.dateLang)r.dataset.dateLang=a.dateLang;}catch(e){}`;
