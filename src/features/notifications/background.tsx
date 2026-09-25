"use client";

import * as React from "react";
import { toast } from "sonner";
import { invalidateWork } from "@/hooks/perform";
import { useSettings } from "@/hooks/queries";
import { addDaysKey, formatTime, minutesOfDay, toDateKey, weekRange, type WeekdayIndex } from "@/lib/date";
import { getServices } from "@/services";

/** Generates upcoming recurring-task instances once per session/day. */
export function RecurrenceMaterializer() {
  const { settings, isSuccess } = useSettings();
  React.useEffect(() => {
    if (!isSuccess || !settings.onboarded) return;
    let cancelled = false;
    const run = () =>
      getServices()
        .schedule.materializeRecurring()
        .then((n) => {
          if (!cancelled && n > 0) invalidateWork();
        })
        .catch((e: Error) => toast.error(`Couldn't generate recurring tasks: ${e.message}`));
    run();
    const id = setInterval(run, 60 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isSuccess, settings.onboarded]);
  return null;
}

function notify(title: string, body: string) {
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try {
      new Notification(title, { body, tag: `${title}-${body}` });
      return;
    } catch {
      /* some browsers require a service worker; fall back to toast */
    }
  }
  toast(title, { description: body });
}

/**
 * Lightweight client-side reminder loop (runs while the app is open).
 * Every reminder fires at most once; the log lives in sessionStorage.
 */
export function NotificationScheduler() {
  const { settings } = useSettings();
  const n = settings.notifications;

  React.useEffect(() => {
    if (!n.enabled) return;
    const sent = new Set<string>(JSON.parse(sessionStorage.getItem("pos-notified") ?? "[]"));
    const once = (key: string, fn: () => void) => {
      if (sent.has(key)) return;
      sent.add(key);
      sessionStorage.setItem("pos-notified", JSON.stringify([...sent].slice(-300)));
      fn();
    };

    const tick = async () => {
      const now = new Date();
      const today = toDateKey(now);
      const minutes = minutesOfDay(now);
      const s = getServices();
      const [blocks, tasks] = await Promise.all([s.store.blocks.listBy("date", today), s.store.tasks.list()]);
      const title = new Map(tasks.map((t) => [t.id, t.title]));

      for (const b of blocks) {
        if (b.status !== "planned" || b.startMinutes === null) continue;
        const name = title.get(b.taskId) ?? "Task";
        const until = b.startMinutes - minutes;
        if (n.upcoming && until > 0 && until <= n.leadMinutes) {
          once(`up:${b.id}:${b.date}:${b.startMinutes}`, () => notify("Coming up", `${name} at ${formatTime(b.startMinutes!)}`));
        }
        if (n.taskStart && until <= 0 && until > -2) {
          once(`start:${b.id}:${b.date}:${b.startMinutes}`, () => notify("Starting now", name));
        }
        if (n.overdue && b.startMinutes + b.durationMinutes < minutes && b.startMinutes + b.durationMinutes > minutes - 30) {
          once(`over:${b.id}:${b.date}`, () => notify("Still open", `${name} — complete it or move it; both are fine.`));
        }
      }
      if (n.dailyPlanning && minutes >= n.dailyPlanningMinutes && minutes < n.dailyPlanningMinutes + 5) {
        once(`plan:${today}`, () => notify("Plan your day", "Take two minutes to shape today’s timeline."));
      }
      if (n.dailyReview && minutes >= n.dailyReviewMinutes && minutes < n.dailyReviewMinutes + 5) {
        once(`review:${today}`, () => notify("Daily review", "How did today go? What moves to tomorrow?"));
      }
      const lastDay = weekRange(today, settings.weekStartsOn as WeekdayIndex).to;
      if (n.weeklyReview && today === lastDay && minutes >= n.dailyReviewMinutes - 60 && minutes < n.dailyReviewMinutes - 55) {
        once(`weekly:${today}`, () => notify("Weekly review", `Wrap up the week before ${addDaysKey(today, 1)}.`));
      }
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [n, settings.weekStartsOn]);

  return null;
}
