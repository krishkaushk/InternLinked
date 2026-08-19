// Filtering, cleaning, and canonicalization helpers shared by every source adapter and the
// dedup pass. Nothing here talks to the network.

// Word-boundary "intern", "internship" substring, and a tightened co-op regex that requires
// word boundaries on both ends so "cooperative"/"Coopers" don't false-positive (the original
// client-side version used bare .includes('coop') which did false-positive on those).
const COOP_RE = /\bco-?\s?ops?\b/;

export function isInternRole(title = ''): boolean {
  const t = (title || '').toLowerCase();
  return /\bintern\b/.test(t) || t.includes('internship') || COOP_RE.test(t);
}

const ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&nbsp;': ' ',
  '&#39;': "'",
  '&quot;': '"',
};

export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  let s = String(html).replace(/<[^>]*>/g, ' ');
  s = s.replace(/&amp;|&lt;|&gt;|&nbsp;|&#39;|&quot;/g, (m) => ENTITY_MAP[m] ?? m);
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

export function truncate(str: string | null | undefined, max: number): string {
  const s = str ?? '';
  return s.length > max ? s.slice(0, max) : s;
}

// Extracts <li>...</li> contents from an HTML fragment. Deliberately NOT `.split('<')` — that
// was a bug in the original client-side code (jobSearch.js) that produced raw HTML fragments
// instead of clean requirement strings. Shared by lever.ts and smartrecruiters.ts.
export function extractListItems(html: string): string[] {
  const items: string[] = [];
  const re = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const text = stripHtml(m[1]);
    if (text) items.push(text);
  }
  return items;
}

// Accepts a Date, epoch ms, epoch seconds, or an ISO/parseable date string. Returns an ISO
// string, or null for anything missing/invalid/out-of-range. NEVER default to "now" — a
// missing posted date must stay null so the pipeline doesn't fabricate freshness.
export function toIsoDate(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;

  let d: Date;
  if (value instanceof Date) {
    d = value;
  } else if (typeof value === 'number') {
    d = new Date(value > 1e12 ? value : value * 1000);
  } else if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) {
      const n = Number(trimmed);
      d = new Date(n > 1e12 ? n : n * 1000);
    } else {
      d = new Date(trimmed);
    }
  } else {
    return null;
  }

  if (Number.isNaN(d.getTime())) return null;

  const now = Date.now();
  const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  if (d.getTime() < now - TWO_YEARS_MS || d.getTime() > now + ONE_DAY_MS) return null;

  return d.toISOString();
}

const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'ref',
  'source',
  'gh_jid',
  'gh_src',
]);

// Lowercase host, force https, drop www., drop fragment, drop an allowlist of tracking params,
// keep everything else (some ATSs like Workday/iCIMS encode real job identity in the query
// string), sort remaining params, strip a trailing slash from the path.
export function canonicalUrl(url: string): string {
  try {
    const u = new URL(url);
    u.protocol = 'https:';
    const host = u.hostname.toLowerCase().replace(/^www\./, '');
    u.hostname = host;
    u.hash = '';

    if (u.pathname.length > 1 && u.pathname.endsWith('/')) {
      u.pathname = u.pathname.replace(/\/+$/, '');
    }

    const kept = Array.from(u.searchParams.entries()).filter(
      ([k]) => !TRACKING_PARAMS.has(k.toLowerCase())
    );
    kept.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    u.search = '';
    for (const [k, v] of kept) u.searchParams.append(k, v);

    return u.toString();
  } catch {
    return url;
  }
}

// Stable dedup key for known ATS URL shapes; falls back to a canonical-URL-based key for
// anything unrecognized.
export function atsIdentity(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase().replace(/^www\./, '');
    const path = u.pathname;

    if (host === 'boards.greenhouse.io' || host === 'job-boards.greenhouse.io') {
      const m = path.match(/^\/([^/]+)\/jobs\/([^/]+)\/?$/);
      if (m) return `gh:${m[1]}/${m[2]}`;
    }

    if (host === 'jobs.lever.co') {
      const p = path.replace(/\/apply\/?$/, '');
      const m = p.match(/^\/([^/]+)\/([^/]+)\/?$/);
      if (m) return `lv:${m[1]}/${m[2]}`;
    }

    if (host === 'jobs.ashbyhq.com') {
      const p = path.replace(/\/application\/?$/, '');
      const m = p.match(/^\/([^/]+)\/([^/]+)\/?$/);
      if (m) return `ab:${m[1]}/${m[2]}`;
    }

    if (host === 'jobs.smartrecruiters.com') {
      const m = path.match(/^\/([^/]+)\/([^/]+)/);
      if (m) return `sr:${m[1]}/${m[2]}`;
    }
  } catch {
    // fall through to the url-based fallback below
  }
  return `url:${canonicalUrl(url)}`;
}

const LEGAL_SUFFIX_RE = /\s+(inc|l l c|llc|ltd|corp|corporation|plc|gmbh|co)$/i;

// Lowercase, strip diacritics/punctuation, collapse whitespace, and strip ONLY unambiguous
// legal suffixes as whole trailing words. Deliberately does NOT strip "labs"/"ai"/"group"/
// "technologies" — real, distinct companies differ only by those words.
export function normalizeCompany(name: string | null | undefined): string {
  let s = (name ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '');
  s = s.toLowerCase();
  s = s.replace(/[^\w\s]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(LEGAL_SUFFIX_RE, '');
  return s.trim();
}

// Lowercase, strip season/year noise, parentheticals, and req/id-looking numeric tokens; fold
// co-op/internship spelling variants to a single canonical spelling so the same role posted
// with slightly different title text still collapses to one dedup key.
export function normalizeTitle(title: string | null | undefined): string {
  let s = (title ?? '').toLowerCase();
  s = s.replace(/\b(summer|fall|winter|spring)\s*20\d\d\b/g, ' ');
  s = s.replace(/\b20\d\d\b/g, ' ');
  s = s.replace(/\([^)]*\)/g, ' ');
  s = s.replace(/\b(req|job|id|jr|jd)[-\s#:]*\d{3,}\b/gi, ' ');
  s = s.replace(/\b\d{4,}\b/g, ' ');
  s = s.replace(/\bco[-\s]?op\b/g, 'coop');
  s = s.replace(/\binternship\b/g, 'intern');
  s = s.replace(/[^\w\s]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

// Takes the text before the first comma (e.g. "San Francisco, CA" -> "san francisco"); maps
// anything mentioning "remote" to the literal string 'remote'.
export function normalizeLocation(loc: string | null | undefined): string {
  const raw = (loc ?? '').split(',')[0].trim().toLowerCase();
  if (raw.includes('remote')) return 'remote';
  return raw;
}
