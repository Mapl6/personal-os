"use client";

import { ArrowRight, Check, CircleDashed, Search } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Logo } from "@/components/shared/logo";
import { SectionTitle } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  FINAL_STAGE,
  isBuiltAt,
  LIFE_MODULES,
  ROADMAP_DOMAINS,
  ROADMAP_STAGES,
  summarizeStage,
  type RoadmapDomain,
  type RoadmapFeature,
} from "@/lib/roadmap/catalogue";
import { cn } from "@/lib/utils/cn";
import { APP_SECTIONS, SECTION_GROUPS } from "./sections";

const DOMAIN_COLOR: Record<RoadmapDomain, string> = {
  Knowledge: "var(--area-sky)",
  Databases: "var(--area-teal)",
  Planning: "var(--area-amber)",
  "Life modules": "var(--area-emerald)",
  Capture: "var(--area-rose)",
  AI: "var(--area-violet)",
  Platform: "var(--area-slate)",
};
const DOMAINS = ROADMAP_DOMAINS.map((d) => d.name);
const MODULES = Object.values(LIFE_MODULES);
type PriorityFilter = "all" | "p0" | "p01";

const pct = (n: number, total: number) => `${total ? (100 * n) / total : 0}%`;
const stageName = (stage: number) => (stage === 0 ? "today" : stage === FINAL_STAGE ? "complete" : `end of Phase ${stage}`);
const STAGE_HASHES = ["today", "phase-1", "phase-2", "phase-3", "phase-4", "phase-5"];

