// Wire-compatible job shape — must match what the client (JobCard.jsx / JobMatches.jsx /
// llmScore.js) already reads. Do not rename fields without updating the client in lockstep.
export interface NormalizedJob {
  id: string;
  companyName: string;
  title: string;
  location: string;
  type: 'internship';
  postedDate: string | null; // ISO 8601, or null — NEVER default to "now" on a missing date
  description: string; // plain text, HTML stripped, truncated to 2000 chars
  requirements: string[];
  jobUrl: string;
  source: string;
  saved: false;
  salary: string | null;
  _sources: string[]; // dedup provenance, e.g. ['greenhouse', 'github:simplify']
}

// Per-source/per-company outcome recorded for observability, stored in job_listings_cache.source_stats.
export type SourceStat =
  | 'ok'
  | 'http_404'
  | 'zero_intern'
  | 'zero_total'
  | 'timeout'
  | 'stale'
  | 'error';

export interface SourceResult {
  jobs: NormalizedJob[];
  stat: SourceStat;
}

// sourceStats keyed by source/company identifier, e.g. { greenhouse_stripe: 'ok', 'github:simplify': 'ok' }
export type SourceStats = Record<string, SourceStat>;
