// Cross-source dedup. Two passes:
//   1. Group by a recognized-ATS identity key (or a canonical-URL fallback key) when the URL
//      shape is recognizable — this catches the same posting mirrored across multiple curated
//      GitHub lists, or a GitHub-curated entry that duplicates a listing we also pulled directly
//      from the ATS.
//   2. Within whatever's left ungrouped by URL, group by company+title+location — location stays
//      in the key because companies legitimately post near-identical titles across many distinct
//      real locations, and collapsing those would silently drop real postings.
import { NormalizedJob } from '../types.ts';
import { atsIdentity, canonicalUrl, normalizeCompany, normalizeLocation, normalizeTitle } from './normalize.ts';

// Higher index = more authoritative. Direct-from-ATS sources win over curated GitHub lists,
// and among ATSs, Greenhouse > Lever > Ashby > SmartRecruiters (arbitrary but stable tie-break).
const SOURCE_AUTHORITY: string[] = [
  'github:vansh',
  'github:simplify',
  'smartrecruiters',
  'ashby',
  'lever',
  'greenhouse',
];

function authorityRank(source: string): number {
  const idx = SOURCE_AUTHORITY.indexOf(source);
  return idx === -1 ? -1 : idx;
}

function pickWinner(group: NormalizedJob[]): NormalizedJob {
  let winner = group[0];
  for (const job of group.slice(1)) {
    if (authorityRank(job.source) > authorityRank(winner.source)) {
      winner = job;
    }
  }
  return winner;
}

function mergeGroup(group: NormalizedJob[]): NormalizedJob {
  const winner = pickWinner(group);
  const merged: NormalizedJob = { ...winner };

  if (!merged.description) {
    const withDesc = group.find((j) => j.description && j.description.trim().length > 0);
    if (withDesc) merged.description = withDesc.description;
  }
  if (merged.salary === null || merged.salary === undefined) {
    const withSalary = group.find((j) => j.salary);
    if (withSalary) merged.salary = withSalary.salary;
  }
  if (!merged.requirements || merged.requirements.length === 0) {
    const withReqs = group.find((j) => j.requirements && j.requirements.length > 0);
    if (withReqs) merged.requirements = withReqs.requirements;
  }

  const sources = new Set<string>();
  for (const j of group) {
    if (j._sources && j._sources.length > 0) {
      for (const s of j._sources) sources.add(s);
    } else {
      sources.add(j.source);
    }
  }
  merged._sources = Array.from(sources);

  return merged;
}

function urlGroupKey(job: NormalizedJob): string {
  if (!job.jobUrl) return `url:${job.id}`; // no URL at all — can't collide with anything real
  try {
    return atsIdentity(job.jobUrl);
  } catch {
    return `url:${canonicalUrl(job.jobUrl)}`;
  }
}

function fieldGroupKey(job: NormalizedJob): string {
  return `${normalizeCompany(job.companyName)}|${normalizeTitle(job.title)}|${normalizeLocation(job.location)}`;
}

export function dedupeJobs(jobs: NormalizedJob[]): NormalizedJob[] {
  // Pass 1: group by URL identity (atsIdentity already falls back to a canonical-URL key for
  // unrecognized shapes). Groups with more than one member are real URL-level duplicates and
  // get merged now; singleton groups had no URL match, so they get one more chance below.
  const byUrlKey = new Map<string, NormalizedJob[]>();
  for (const job of jobs) {
    const key = urlGroupKey(job);
    const group = byUrlKey.get(key);
    if (group) group.push(job);
    else byUrlKey.set(key, [job]);
  }

  const merged: NormalizedJob[] = [];
  const unmatched: NormalizedJob[] = [];
  for (const group of byUrlKey.values()) {
    if (group.length > 1) merged.push(mergeGroup(group));
    else unmatched.push(group[0]);
  }

  // Pass 2: group whatever's left by company+title+location — catches the same posting
  // mirrored under different/unrecognized URLs (e.g. across two curated GitHub lists).
  const byFieldKey = new Map<string, NormalizedJob[]>();
  for (const job of unmatched) {
    const key = fieldGroupKey(job);
    const group = byFieldKey.get(key);
    if (group) group.push(job);
    else byFieldKey.set(key, [job]);
  }
  for (const group of byFieldKey.values()) {
    merged.push(mergeGroup(group));
  }

  return merged;
}
