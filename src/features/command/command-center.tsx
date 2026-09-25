"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CalendarArrowUp,
  CalendarClock,
  CheckSquare,
  Moon,
  NotebookPen,
  Pause,
  Play,
  Plus,
  Redo2,
  Square,
  Target,
  Wand2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { AreaDot } from "@/components/shared/area";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { useToggleTheme } from "@/components/layout/theme-toggle";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Kbd,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { workActions } from "@/features/tasks/actions";
import { useLookups } from "@/features/tasks/use-lookups";
import { perform } from "@/hooks/perform";
import { useBlocks, useSettings, useTimerState } from "@/hooks/queries";
import { useNow } from "@/hooks/use-now";
import { formatDuration, formatTime, relativeDayLabel, toDateKey, type WeekdayIndex } from "@/lib/date";
import { parseQuickAdd, type ParsedQuickAdd } from "@/lib/quick-add/parser";
import { describeRecurrence } from "@/lib/recurrence";
import { getServices } from "@/services";
import { ui, uiStore } from "@/store/ui-store";

type Page = "root" | "timer" | "reschedule";

export function CommandCenter() {
  const open = uiStore.useStore((s) => s.commandOpen);
  return (
    <Dialog open={open} onOpenChange={(o) => (o ? ui.openCommand() : ui.closeCommand())}>
      <DialogContent hideClose className="max-w-xl p-0">
        <DialogTitle className="sr-only">Command center</DialogTitle>
        {open && <CommandBody />}
      </DialogContent>
    </Dialog>
  );
}

