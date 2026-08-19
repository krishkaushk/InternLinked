import { NormalizedJob, SourceResult } from '../types.ts';
import { GithubCuratedRepoConfig } from './companies.ts';
import { fetchJson } from '../lib/http.ts';
import { toIsoDate } from '../lib/normalize.ts';

const STALE_THRESHOLD_DAYS = 60;

interface CuratedRecord {
  id?: string | number;
  active?: boolean;
  is_visible?: boolean;
  title?: unknown;
  company_name?: unknown;
  url?: unknown;
  locations?: string[];
  terms?: string[];
  season?: string; // schema drift: some repos (e.g. vanshb03) use this instead of `terms`
  date_posted?: unknown;
  date_updated?: unknown;
}

const HTTP_URL_RE = /^https?:\/\//i;

// `date_posted`/`date_updated` are real Unix epochs, but inconsistently seconds vs ms across
// records — detect via magnitude rather than trusting a fixed unit.
function epochToMs(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) {
    return v > 1e12 ? v : v * 1000;
  }
  if (typeof v === 'string' && /^\d+$/.test(v.trim())) {
    const n = Number(v.trim());
    return n > 1e12 ? n : n * 1000;
  }
  return null;
}

export async function fetchGithubCuratedRepo(config: GithubCuratedRepoConfig): Promise<SourceResult> {
  const url = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${config.path}`;
  const data = await fetchJson(url);

  if (data === null) {
    return { jobs: [], stat: 'error' };
  }
  if (!Array.isArray(data)) {
    console.warn(`[fetch-jobs] github curated repo ${config.key} did not return an array`);
    return { jobs: [], stat: 'error' };
  }

  const active = (data as CuratedRecord[]).filter(
    (r) => r.active === true && r.is_visible !== false
  );

  const jobs: NormalizedJob[] = [];
  for (const r of active) {
    const title = r.title;
    const companyName = r.company_name;
    const jobUrl = r.url;

    if (
      typeof title !== 'string' || !title ||
      typeof companyName !== 'string' || !companyName ||
      typeof jobUrl !== 'string' || !jobUrl || !HTTP_URL_RE.test(jobUrl)
    ) {
      continue; // skip malformed record, never throw
    }

    const postedMs = epochToMs(r.date_posted) ?? epochToMs(r.date_updated);
    const postedDate = postedMs !== null ? toIsoDate(postedMs) : null;

    jobs.push({
      id: `gh-cur-${config.key}-${r.id ?? crypto.randomUUID()}`,
      companyName,
      title,
      location: (r.locations ?? []).slice(0, 2).join(' / ') || 'Remote',
      type: 'internship',
      postedDate,
      description: '',
      requirements: [],
      jobUrl,
      source: `github:${config.key}`,
      saved: false,
      salary: null,
      _sources: [`github:${config.key}`],
    });
  }

  if (jobs.length === 0) {
    return { jobs: [], stat: 'error' };
  }

  const newest = jobs.reduce<number | null>((max, j) => {
    if (!j.postedDate) return max;
    const t = new Date(j.postedDate).getTime();
    return max === null || t > max ? t : max;
  }, null);

  if (newest !== null) {
    const ageDays = (Date.now() - newest) / (24 * 60 * 60 * 1000);
    if (ageDays > STALE_THRESHOLD_DAYS) {
      console.warn(
        `[fetch-jobs] stale_source: ${config.key} — newest active record is over ${STALE_THRESHOLD_DAYS} days old`
      );
      return { jobs, stat: 'stale' };
    }
  }

  return { jobs, stat: 'ok' };
}
