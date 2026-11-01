import { normalizeWithMap, terms as toTerms } from "@/lib/text/normalize";
import type { EntityType } from "@/types/domain";

export interface SearchSource {
  type: EntityType;
  id: string;
  title: string;
  body: string;
  href: string;
  tags: string[];
  areaId: string | null;
  /** ISO date-time of last change, used for ranking ties and date filters. */
  updatedAt: string;
  subtitle?: string;
}

export interface SearchDoc extends SearchSource {
  nTitle: string;
  nBody: string;
  bodyMap: number[];
}

export interface Snippet {
  before: string;
  match: string;
  after: string;
}

export interface SearchHit {
  doc: SearchSource;
  score: number;
  snippet: Snippet | null;
}

export interface SearchFilters {
  types?: EntityType[];
  areaId?: string | null;
  tag?: string | null;
  /** Only items changed on or after this ISO date. */
  since?: string | null;
}

export function buildIndex(sources: SearchSource[]): SearchDoc[] {
  return sources.map((s) => {
    const body = normalizeWithMap(s.body);
    return { ...s, nTitle: normalizeWithMap(s.title).text, nBody: body.text, bodyMap: body.map };
  });
}

function snippetFor(doc: SearchDoc, term: string, radius = 60): Snippet | null {
  const at = doc.nBody.indexOf(term);
  if (at < 0) return null;
  const start = doc.bodyMap[at];
  const end = doc.bodyMap[at + term.length - 1] + 1;
  let from = Math.max(0, start - radius);
  let to = Math.min(doc.body.length, end + radius);
  // Prefer whole words at the edges.
  const sp = doc.body.lastIndexOf(" ", start - radius / 2);
  if (from > 0 && sp > from) from = sp + 1;
  const ep = doc.body.indexOf(" ", end + radius / 2);
  if (ep > 0 && ep < to) to = ep;
  return {
    before: (from > 0 ? "…" : "") + doc.body.slice(from, start).replace(/\s+/g, " "),
    match: doc.body.slice(start, end),
    after: doc.body.slice(end, to).replace(/\s+/g, " ") + (to < doc.body.length ? "…" : ""),
  };
}

/**
 * All terms must match (title or body). `#tag` terms filter by tag.
 * Ranking: exact/prefix title matches first, then title, then body; recency breaks ties.
 */
export function search(index: readonly SearchDoc[], query: string, filters: SearchFilters = {}, limit = 50): SearchHit[] {
  const raw = query.trim().split(/\s+/).filter(Boolean);
  const tagTerms = raw.filter((t) => t.startsWith("#") && t.length > 1).map((t) => toTerms(t.slice(1)).join(""));
  const words = toTerms(raw.filter((t) => !(t.startsWith("#") && t.length > 1)).join(" "));
  const tag = filters.tag ? toTerms(filters.tag).join("") : null;
  if (!words.length && !tagTerms.length && !tag) return [];

  const hits: SearchHit[] = [];
  for (const doc of index) {
    if (filters.types?.length && !filters.types.includes(doc.type)) continue;
    if (filters.areaId && doc.areaId !== filters.areaId) continue;
    if (filters.since && doc.updatedAt < filters.since) continue;
    const docTags = doc.tags.map((t) => toTerms(t).join(""));
    if (tag && !docTags.includes(tag)) continue;
    if (tagTerms.some((t) => !docTags.includes(t))) continue;

    let score = 0;
    let ok = true;
    for (const w of words) {
      const ti = doc.nTitle.indexOf(w);
      if (ti === 0) score += doc.nTitle === w ? 120 : 60;
      else if (ti > 0) score += 30;
      else if (doc.nBody.includes(w)) score += 5;
      else {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    if (!words.length) score = 1;
    const bodyTerm = words.find((w) => !doc.nTitle.includes(w)) ?? words[0];
    hits.push({ doc, score, snippet: bodyTerm ? snippetFor(doc, bodyTerm) : null });
  }
  hits.sort((a, b) => b.score - a.score || b.doc.updatedAt.localeCompare(a.doc.updatedAt));
  return hits.slice(0, limit).map((h) => ({ ...h, doc: stripIndex(h.doc as SearchDoc) }));
}

function stripIndex(d: SearchDoc): SearchSource {
  const { nTitle: _t, nBody: _b, bodyMap: _m, ...rest } = d;
  void _t;
  void _b;
  void _m;
  return rest;
}

/** Splits text into [plain, highlighted, plain, …] parts for every term match (for titles). */
export function highlight(text: string, query: string): { text: string; hit: boolean }[] {
  const words = toTerms(query.replace(/(^|\s)#\S+/g, " "));
  if (!words.length) return [{ text, hit: false }];
  const { text: n, map } = normalizeWithMap(text);
  const marks = new Array<boolean>(text.length).fill(false);
  for (const w of words) {
    let at = n.indexOf(w);
    while (at >= 0) {
      for (let i = map[at]; i <= map[at + w.length - 1]; i++) marks[i] = true;
      at = n.indexOf(w, at + w.length);
    }
  }
  const parts: { text: string; hit: boolean }[] = [];
  for (let i = 0; i < text.length; i++) {
    const last = parts.at(-1);
    if (last && last.hit === marks[i]) last.text += text[i];
    else parts.push({ text: text[i], hit: marks[i] });
  }
  return parts;
}
