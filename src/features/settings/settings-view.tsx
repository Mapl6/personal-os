"use client";

import { Bell, Download, Upload } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";
import { toast } from "sonner";
import { DurationInput } from "@/components/shared/duration-input";
import { WeekdayPicker } from "@/components/shared/field";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Kbd } from "@/components/ui/command";
import { Input, NativeSelect } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useAction } from "@/hooks/use-action";
import { useSettings } from "@/hooks/queries";
import { parseTime, timeValue } from "@/lib/date";
import { cn } from "@/lib/utils/cn";
import { getServices } from "@/services";
import { ACCENTS, type Settings } from "@/types/domain";
import { CustomizeSection } from "./customize-section";
import { TagsSection } from "./tags-section";
import { TemplatesSection } from "./template-editor";

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card id={id} className="scroll-mt-6">
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription className="mt-0.5">{description}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
      <div className="sm:w-72">{children}</div>
    </div>
  );
}

export function SettingsView() {
  const { settings, isLoading } = useSettings();
  if (isLoading) return <Skeleton className="h-96" />;
  // Keyed on onboarding only: immediate-save sections must not wipe unsaved edits elsewhere.
  return <SettingsForm key={String(settings.onboarded)} initial={settings} />;
}

function SettingsForm({ initial }: { initial: Settings }) {
  const [s, setS] = React.useState(initial);
  const { setTheme } = useTheme();
  const strip = (x: Settings) => ({ ...x, calendar: null, customization: null, theme: null, accent: null, density: null });
  const dirty = JSON.stringify(strip(s)) !== JSON.stringify(strip(initial));
  const save = useAction((next: Partial<Settings>) => getServices().data.saveSettings(next), { invalidate: ["settings"], success: "Settings saved" });
  const saveQuiet = useAction((next: Partial<Settings>) => getServices().data.saveSettings(next), { invalidate: ["settings"] });
  /** Calendar & customisation apply immediately (and don't disturb unsaved edits elsewhere). */
  const setImmediate = (patch: Partial<Settings>) => {
    setS((prev) => ({ ...prev, ...patch }));
    saveQuiet.mutate(patch);
  };
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((prev) => ({ ...prev, [k]: v }));
  const setN = <K extends keyof Settings["notifications"]>(k: K, v: Settings["notifications"][K]) => setS((prev) => ({ ...prev, notifications: { ...prev.notifications, [k]: v } }));

  // Appearance applies (and persists) immediately.
  const setAppearance = (patch: Partial<Settings>) => {
    setS((prev) => ({ ...prev, ...patch }));
    if (patch.theme) setTheme(patch.theme);
    save.mutate(patch);
  };

  const requestNotifications = async (enabled: boolean) => {
    if (enabled && typeof Notification !== "undefined" && Notification.permission !== "granted") {
      const res = await Notification.requestPermission();
      if (res !== "granted") toast.info("Browser notifications are blocked — reminders will appear as in-app toasts instead.");
    }
    setN("enabled", enabled);
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Everything is stored locally on this device."
        actions={
          <Button size="sm" disabled={!dirty || save.isPending} onClick={() => save.mutate(s)} className="sticky top-2 z-10">
            {save.isPending ? "Saving…" : dirty ? "Save changes" : "Saved"}
          </Button>
        }
      />
      <nav className="mb-4 flex flex-wrap gap-1 text-sm" aria-label="Settings sections">
        {["general", "calendar", "planning", "notifications", "appearance", "customize", "templates", "tags", "data", "shortcuts"].map((id) => (
          <a key={id} href={`#${id}`} className="rounded-md px-2 py-1 capitalize text-muted-foreground hover:bg-accent hover:text-foreground">{id}</a>
        ))}
      </nav>
      <div className="max-w-3xl space-y-4">
        <Section id="general" title="General">
          <Row label="Name"><Input value={s.name} onChange={(e) => set("name", e.target.value)} aria-label="Name" /></Row>
          <Row label="Start of week">
            <NativeSelect value={s.weekStartsOn} onChange={(e) => set("weekStartsOn", Number(e.target.value) as Settings["weekStartsOn"])} aria-label="Start of week">
              <option value={1}>Monday</option>
              <option value={0}>Sunday</option>
              <option value={6}>Saturday</option>
            </NativeSelect>
          </Row>
          <Row label="Default working hours">
            <div className="flex items-center gap-2">
              <Input type="time" step={900} value={timeValue(s.dayStartMinutes)} onChange={(e) => set("dayStartMinutes", parseTime(e.target.value) ?? s.dayStartMinutes)} aria-label="Day start" />
              <span className="text-muted-foreground">–</span>
              <Input type="time" step={900} value={timeValue(s.dayEndMinutes)} onChange={(e) => set("dayEndMinutes", parseTime(e.target.value) ?? s.dayEndMinutes)} aria-label="Day end" />
            </div>
          </Row>
          <Row label="Time zone" hint="Dates use this device's local time.">
            <Input value={s.timeZone} onChange={(e) => set("timeZone", e.target.value)} aria-label="Time zone" />
          </Row>
          <Row label="Date format">
            <NativeSelect value={s.dateFormat} onChange={(e) => set("dateFormat", e.target.value as Settings["dateFormat"])} aria-label="Date format">
              <option value="EEE, MMM d">Fri, Sep 25</option>
              <option value="dd/MM/yyyy">25/09/2026</option>
              <option value="MM/dd/yyyy">09/25/2026</option>
              <option value="yyyy-MM-dd">2026-09-25</option>
            </NativeSelect>
          </Row>
        </Section>

        <Section id="calendar" title="Calendar & language" description="Shamsi (Solar Hijri) or Gregorian. Applied immediately; stored dates are unaffected, so you can switch back anytime.">
          <Row label="Calendar">
            <div className="flex gap-1" role="radiogroup" aria-label="Calendar">
              {([["gregorian", "Gregorian"], ["jalali", "Shamsi · شمسی"]] as const).map(([v, l]) => (
                <Button key={v} size="sm" role="radio" aria-checked={s.calendar.system === v} variant={s.calendar.system === v ? "default" : "secondary"} className="flex-1" onClick={() => setImmediate({ calendar: { ...s.calendar, system: v } })}>{l}</Button>
              ))}
            </div>
          </Row>
          <Row label="Month & day names">
            <NativeSelect value={s.calendar.language} onChange={(e) => setImmediate({ calendar: { ...s.calendar, language: e.target.value as Settings["calendar"]["language"] } })} aria-label="Month and day names">
              <option value="en">English (Farvardin, Saturday…)</option>
              <option value="fa">فارسی (فروردین، شنبه…)</option>
            </NativeSelect>
          </Row>
          <Row label="Digits">
            <NativeSelect value={s.calendar.digits} onChange={(e) => setImmediate({ calendar: { ...s.calendar, digits: e.target.value as Settings["calendar"]["digits"] } })} aria-label="Digits">
              <option value="latin">0123456789</option>
              <option value="persian">۰۱۲۳۴۵۶۷۸۹</option>
            </NativeSelect>
          </Row>
          <Row label="Time format">
            <NativeSelect value={s.calendar.timeFormat} onChange={(e) => setImmediate({ calendar: { ...s.calendar, timeFormat: e.target.value as Settings["calendar"]["timeFormat"] } })} aria-label="Time format">
              <option value="24h">24-hour (18:30)</option>
              <option value="12h">12-hour (6:30pm)</option>
            </NativeSelect>
          </Row>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                setImmediate({
                  calendar: { system: "jalali", language: "fa", digits: "persian", timeFormat: "24h" },
                  weekStartsOn: 6,
                  workingDays: [6, 0, 1, 2, 3, 4],
                })
              }
            >
              Use Iranian defaults
            </Button>
            <span className="self-center text-xs text-muted-foreground">Shamsi, Persian names & digits, week starts Saturday, Friday off.</span>
          </div>
        </Section>

        <Section id="planning" title="Planning">
          <Row label="Working days" hint="Used for consistency and free-slot search."><WeekdayPicker value={s.workingDays} onChange={(v) => set("workingDays", v)} weekStartsOn={s.weekStartsOn} /></Row>
          <Row label="Default task duration"><DurationInput value={s.defaultDurationMinutes} onChange={(v) => set("defaultDurationMinutes", v)} presets={[30, 60, 90, 120]} /></Row>
          <Row label="Default break between blocks"><DurationInput value={s.defaultBreakMinutes} onChange={(v) => set("defaultBreakMinutes", v)} presets={[5, 10, 15, 30]} /></Row>
          <Row label="Daily target" hint="A sustainable amount of focused work."><DurationInput value={s.dailyTargetMinutes} onChange={(v) => set("dailyTargetMinutes", v)} presets={[240, 360, 480]} /></Row>
        </Section>

        <Section id="notifications" title="Notifications" description="Reminders run while the app is open in a tab.">
          <Row label="Enable notifications"><Switch checked={s.notifications.enabled} onCheckedChange={requestNotifications} aria-label="Enable notifications" /></Row>
          <fieldset disabled={!s.notifications.enabled} className={cn("space-y-3", !s.notifications.enabled && "opacity-50")}>
            <Row label="Upcoming task" hint={`${s.notifications.leadMinutes} minutes before`}>
              <div className="flex items-center gap-2">
                <Switch checked={s.notifications.upcoming} onCheckedChange={(v) => setN("upcoming", v)} aria-label="Upcoming task" />
                <Input type="number" min={0} max={120} className="h-8 w-20" value={s.notifications.leadMinutes} onChange={(e) => setN("leadMinutes", Math.max(0, Number(e.target.value) || 0))} aria-label="Minutes before" />
                <span className="text-xs text-muted-foreground">min</span>
              </div>
            </Row>
            <Row label="Task starting"><Switch checked={s.notifications.taskStart} onCheckedChange={(v) => setN("taskStart", v)} aria-label="Task starting" /></Row>
            <Row label="Still-open task" hint="Gentle nudge when a block's time has passed."><Switch checked={s.notifications.overdue} onCheckedChange={(v) => setN("overdue", v)} aria-label="Overdue" /></Row>
            <Row label="Daily planning">
              <div className="flex items-center gap-2">
                <Switch checked={s.notifications.dailyPlanning} onCheckedChange={(v) => setN("dailyPlanning", v)} aria-label="Daily planning" />
                <Input type="time" className="h-8" value={timeValue(s.notifications.dailyPlanningMinutes)} onChange={(e) => setN("dailyPlanningMinutes", parseTime(e.target.value) ?? 510)} aria-label="Daily planning time" />
              </div>
            </Row>
            <Row label="Daily review">
              <div className="flex items-center gap-2">
                <Switch checked={s.notifications.dailyReview} onCheckedChange={(v) => setN("dailyReview", v)} aria-label="Daily review" />
                <Input type="time" className="h-8" value={timeValue(s.notifications.dailyReviewMinutes)} onChange={(e) => setN("dailyReviewMinutes", parseTime(e.target.value) ?? 1260)} aria-label="Daily review time" />
              </div>
            </Row>
            <Row label="Weekly review" hint="On the last day of the week."><Switch checked={s.notifications.weeklyReview} onCheckedChange={(v) => setN("weeklyReview", v)} aria-label="Weekly review" /></Row>
          </fieldset>
          <Button size="sm" variant="secondary" onClick={() => (typeof Notification !== "undefined" && Notification.permission === "granted" ? new Notification("Personal OS", { body: "Notifications are working." }) : toast("Notifications are working (in-app)."))}>
            <Bell /> Send test
          </Button>
        </Section>

        <Section id="appearance" title="Appearance" description="Applied immediately.">
          <Row label="Theme">
            <div className="flex gap-1" role="radiogroup" aria-label="Theme">
              {(["dark", "light", "system"] as const).map((t) => (
                <Button key={t} size="sm" role="radio" aria-checked={s.theme === t} variant={s.theme === t ? "default" : "secondary"} className="flex-1 capitalize" onClick={() => setAppearance({ theme: t })}>{t}</Button>
              ))}
            </div>
          </Row>
          <Row label="Accent">
            <div className="flex gap-2" role="radiogroup" aria-label="Accent">
              {ACCENTS.map((a) => (
                <button key={a} type="button" role="radio" aria-checked={s.accent === a} aria-label={a} onClick={() => setAppearance({ accent: a })} className={cn("size-7 rounded-full ring-offset-2 ring-offset-card", s.accent === a && "ring-2 ring-foreground")} style={{ background: `var(--area-${a})` }} />
              ))}
            </div>
          </Row>
          <Row label="Density">
            <div className="flex gap-1" role="radiogroup" aria-label="Density">
              {(["comfortable", "compact"] as const).map((d) => (
                <Button key={d} size="sm" role="radio" aria-checked={s.density === d} variant={s.density === d ? "default" : "secondary"} className="flex-1 capitalize" onClick={() => setAppearance({ density: d })}>{d}</Button>
              ))}
            </div>
          </Row>
        </Section>

        <Section id="customize" title="Customize" description="Make the app yours. Changes apply immediately.">
          <CustomizeSection value={s.customization} onChange={(customization) => setImmediate({ customization })} />
        </Section>

        <Section id="tags" title="Tags" description="Rename, merge or delete tags across every task.">
          <TagsSection />
        </Section>

        <Section id="templates" title="Week templates" description="A typical week you can apply from the Week page. Applying adds editable blocks — it never locks your schedule.">
          <TemplatesSection />
        </Section>

        <Section id="data" title="Data">
          <DataSection />
        </Section>

        <Section id="shortcuts" title="Keyboard shortcuts">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {[
              [["⌘/Ctrl", "K"], "Command center & quick add"],
              [["N"], "New task"],
              [["G", "T"], "Go to Today (G + D/C/W/M/K/P/A/G/H/Y/R/S)"],
              [["←", "→"], "Previous / next (Calendar)"],
              [["D", "W", "M"], "Day / week / month (Calendar)"],
              [["Space"], "Pick up a focused block, arrows to move"],
            ].map(([keys, label]) => (
              <div key={label as string} className="flex items-center gap-2">
                <span className="flex gap-0.5">{(keys as string[]).map((k) => <Kbd key={k}>{k}</Kbd>)}</span>
                <span className="text-muted-foreground">{label as string}</span>
              </div>
            ))}
          </dl>
        </Section>
      </div>
    </>
  );
}

