import { addDaysKey, toDateKey, weekRange, weekdayOf, type DateKey, type WeekdayIndex } from "@/lib/date";
import type { Area, Priority, Project, Recurrence } from "@/types/domain";

/**
 * Deterministic natural-language parser for Quick Add — no AI required.
 *
 *   "React 2h tomorrow"          → title React, 120m, tomorrow, area Frontend
 *   "Gym Thursday 18:00"         → title Gym, Thursday 18:00, area Health
 *   "Startup 3h Saturday #mvp"   → title Startup, 180m, Saturday, tag mvp
 *   "Weekly Review every sunday" → weekly recurrence on Sunday
 */
export interface ParsedQuickAdd {
  title: string;
  durationMinutes: number | null;
  date: DateKey | null;
  startMinutes: number | null;
  areaId: string | null;
  projectId: string | null;
  priority: Priority | null;
  tags: string[];
  recurrence: Omit<Recurrence, "startDate"> | null;
  /** Human-readable notes about assumptions the parser made. */
  ambiguities: string[];
}

export interface QuickAddContext {
  now: Date;
  weekStartsOn: WeekdayIndex;
  areas: readonly Pick<Area, "id" | "name" | "keywords">[];
  projects: readonly Pick<Project, "id" | "name" | "areaId">[];
}

const WEEKDAYS: Record<string, WeekdayIndex> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

const PRIORITY_WORDS: Record<string, Priority> = {
  low: "low",
  med: "medium",
  medium: "medium",
  high: "high",
  critical: "critical",
  urgent: "critical",
};

const FILLER = new Set(["on", "at", "for", "by", "next", "this", "every", "in"]);

function parseDuration(token: string): number | null {
  const t = token.toLowerCase();
  let m = /^(\d+(?:\.\d+)?)(?:h|hr|hrs|hour|hours)$/.exec(t);
  if (m) return Math.round(parseFloat(m[1]) * 60);
  m = /^(\d+)(?:m|min|mins|minutes?)$/.exec(t);
  if (m) return parseInt(m[1], 10);
  m = /^(\d+)h(\d{1,2})m?$/.exec(t);
  if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  return null;
}

function parseClock(token: string): { minutes: number; explicitMeridiem: boolean } | null {
  const t = token.toLowerCase();
  let m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (m) {
    const h = +m[1];
    const min = +m[2];
    if (h > 23 || min > 59) return null;
    return { minutes: h * 60 + min, explicitMeridiem: true };
  }
  m = /^(\d{1,2})(?::(\d{2}))?(am|pm)$/.exec(t);
  if (m) {
    let h = +m[1] % 12;
    if (m[3] === "pm") h += 12;
    const min = m[2] ? +m[2] : 0;
    if (h > 23 || min > 59) return null;
    return { minutes: h * 60 + min, explicitMeridiem: true };
  }
  return null;
}

function nextWeekday(today: DateKey, weekday: WeekdayIndex, forceNextWeek: boolean): DateKey {
  let diff = (weekday - weekdayOf(today) + 7) % 7;
  if (forceNextWeek && diff === 0) diff = 7;
  return addDaysKey(today, diff);
}

