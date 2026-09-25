"use client";

import { Command, Plus } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CommandCenter } from "@/features/command/command-center";
import { NotificationScheduler, RecurrenceMaterializer } from "@/features/notifications/background";
import { Onboarding } from "@/features/onboarding/onboarding";
import { BlockEditorDialog, RescheduleDialog, RolloverDialog, SplitDialog } from "@/features/tasks/schedule-dialogs";
import { TaskEditorDialog } from "@/features/tasks/task-editor-dialog";
import { useSettings } from "@/hooks/queries";
import { ui } from "@/store/ui-store";
import { BottomNav } from "./bottom-nav";
import { GlobalShortcuts } from "./shortcuts";
import { Sidebar } from "./sidebar";
import { ThemeSync } from "./theme-sync";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { settings, isLoading, isError, error } = useSettings();

  if (isError) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6 text-center">
        <div>
          <p className="font-medium">Couldn’t open local storage.</p>
          <p className="mt-1 text-sm text-muted-foreground">{(error as Error).message}. Private browsing may block IndexedDB.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-dvh" aria-busy>
        <div className="hidden w-60 border-r border-border md:block" />
        <div className="flex-1 space-y-4 p-8">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!settings.onboarded) {
    return (
      <>
        <ThemeSync />
        <Onboarding />
      </>
    );
  }

  return (
    <div className="flex min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/90 px-4 py-2.5 backdrop-blur md:hidden">
          <span className="text-sm font-semibold">Personal OS</span>
          <div className="flex gap-1">
            <Button size="icon-sm" variant="ghost" onClick={() => ui.openCommand()} aria-label="Open command center">
              <Command />
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={() => ui.newTask()} aria-label="New task">
              <Plus />
            </Button>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-36 pt-5 md:px-6 md:pb-10 lg:px-8">
          {children}
        </main>
      </div>
      <BottomNav />

      <CommandCenter />
      <TaskEditorDialog />
      <RescheduleDialog />
      <SplitDialog />
      <BlockEditorDialog />
      <RolloverDialog />
      <GlobalShortcuts />
      <ThemeSync />
      <RecurrenceMaterializer />
      <NotificationScheduler />
    </div>
  );
}