function DataSection() {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = React.useState(false);
  const [pendingImport, setPendingImport] = React.useState<unknown>(null);
  const exportData = useAction(
    async () => {
      const data = await getServices().data.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `personal-os-${data.exportedAt.slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return data.tasks.length;
    },
    { invalidate: [], success: (n) => `Exported ${n} tasks and all history` },
  );
  const importData = useAction((raw: unknown) => getServices().data.importAll(raw), {
    invalidate: ["all"],
    success: (r) => `Imported ${r.counts.tasks} tasks, ${r.counts.blocks} blocks, ${r.counts.timeEntries} time entries`,
    // Reload so every screen (and this form) starts from the imported data.
    onSuccess: () => setTimeout(() => window.location.reload(), 800),
  });
  const reset = useAction(() => getServices().data.reset(), { invalidate: ["all"], success: "All data deleted" });

  return (
    <>
      <Row label="Export JSON" hint="A complete backup of every entity.">
        <Button size="sm" variant="secondary" className="w-full" onClick={() => exportData.mutate()} disabled={exportData.isPending}><Download /> Export</Button>
      </Row>
      <Row label="Import JSON" hint="Replaces all current data after validation.">
        <>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              try {
                setPendingImport(JSON.parse(await file.text()));
              } catch {
                toast.error("That file isn't valid JSON.");
              }
            }}
          />
          <Button size="sm" variant="secondary" className="w-full" onClick={() => fileRef.current?.click()} disabled={importData.isPending}><Upload /> {importData.isPending ? "Importing…" : "Choose file"}</Button>
        </>
      </Row>
      <Row label="Reset data" hint="Deletes everything and restarts onboarding.">
        <Button size="sm" variant="destructive" className="w-full" onClick={() => setConfirmReset(true)}>Reset all data</Button>
      </Row>
      <ConfirmDialog open={confirmReset} onOpenChange={setConfirmReset} title="Delete all data?" description="Tasks, history, goals, habits, reviews and settings will be removed from this device. Export first if you may want them back." confirmLabel="Delete everything" destructive onConfirm={() => reset.mutate()} />
      <ConfirmDialog open={pendingImport !== null} onOpenChange={(o) => !o && setPendingImport(null)} title="Replace current data?" description="Importing replaces everything currently stored. The file is validated before anything is changed." confirmLabel="Import" onConfirm={() => { importData.mutate(pendingImport); setPendingImport(null); }} />
    </>
  );
}