export function parseQuickAdd(input: string, ctx: QuickAddContext): ParsedQuickAdd {
  const today = toDateKey(ctx.now);
  const nowMinutes = ctx.now.getHours() * 60 + ctx.now.getMinutes();
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  const used = new Set<number>();
  const ambiguities: string[] = [];

  let duration: number | null = null;
  let date: DateKey | null = null;
  let start: number | null = null;
  let priority: Priority | null = null;
  const tags: string[] = [];
  let recurrence: ParsedQuickAdd["recurrence"] = null;
  let explicitArea: string | null = null;

  const lower = tokens.map((t) => t.toLowerCase().replace(/[,.;]$/, ""));

  for (let i = 0; i < tokens.length; i++) {
    const tok = lower[i];
    const prev = lower[i - 1];
    const next = lower[i + 1];

    if (tok.startsWith("#") && tok.length > 1) {
      tags.push(tok.slice(1));
      used.add(i);
      continue;
    }
    if (tok.startsWith("!") && tok.length > 1) {
      const p = PRIORITY_WORDS[tok.slice(1)] ?? (tok === "!!" ? "high" : tok === "!!!" ? "critical" : null);
      if (p) {
        priority = p;
        used.add(i);
        continue;
      }
    }
    if (tok.startsWith("@") && tok.length > 1) {
      explicitArea = tok.slice(1);
      used.add(i);
      continue;
    }

    const dur = parseDuration(tok);
    if (dur !== null && duration === null) {
      duration = dur;
      used.add(i);
      if (prev === "for") used.add(i - 1);
      continue;
    }

    const clock = parseClock(tok);
    if (clock && start === null) {
      start = clock.minutes;
      used.add(i);
      if (prev === "at") used.add(i - 1);
      continue;
    }
    // "at 6" — bare hour after "at"
    if (prev === "at" && /^\d{1,2}$/.test(tok) && start === null) {
      let h = +tok;
      if (h <= 23) {
        if (h >= 1 && h <= 7) {
          h += 12;
          ambiguities.push(`Assumed ${h}:00 for "at ${tok}".`);
        }
        start = h * 60;
        used.add(i).add(i - 1);
        continue;
      }
    }

    if (tok === "today" || tok === "tonight") {
      date = today;
      used.add(i);
      if (tok === "tonight" && start === null) start = 20 * 60;
      continue;
    }
    if (tok === "tomorrow" || tok === "tmr" || tok === "tmrw") {
      date = addDaysKey(today, 1);
      used.add(i);
      continue;
    }
    if (tok === "week" && prev === "next") {
      date = addDaysKey(weekRange(today, ctx.weekStartsOn).to, 1);
      used.add(i).add(i - 1);
      continue;
    }
    if (tok === "in" && next && /^\d+$/.test(next) && /^days?$/.test(lower[i + 2] ?? "")) {
      date = addDaysKey(today, +next);
      used.add(i).add(i + 1).add(i + 2);
      i += 2;
      continue;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(tok)) {
      date = tok;
      used.add(i);
      continue;
    }

    // Recurrence: "every day", "every monday", "every week", "every month", "daily" after every-less? (only "every …")
    if (tok === "every" && next) {
      if (next === "day" || next === "weekday" || next === "weekdays") {
        recurrence = {
          frequency: next === "day" ? "daily" : "weekly",
          interval: 1,
          weekdays: next === "day" ? [] : [1, 2, 3, 4, 5],
          dayOfMonth: null,
          endDate: null,
          startMinutes: null,
        };
        used.add(i).add(i + 1);
        i++;
        continue;
      }
      if (next === "week") {
        recurrence = { frequency: "weekly", interval: 1, weekdays: [], dayOfMonth: null, endDate: null, startMinutes: null };
        used.add(i).add(i + 1);
        i++;
        continue;
      }
      if (next === "month") {
        recurrence = { frequency: "monthly", interval: 1, weekdays: [], dayOfMonth: null, endDate: null, startMinutes: null };
        used.add(i).add(i + 1);
        i++;
        continue;
      }
      if (next in WEEKDAYS) {
        const days: number[] = [];
        let j = i + 1;
        while (j < lower.length && (lower[j] in WEEKDAYS || lower[j] === "and" || lower[j] === "+")) {
          if (lower[j] in WEEKDAYS) days.push(WEEKDAYS[lower[j]]);
          used.add(j);
          j++;
        }
        recurrence = { frequency: "weekly", interval: 1, weekdays: days, dayOfMonth: null, endDate: null, startMinutes: null };
        used.add(i);
        i = j - 1;
        continue;
      }
    }

    if (tok in WEEKDAYS) {
      const forceNext = prev === "next";
      const target = nextWeekday(today, WEEKDAYS[tok], forceNext);
      if (!forceNext && target === today) {
        ambiguities.push(`"${tokens[i]}" is today — scheduled for today, not next week.`);
      }
      date = target;
      used.add(i);
      if (prev === "on" || prev === "next" || prev === "this") used.add(i - 1);
      continue;
    }
  }

  // Weekday recurrence without explicit days e.g. "every week" → the chosen date's weekday.
  if (recurrence && recurrence.frequency === "weekly" && recurrence.weekdays.length === 0 && date) {
    recurrence.weekdays = [weekdayOf(date)];
  }
  if (recurrence) recurrence.startMinutes = start;

  if (start !== null && date === null && !recurrence) {
    if (start <= nowMinutes) {
      date = addDaysKey(today, 1);
      ambiguities.push("That time has passed today — scheduled for tomorrow.");
    } else {
      date = today;
    }
  }

  const titleTokens = tokens.filter((_, i) => !used.has(i));
  // Drop dangling filler words at the end ("Gym on" → "Gym").
  while (titleTokens.length && FILLER.has(titleTokens[titleTokens.length - 1].toLowerCase())) titleTokens.pop();
  const title = titleTokens.join(" ").trim();
  if (!title) ambiguities.push("No title detected.");

  // ---- area & project resolution
  let areaId: string | null = null;
  let projectId: string | null = null;
  const text = ` ${input.toLowerCase()} `;

  const project = [...ctx.projects]
    .sort((a, b) => b.name.length - a.name.length)
    .find((p) => text.includes(` ${p.name.toLowerCase()} `) || text.includes(` ${p.name.toLowerCase()}`));
  if (project) {
    projectId = project.id;
    areaId = project.areaId;
  }

  if (explicitArea) {
    const match = ctx.areas.find((a) => a.name.toLowerCase().replace(/\s+/g, "").startsWith(explicitArea!));
    if (match) areaId = match.id;
    else ambiguities.push(`No area matches "@${explicitArea}".`);
  } else if (!areaId) {
    const words = new Set(title.toLowerCase().split(/[^a-z0-9+#.]+/).filter(Boolean));
    const matches = ctx.areas.filter((a) => {
      const keys = [...a.keywords.map((k) => k.toLowerCase()), ...a.name.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2)];
      return keys.some((k) => words.has(k) || (k.includes(" ") && title.toLowerCase().includes(k)));
    });
    if (matches.length === 1) areaId = matches[0].id;
    else if (matches.length > 1) {
      areaId = matches[0].id;
      ambiguities.push(`Matches several areas (${matches.map((m) => m.name).join(", ")}) — picked ${matches[0].name}.`);
    }
  }

  return {
    title,
    durationMinutes: duration,
    date,
    startMinutes: start,
    areaId,
    projectId,
    priority,
    tags,
    recurrence,
    ambiguities,
  };
}