function CommandBody() {
  const router = useRouter();
  const toggleTheme = useToggleTheme();
  const lookups = useLookups();
  const { settings } = useSettings();
  const timer = useTimerState();
  const now = useNow() ?? new Date();
  const today = toDateKey(now);
  const todayBlocks = useBlocks({ from: today, to: today });
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState<Page>("root");

  const parsed: ParsedQuickAdd | null = React.useMemo(() => {
    if (search.trim().length < 2) return null;
    return parseQuickAdd(search, {
      now,
      weekStartsOn: settings.weekStartsOn as WeekdayIndex,
      areas: lookups.areas,
      projects: lookups.projects,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, settings.weekStartsOn, lookups.areas, lookups.projects]);

  const go = (href: string) => {
    ui.closeCommand();
    router.push(href);
  };

  const openEditorFrom = (p: ParsedQuickAdd) =>
    ui.newTask({
      title: p.title,
      areaId: p.areaId,
      projectId: p.projectId,
      priority: p.priority ?? undefined,
      tags: p.tags,
      estimatedMinutes: p.durationMinutes ?? settings.defaultDurationMinutes,
      date: p.date,
      startMinutes: p.startMinutes,
      recurrence: p.recurrence ? { ...p.recurrence, startDate: p.date ?? today } : null,
    });

  const create = async (p: ParsedQuickAdd) => {
    if (!p.title || p.ambiguities.length) {
      // Ambiguous → confirmation UI (the full editor, pre-filled).
      openEditorFrom(p);
      return;
    }
    ui.closeCommand();
    const duration = p.durationMinutes ?? settings.defaultDurationMinutes;
    await perform(
      () =>
        getServices().tasks.create(
          {
            title: p.title,
            areaId: p.areaId,
            projectId: p.projectId,
            priority: p.priority ?? undefined,
            tags: p.tags,
            estimatedMinutes: duration,
            recurrence: p.recurrence ? { ...p.recurrence, startDate: p.date ?? today } : null,
          },
          p.date && !p.recurrence ? { date: p.date, startMinutes: p.startMinutes, durationMinutes: duration } : undefined,
        ),
      {
        success: (t) => `Created “${t.title}”`,
        undo: (t) => getServices().tasks.remove(t.id),
      },
    );
  };

  const area = parsed?.areaId ? lookups.areaById.get(parsed.areaId) : undefined;
  const project = parsed?.projectId ? lookups.projectById.get(parsed.projectId) : undefined;
  const running = timer.data?.running;
  const paused = timer.data?.paused;
  const planned = (todayBlocks.data ?? []).filter((b) => b.status === "planned");

  const back = page !== "root" && (
    <CommandItem onSelect={() => setPage("root")} value="__back">
      <ArrowLeft /> Back
    </CommandItem>
  );

  return (
    <Command
      loop
      shouldFilter={true}
      onKeyDown={(e) => {
        if (e.key === "Backspace" && !search && page !== "root") {
          e.preventDefault();
          setPage("root");
        }
      }}
    >
      <CommandInput
        value={search}
        onValueChange={setSearch}
        placeholder={
          page === "timer" ? "Start timer for…" : page === "reschedule" ? "Reschedule which block?" : "Type a command, search, or quick-add “React 2h tomorrow”…"
        }
        aria-label="Command"
      />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>

        {page === "root" && parsed && parsed.title && (
          <CommandGroup heading="Quick add" forceMount>
            <CommandItem forceMount value={`__create ${search}`} onSelect={() => create(parsed)}>
              {parsed.ambiguities.length ? <AlertTriangle className="!text-warning" /> : <Plus />}
              <div className="min-w-0 flex-1">
                <div className="truncate">
                  Create <strong>“{parsed.title}”</strong>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                  {area && (
                    <span className="inline-flex items-center gap-1">
                      <AreaDot color={area.color} /> {area.name}
                    </span>
                  )}
                  {project && <span>· {project.name}</span>}
                  {parsed.durationMinutes && <span>· {formatDuration(parsed.durationMinutes)}</span>}
                  {parsed.date && <span>· {relativeDayLabel(parsed.date, today)}</span>}
                  {parsed.startMinutes !== null && <span>· {formatTime(parsed.startMinutes)}</span>}
                  {parsed.recurrence && <span>· {describeRecurrence({ ...parsed.recurrence, startDate: parsed.date ?? today })}</span>}
                  {parsed.priority && <span>· {parsed.priority}</span>}
                  {parsed.tags.map((t) => (
                    <span key={t}>#{t}</span>
                  ))}
                </div>
                {parsed.ambiguities.length > 0 && (
                  <div className="text-xs text-warning">{parsed.ambiguities.join(" ")} Enter to review.</div>
                )}
              </div>
              <Kbd>↵</Kbd>
            </CommandItem>
            <CommandItem forceMount value={`__create_edit ${search}`} onSelect={() => openEditorFrom(parsed)}>
              <Wand2 /> Create with details…
            </CommandItem>
          </CommandGroup>
        )}

        {page === "root" && (
          <>
            <CommandGroup heading="Actions">
              <CommandItem value="create task new" onSelect={() => ui.newTask()}>
                <Plus /> Create task
              </CommandItem>
              {running ? (
                <>
                  <CommandItem value="pause timer" onSelect={() => { ui.closeCommand(); workActions.pauseTimer(); }}>
                    <Pause /> Pause timer — {lookups.taskById.get(running.taskId)?.title}
                  </CommandItem>
                  <CommandItem value="stop timer" onSelect={() => { ui.closeCommand(); workActions.stopTimer(); }}>
                    <Square /> Stop timer
                  </CommandItem>
                </>
              ) : paused ? (
                <>
                  <CommandItem value="resume timer" onSelect={() => { ui.closeCommand(); workActions.resumeTimer(); }}>
                    <Play /> Resume timer — {lookups.taskById.get(paused.taskId)?.title}
                  </CommandItem>
                  <CommandItem value="stop timer" onSelect={() => { ui.closeCommand(); workActions.stopTimer(); }}>
                    <Square /> Stop timer
                  </CommandItem>
                </>
              ) : null}
              <CommandItem value="start timer" onSelect={() => { setPage("timer"); setSearch(""); }}>
                <Play /> Start timer…
              </CommandItem>
              <CommandItem value="reschedule task move" onSelect={() => { setPage("reschedule"); setSearch(""); }}>
                <CalendarArrowUp /> Reschedule task…
              </CommandItem>
              <CommandItem value="roll over unfinished carry forward" onSelect={() => ui.openRollover()}>
                <Redo2 /> Move unfinished tasks…
              </CommandItem>
              <CommandItem value="create goal" onSelect={() => go("/goals?new=1")}>
                <Target /> Create goal
              </CommandItem>
              <CommandItem value="open daily review" onSelect={() => go("/reviews?type=daily")}>
                <NotebookPen /> Open daily review
              </CommandItem>
              <CommandItem value="open weekly review" onSelect={() => go("/reviews?type=weekly")}>
                <NotebookPen /> Open weekly review
              </CommandItem>
              <CommandItem value="toggle theme dark light" onSelect={toggleTheme.toggle}>
                <Moon /> Toggle dark / light
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Go to">
              {NAV_ITEMS.map((n) => (
                <CommandItem key={n.href} value={`go ${n.label}`} onSelect={() => go(n.href)}>
                  <n.icon /> {n.label}
                  {n.shortcut && (
                    <span className="ml-auto flex gap-0.5">
                      <Kbd>G</Kbd>
                      <Kbd>{n.shortcut.toUpperCase()}</Kbd>
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            {search.trim().length > 0 && (
              <CommandGroup heading="Tasks">
                {lookups.tasks
                  .filter((t) => t.status !== "cancelled")
                  .slice(0, 400)
                  .map((t) => (
                    <CommandItem key={t.id} value={`task ${t.title} ${t.tags.join(" ")} ${t.id}`} onSelect={() => ui.editTask(t.id)}>
                      <CheckSquare />
                      <span className="truncate">{t.title}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{t.status.replace("_", " ")}</span>
                    </CommandItem>
                  ))}
              </CommandGroup>
            )}
          </>
        )}

        {page === "timer" && (
          <CommandGroup heading="Today’s blocks">
            {back}
            {planned.map((b) => {
              const t = lookups.taskById.get(b.taskId);
              if (!t) return null;
              return (
                <CommandItem key={b.id} value={`${t.title} ${b.id}`} onSelect={() => { ui.closeCommand(); workActions.startTimer(t.id, b.id); }}>
                  <Play /> {t.title}
                  <span className="ml-auto text-xs text-muted-foreground tabular">{b.startMinutes !== null ? formatTime(b.startMinutes) : "anytime"}</span>
                </CommandItem>
              );
            })}
            {lookups.tasks
              .filter((t) => ["inbox", "planned", "in_progress"].includes(t.status))
              .slice(0, 200)
              .map((t) => (
                <CommandItem key={t.id} value={`any ${t.title} ${t.id}`} onSelect={() => { ui.closeCommand(); workActions.startTimer(t.id); }}>
                  <Play /> {t.title}
                </CommandItem>
              ))}
          </CommandGroup>
        )}

        {page === "reschedule" && (
          <CommandGroup heading="Planned today">
            {back}
            {planned.length === 0 && (
              <CommandItem value="__none" disabled>
                <CalendarClock /> Nothing planned today
              </CommandItem>
            )}
            {planned.map((b) => {
              const t = lookups.taskById.get(b.taskId);
              if (!t) return null;
              return (
                <CommandItem key={b.id} value={`${t.title} ${b.id}`} onSelect={() => ui.reschedule(b.id)}>
                  <CalendarArrowUp /> {t.title}
                  <span className="ml-auto text-xs text-muted-foreground tabular">{b.startMinutes !== null ? formatTime(b.startMinutes) : "anytime"}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
      <div className="flex items-center gap-3 border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
        <span className="flex items-center gap-1"><Kbd>↵</Kbd> select</span>
        <span className="hidden items-center gap-1 sm:flex">Try: “Gym Thursday 18:00”, “Startup 3h Saturday #mvp !high”</span>
      </div>
    </Command>
  );
}