function stageFromHash(): number | null {
  const index = STAGE_HASHES.indexOf(window.location.hash.replace(/^#/, ""));
  return index >= 0 ? index : null;
}

export function RoadmapView({ features }: { features: RoadmapFeature[] }) {
  const [stage, setStage] = React.useState(FINAL_STAGE);

  // Read the deep-link hash after hydration. Reading it during the first
  // render would make the client markup differ from the pre-rendered
  // server markup (hydration error on /roadmap#phase-2).
  React.useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time post-hydration hash read; window is unavailable during SSR */
    const fromHash = stageFromHash();
    if (fromHash !== null) {
      setStage(fromHash);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-time read on mount
  }, []);

  // Reflect the picked stage in the URL hash without adding history
  // entries. Skipped on mount so a plain /roadmap keeps its clean URL.
  const isFirstRender = React.useRef(true);
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const hash = `#${STAGE_HASHES[stage]}`;
    if (window.location.hash !== hash) {
      window.history.replaceState(null, "", hash);
    }
  }, [stage]);

  const [includeP2, setIncludeP2] = React.useState(true);
  const [selected, setSelected] = React.useState<RoadmapFeature | null>(null);
  const built = React.useCallback((f: RoadmapFeature) => isBuiltAt(f, stage, includeP2), [stage, includeP2]);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
          <Link href="/roadmap" className="flex items-center gap-2 text-sm font-semibold">
            <Logo className="size-6" />
            Personal OS
            <span className="font-normal text-muted-foreground">/ Roadmap</span>
          </Link>
          <Button asChild size="sm" variant="ghost">
            <Link href="/">
              Open the app <ArrowRight />
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-8">
        <section className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">From planner to second brain</h1>
          <p className="max-w-[68ch] text-sm text-muted-foreground">
            Every planned feature of Personal OS, phase by phase. Pick a phase to see what the app will have by then, compared with what it has
            today. Select any feature for its details.
          </p>
        </section>

        <section aria-labelledby="stage-label" className="space-y-3">
          <SectionTitle>
            <span id="stage-label">Show the app at</span>
          </SectionTitle>
          <StageStepper stage={stage} onChange={setStage} counts={ROADMAP_STAGES.map((_, i) => features.filter((f) => isBuiltAt(f, i, includeP2)).length)} />
          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <Switch checked={includeP2} onCheckedChange={setIncludeP2} aria-label="Count nice-to-have (P2) features as built in their phase" />
            Count nice-to-have (P2) features as built in their phase
          </label>
        </section>

        <Summary features={features} stage={stage} includeP2={includeP2} />
        <SectionsCompare stage={stage} />
        <AreaCoverage features={features} stage={stage} built={built} />
        <Modules features={features} built={built} />
        <FeatureBoard features={features} stage={stage} built={built} onSelect={setSelected} />

        <footer className="max-w-[80ch] border-t border-border pt-4 text-xs text-muted-foreground">
          Built from the feature catalogue in <code>docs/features</code> and the phases in <code>docs/ROADMAP.md</code>. The current planner is
          listed as a few broad rows, so &ldquo;built today&rdquo; undercounts what the app already does.
        </footer>
      </main>

      <FeatureDialog feature={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function StageStepper({ stage, onChange, counts }: { stage: number; onChange: (s: number) => void; counts: number[] }) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const move = (next: number) => {
    const s = Math.max(0, Math.min(FINAL_STAGE, next));
    onChange(s);
    refs.current[s]?.focus();
  };
  return (
    <div role="radiogroup" aria-labelledby="stage-label" className="grid grid-cols-3 overflow-hidden rounded-xl border border-border bg-card md:grid-cols-6">
      {ROADMAP_STAGES.map((s, i) => {
        const active = i === stage;
        return (
          <button
            key={s.label}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(i)}
            onKeyDown={(e) => {
              const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
              if (!step) return;
              e.preventDefault();
              move(i + step);
            }}
            className={cn(
              "grid min-w-0 gap-0.5 border-border px-3 py-2.5 text-start transition-colors [&:not(:first-child)]:border-s max-md:[&:nth-child(4)]:border-s-0 max-md:[&:nth-child(n+4)]:border-t",
              active ? "bg-primary text-primary-foreground" : i < stage ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-accent",
            )}
          >
            <span className={cn("text-[11px] font-medium uppercase tracking-wider", active ? "opacity-80" : "text-muted-foreground")}>{s.label}</span>
            <span className="text-sm font-semibold leading-tight">{s.title}</span>
            <span className={cn("truncate text-xs tabular", active ? "opacity-80" : "text-muted-foreground")}>
              {counts[i]} features
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Summary({ features, stage, includeP2 }: { features: RoadmapFeature[]; stage: number; includeP2: boolean }) {
  const s = summarizeStage(features, stage, includeP2);
  const partlyLeft = features.filter((f) => f.status === "partial" && !isBuiltAt(f, stage, includeP2)).length;
  const added = s.builtAtStage - s.builtToday;
  const stats: [number, string][] = [
    [s.builtToday, "built today"],
    stage === 0 ? [s.partlyBuiltToday, "partly built today"] : [added, `added by ${stageName(stage)}`],
    [s.total - s.builtAtStage, "still to build"],
  ];
  return (
    <section aria-live="polite" className="grid items-end gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {stage === 0 ? "Features built today" : `Features built at ${stageName(stage)}`}
        </p>
        <p className="mt-1 text-5xl font-semibold tracking-tight tabular">
          {s.builtAtStage}
          <span className="ms-2 text-lg font-medium text-muted-foreground">of {s.total}</span>
        </p>
      </div>
      <div className="space-y-3">
        <div className="flex h-3 overflow-hidden rounded-full bg-muted" aria-hidden>
          <span className="bg-foreground transition-[width] duration-300" style={{ width: pct(s.builtToday, s.total) }} />
          <span className="bg-[repeating-linear-gradient(135deg,var(--muted-foreground)_0_3px,transparent_3px_6px)] transition-[width] duration-300" style={{ width: pct(partlyLeft, s.total) }} />
          <span className="bg-primary transition-[width] duration-300" style={{ width: pct(added, s.total) }} />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <LegendSwatch className="bg-foreground" label="Built today" />
          <LegendSwatch className="bg-[repeating-linear-gradient(135deg,var(--muted-foreground)_0_2px,transparent_2px_4px)]" label="Partly built today" />
          <LegendSwatch className="bg-primary" label="Added by this phase" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {stats.map(([n, label]) => (
            <div key={label}>
              <div className="text-xl font-semibold tabular">{n}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2.5 rounded-sm", className)} />
      {label}
    </span>
  );
}

function SectionsCompare({ stage }: { stage: number }) {
  return (
    <section className="space-y-3">
      <SectionTitle>The app today vs {stage === FINAL_STAGE ? "complete" : stage === 0 ? "today" : `Phase ${stage}`}</SectionTitle>
      <p className="-mt-1 text-sm text-muted-foreground">The app&rsquo;s sections, as they would appear in its sidebar.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <SectionsFrame title="Today" stage={0} />
        <SectionsFrame title={stage === 0 ? "Today" : stage === FINAL_STAGE ? "Complete" : `End of Phase ${stage}`} stage={stage} markNew />
      </div>
    </section>
  );
}

function SectionsFrame({ title, stage, markNew }: { title: string; stage: number; markNew?: boolean }) {
  const sections = APP_SECTIONS.filter((s) => s.phase <= stage);
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-surface px-4 py-2.5">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs text-muted-foreground tabular">{sections.length} sections</span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-4 gap-y-3 p-4">
        {SECTION_GROUPS.map((group) => {
          const items = sections.filter((s) => s.group === group);
          return (
            <div key={group} className="space-y-0.5">
              <h3 className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{group}</h3>
              {items.length === 0 && <p className="px-1.5 text-sm italic text-muted-foreground">Not yet</p>}
              {items.map((s) => (
                <div key={s.label} className={cn("flex items-center gap-2 rounded-md px-1.5 py-0.5 text-sm", markNew && s.phase > 0 && "bg-primary/10")}>
                  <span className="size-2 shrink-0 rounded-sm" style={{ background: DOMAIN_COLOR[s.domain] }} />
                  <span className="min-w-0 truncate">{s.label}</span>
                  {markNew && s.phase > 0 && <span className="ms-auto text-[10px] font-medium text-primary">new</span>}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function AreaCoverage({ features, stage, built }: { features: RoadmapFeature[]; stage: number; built: (f: RoadmapFeature) => boolean }) {
  return (
    <section className="space-y-3">
      <SectionTitle>Coverage by area</SectionTitle>
      <p className="-mt-1 text-sm text-muted-foreground">Each bar is every feature in that area. Top: today. Bottom: {stageName(stage)}.</p>
      <div className="space-y-3">
        {DOMAINS.map((domain) => {
          const fs = features.filter((f) => f.domain === domain);
          const now = fs.filter((f) => f.status === "shipped").length;
          const partly = fs.filter((f) => f.status === "partial").length;
          const then = fs.filter(built).length;
          return (
            <div key={domain} className="grid items-center gap-x-4 gap-y-1.5 max-sm:grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[9rem_minmax(0,1fr)_7rem]">
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className="size-2.5 rounded-sm" style={{ background: DOMAIN_COLOR[domain] }} />
                {domain}
              </span>
              <div className="space-y-1 max-sm:col-span-2 max-sm:row-start-2" aria-hidden>
                <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                  <span className="bg-foreground" style={{ width: pct(now, fs.length) }} />
                  <span className="bg-[repeating-linear-gradient(135deg,var(--muted-foreground)_0_3px,transparent_3px_6px)]" style={{ width: pct(partly, fs.length) }} />
                </div>
                <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                  <span className="transition-[width] duration-300" style={{ width: pct(then, fs.length), background: DOMAIN_COLOR[domain] }} />
                </div>
              </div>
              <span className="text-end text-xs text-muted-foreground tabular">
                {now} + {partly} partly → <span className="font-medium text-foreground">{then}</span> / {fs.length}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Modules({ features, built }: { features: RoadmapFeature[]; built: (f: RoadmapFeature) => boolean }) {
  return (
    <section className="space-y-3">
      <SectionTitle>Life modules</SectionTitle>
      <p className="-mt-1 text-sm text-muted-foreground">
        Each module can be turned on or off in Settings → Features. Dashed modules aren&rsquo;t built yet at the selected phase.
      </p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
        {MODULES.map((m) => {
          const fs = features.filter((f) => f.domain === "Life modules" && f.group === m);
          if (!fs.length) return null;
          const done = fs.filter(built).length;
          return (
            <div key={m} className={cn("space-y-1.5 rounded-lg border px-3 py-2.5", done ? "border-border bg-card" : "border-dashed border-border opacity-60")}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium">{m}</span>
                <span className="text-[11px] text-muted-foreground">Phase {Math.min(...fs.map((f) => f.phase))}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-[var(--area-emerald)] transition-[width] duration-300" style={{ width: pct(done, fs.length) }} />
              </div>
              <div className="text-xs text-muted-foreground tabular">
                {done} of {fs.length} features
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FeatureBoard({
  features,
  stage,
  built,
  onSelect,
}: {
  features: RoadmapFeature[];
  stage: number;
  built: (f: RoadmapFeature) => boolean;
  onSelect: (f: RoadmapFeature) => void;
}) {
  const [domains, setDomains] = React.useState<Set<RoadmapDomain>>(() => new Set(DOMAINS));
  const [priority, setPriority] = React.useState<PriorityFilter>("all");
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const matches = (f: RoadmapFeature) =>
    domains.has(f.domain) &&
    (priority === "all" || (priority === "p0" ? f.priority === "P0" : f.priority !== "P2")) &&
    (!q || `${f.id} ${f.name} ${f.details} ${f.group}`.toLowerCase().includes(q));
  const toggleDomain = (d: RoadmapDomain) =>
    setDomains((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next.size ? next : new Set(DOMAINS);
    });

  return (
    <section className="space-y-3">
      <SectionTitle>Every feature, by phase</SectionTitle>
      <p className="-mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <span>Faded features aren&rsquo;t built yet at the selected phase.</span>
        <span className="inline-flex items-center gap-1">
          <Check className="size-3.5 text-success" /> built today
        </span>
        <span className="inline-flex items-center gap-1">
          <CircleDashed className="size-3.5" /> partly built today
        </span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {DOMAINS.map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={domains.has(d)}
            onClick={() => toggleDomain(d)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs transition-colors",
              domains.has(d) ? "bg-card" : "bg-transparent text-muted-foreground opacity-60",
            )}
          >
            <span className="size-2 rounded-sm" style={{ background: DOMAIN_COLOR[d] }} />
            {d}
          </button>
        ))}
        <Select value={priority} onValueChange={(v) => setPriority(v as PriorityFilter)}>
          <SelectTrigger className="h-8 w-36 text-xs" aria-label="Priority">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="p0">P0 only</SelectItem>
            <SelectItem value="p01">P0 and P1</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative min-w-0 flex-1 basis-52 sm:max-w-xs">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search, e.g. calorie, Shamsi, sync" aria-label="Search features" className="h-8 ps-8 text-xs" />
        </div>
      </div>

      <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ROADMAP_STAGES.map((s, phase) => {
          const fs = features.filter((f) => f.phase === phase && matches(f));
          return (
            <Card key={s.label} className="min-w-0">
              <div className="flex items-baseline justify-between gap-2 border-b border-border px-4 py-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{phase === 0 ? "Shipped" : s.label}</div>
                  <h3 className={cn("text-sm font-semibold", phase > stage && "text-muted-foreground")}>{s.title}</h3>
                </div>
                <span className="text-xs text-muted-foreground tabular">{fs.length}</span>
              </div>
              <div className="space-y-3 p-2.5">
                {fs.length === 0 && <p className="px-1.5 py-2 text-sm text-muted-foreground">No features match the filters.</p>}
                {DOMAINS.map((d) => {
                  const items = fs.filter((f) => f.domain === d);
                  if (!items.length) return null;
                  return (
                    <div key={d}>
                      <div className="flex items-center gap-1.5 px-1.5 pb-1 text-[11px] font-medium uppercase tracking-wider" style={{ color: DOMAIN_COLOR[d] }}>
                        <span className="size-2 rounded-sm" style={{ background: DOMAIN_COLOR[d] }} />
                        {d} · {items.length}
                      </div>
                      {items.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => onSelect(f)}
                          className={cn(
                            "grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-2 rounded-md px-1.5 py-1 text-start text-[13px] leading-snug transition-[opacity,background-color] hover:bg-accent",
                            !built(f) && "opacity-35",
                          )}
                        >
                          <span className="font-mono text-[10.5px] text-muted-foreground">{f.id}</span>
                          <span>{f.name}</span>
                          <StatusMark feature={f} />
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function StatusMark({ feature }: { feature: RoadmapFeature }) {
  if (feature.status === "shipped") return <Check className="size-3.5 self-center text-success" aria-label="Built today" />;
  if (feature.status === "partial") return <CircleDashed className="size-3.5 self-center text-muted-foreground" aria-label="Partly built today" />;
  if (feature.priority === "P2") return <span className="font-mono text-[10px] text-muted-foreground">P2</span>;
  return <span />;
}

function FeatureDialog({ feature, onClose }: { feature: RoadmapFeature | null; onClose: () => void }) {
  const status = feature?.status === "shipped" ? "Built today" : feature?.status === "partial" ? "Partly built today" : "Planned";
  return (
    <Dialog open={feature !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {feature && (
          <>
            <DialogHeader>
              <p className="font-mono text-xs text-muted-foreground">
                {feature.id} · {feature.domain} · {feature.group}
              </p>
              <DialogTitle>{feature.name}</DialogTitle>
              <DialogDescription>{feature.details || "Part of the planner that ships today."}</DialogDescription>
            </DialogHeader>
            <DialogBody>
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Phase</dt>
                <dd>{feature.phase === 0 ? "Shipped" : `${ROADMAP_STAGES[feature.phase].label} · ${ROADMAP_STAGES[feature.phase].title}`}</dd>
                <dt className="text-muted-foreground">Priority</dt>
                <dd>
                  <Badge variant={feature.priority === "P0" ? "primary" : "outline"}>{feature.priority}</Badge>
                </dd>
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  {status}
                  {feature.note && <span className="text-muted-foreground"> · {feature.note}</span>}
                </dd>
              </dl>
            </DialogBody>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
