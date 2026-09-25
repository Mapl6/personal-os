"use client";

import { Plus, RotateCcw, Trash2 } from "lucide-react";
import * as React from "react";
import { AreaDot } from "@/components/shared/area";
import { OrderList } from "@/components/shared/order-list";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NAV_ITEMS, orderNavItems } from "@/components/layout/nav-items";
import { REVIEW_QUESTIONS } from "@/features/reviews/questions";
import { useAction } from "@/hooks/use-action";
import { useAreas, useHabits } from "@/hooks/queries";
import { createId } from "@/lib/utils/id";
import { getServices } from "@/services";
import { PRIORITIES, type Customization, type DashboardWidget, type ReviewType } from "@/types/domain";

const WIDGET_LABELS: Record<DashboardWidget, string> = {
  progress: "Today’s progress",
  schedule: "Schedule + unscheduled",
  weeklyGoals: "Weekly goals",
  monthlyGoals: "Monthly goals",
  stats: "This week’s stats",
  focus: "Current focus (timer)",
  next: "Next up",
  habits: "Today’s habits",
  areas: "Daily progress by area",
};

function Block({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

/**
 * Customisation lives in settings.customization and is saved immediately —
 * each change is small and reversible.
 */
export function CustomizeSection({ value, onChange }: { value: Customization; onChange: (next: Customization) => void }) {
  const areas = useAreas();
  const habits = useHabits();
  const set = <K extends keyof Customization>(k: K, v: Customization[K]) => onChange({ ...value, [k]: v });
  const [reviewType, setReviewType] = React.useState<ReviewType>("daily");
  const questions = value.reviewQuestions?.[reviewType] ?? REVIEW_QUESTIONS[reviewType].map(({ id, label }) => ({ id, label }));
  const setQuestions = (qs: { id: string; label: string }[]) => {
    const base = value.reviewQuestions ?? {
      daily: REVIEW_QUESTIONS.daily.map(({ id, label }) => ({ id, label })),
      weekly: REVIEW_QUESTIONS.weekly.map(({ id, label }) => ({ id, label })),
      monthly: REVIEW_QUESTIONS.monthly.map(({ id, label }) => ({ id, label })),
    };
    set("reviewQuestions", { ...base, [reviewType]: qs });
  };
  const reorderAreas = useAction((ids: string[]) => Promise.all(ids.map((id, order) => getServices().areas.update(id, { order }))), { invalidate: ["areas"] });
  const reorderHabits = useAction((ids: string[]) => Promise.all(ids.map((id, order) => getServices().habits.update(id, { order }))), { invalidate: ["habits"] });

  return (
    <div className="space-y-6">
      <Block title="Dashboard widgets" hint="Choose what the dashboard shows and in which order. Timer, next-up, habits and area progress sit in the side column.">
        <OrderList
          label="Dashboard widgets"
          items={value.dashboardWidgets.map((w) => ({ id: w.id, label: WIDGET_LABELS[w.id], visible: w.visible }))}
          onChange={(items) => set("dashboardWidgets", items.map((i) => ({ id: i.id as DashboardWidget, visible: i.visible !== false })))}
        />
      </Block>

      <Block title="Navigation" hint="Reorder or hide sidebar items. Hidden pages stay reachable from ⌘K.">
        <OrderList
          label="Navigation items"
          items={orderNavItems(value.navOrder, []).map((n) => ({
            id: n.href,
            label: n.label,
            visible: !value.hiddenNav.includes(n.href),
            locked: n.href === "/settings",
          }))}
          onChange={(items) =>
            onChange({
              ...value,
              navOrder: items.map((i) => i.id),
              hiddenNav: items.filter((i) => i.visible === false).map((i) => i.id),
            })
          }
        />
        <Button size="xs" variant="ghost" onClick={() => onChange({ ...value, navOrder: NAV_ITEMS.map((n) => n.href), hiddenNav: [] })}>
          <RotateCcw /> Reset navigation
        </Button>
      </Block>

      <Block title="New task defaults">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Default area</span>
            <NativeSelect value={value.defaultAreaId ?? ""} onChange={(e) => set("defaultAreaId", e.target.value || null)}>
              <option value="">No area</option>
              {(areas.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </NativeSelect>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Default priority</span>
            <NativeSelect value={value.defaultPriority} onChange={(e) => set("defaultPriority", e.target.value as Customization["defaultPriority"])}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{value.priorityLabels[p] || p}</option>)}
            </NativeSelect>
          </label>
        </div>
      </Block>

      <Block title="Priority names" hint="Rename priorities to match how you think (e.g. “Must”, “Should”, “Could”).">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRIORITIES.map((p) => (
            <label key={p} className="space-y-1">
              <span className="text-xs capitalize text-muted-foreground">{p}</span>
              <Input value={value.priorityLabels[p]} maxLength={20} onChange={(e) => set("priorityLabels", { ...value.priorityLabels, [p]: e.target.value })} />
            </label>
          ))}
        </div>
      </Block>

      <Block title="Timeline">
        <label className="flex items-center gap-3 text-sm">
          <span className="w-28 text-muted-foreground">Zoom</span>
          <input
            type="range"
            min={32}
            max={140}
            step={4}
            value={value.hourHeight}
            onChange={(e) => set("hourHeight", Number(e.target.value))}
            className="flex-1 accent-[var(--primary)]"
            aria-label="Timeline zoom (pixels per hour)"
          />
          <span className="w-16 text-right text-xs text-muted-foreground tabular">{value.hourHeight}px/h</span>
        </label>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">Show completed blocks in timelines and calendar</span>
          <Switch checked={value.showCompletedInTimeline} onCheckedChange={(v) => set("showCompletedInTimeline", v)} aria-label="Show completed blocks" />
        </label>
      </Block>

      <Block title="Review questions" hint="Edit the prompts for each review. Answers already saved are kept.">
        <Tabs value={reviewType} onValueChange={(v) => setReviewType(v as ReviewType)}>
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
        <ul className="space-y-1.5">
          {questions.map((q, i) => (
            <li key={q.id} className="flex gap-2">
              <Input
                className="h-8"
                value={q.label}
                onChange={(e) => setQuestions(questions.map((x) => (x.id === q.id ? { ...x, label: e.target.value } : x)))}
                aria-label={`Question ${i + 1}`}
              />
              <Button size="icon-sm" variant="ghost" onClick={() => setQuestions(questions.filter((x) => x.id !== q.id))} aria-label="Remove question" disabled={questions.length <= 1}>
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Button size="xs" variant="secondary" onClick={() => setQuestions([...questions, { id: createId("q"), label: "New question" }])}>
            <Plus /> Add question
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setQuestions(REVIEW_QUESTIONS[reviewType].map(({ id, label }) => ({ id, label })))}
          >
            <RotateCcw /> Restore defaults
          </Button>
        </div>
      </Block>

      <Block title="Area order" hint="Used in menus, filters and area lists.">
        <OrderList
          label="Areas"
          showVisibility={false}
          items={(areas.data ?? []).map((a) => ({ id: a.id, label: <span className="flex items-center gap-2"><AreaDot color={a.color} />{a.name}</span> }))}
          onChange={(items) => reorderAreas.mutate(items.map((i) => i.id))}
        />
      </Block>

      {(habits.data ?? []).length > 0 && (
        <Block title="Habit order">
          <OrderList
            label="Habits"
            showVisibility={false}
            items={(habits.data ?? []).map((h) => ({ id: h.id, label: h.name }))}
            onChange={(items) => reorderHabits.mutate(items.map((i) => i.id))}
          />
        </Block>
      )}
    </div>
  );
}
