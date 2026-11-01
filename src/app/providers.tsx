"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import * as React from "react";
import { Toaster } from "sonner";
import { ChangeFeedBridge } from "@/components/layout/change-feed-bridge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getQueryClient } from "@/lib/query/client";

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={(resolvedTheme as "dark" | "light") ?? "dark"}
      position="bottom-right"
      closeButton
      toastOptions={{ classNames: { toast: "!rounded-lg !border-border !bg-popover !text-popover-foreground" } }}
      offset={{ bottom: 24 }}
      mobileOffset={{ bottom: 88 }}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const client = getQueryClient();
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        <TooltipProvider delayDuration={300}>
          <ChangeFeedBridge />
          {children}
          <ThemedToaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
