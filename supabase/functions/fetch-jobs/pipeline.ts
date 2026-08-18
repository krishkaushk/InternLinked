import { NormalizedJob, SourceStats } from './types.ts';
import { dedupeJobs } from './lib/dedup.ts';
import { hydrateCuratedJobs } from './lib/curatedHydration.ts';
import {
  ASHBY_COMPANIES,
  GITHUB_CURATED_REPOS,
  GREENHOUSE_COMPANIES,
  LEVER_COMPANIES,
  SMARTRECRUITERS_COMPANIES,
} from './sources/companies.ts';
import { fetchGreenhouseCompany } from './sources/greenhouse.ts';
import { fetchLeverCompany } from './sources/lever.ts';
import { fetchAshbyCompany } from './sources/ashby.ts';
import { fetchSmartRecruitersCompany } from './sources/smartrecruiters.ts';
import { fetchGithubCuratedRepo } from './sources/githubCurated.ts';

// Deliberately larger than the old client-side cap of 40 — with 5 sources now yielding
// potentially thousands of postings, cap generously here and let the client's keyword-prefilter
// narrow down to ~25 before Groq scoring.
const RESULT_LIMIT = 150;

interface FanOutTask {
  statKey: string;
  run: () => Promise<{ jobs: NormalizedJob[]; stat: string }>;
}

export async function runPipeline(): Promise<{ jobs: NormalizedJob[]; sourceStats: SourceStats }> {
  const tasks: FanOutTask[] = [
    ...GREENHOUSE_COMPANIES.map((company) => ({
      statKey: `greenhouse:${company}`,
      run: () => fetchGreenhouseCompany(company),
    })),
    ...LEVER_COMPANIES.map((company) => ({
      statKey: `lever:${company}`,
      run: () => fetchLeverCompany(company),
    })),
    ...ASHBY_COMPANIES.map((board) => ({
      statKey: `ashby:${board}`,
      run: () => fetchAshbyCompany(board),
    })),
    ...SMARTRECRUITERS_COMPANIES.map((company) => ({
      statKey: `smartrecruiters:${company}`,
      run: () => fetchSmartRecruitersCompany(company),
    })),
    ...GITHUB_CURATED_REPOS.map((repoConfig) => ({
      statKey: `github:${repoConfig.key}`,
      run: () => fetchGithubCuratedRepo(repoConfig),
    })),
  ];

  const settled = await Promise.allSettled(tasks.map((t) => t.run()));

  const sourceStats: SourceStats = {};
  const allJobs: NormalizedJob[] = [];

  settled.forEach((result, i) => {
    const statKey = tasks[i].statKey;
    if (result.status === 'fulfilled') {
      allJobs.push(...result.value.jobs);
      sourceStats[statKey] = result.value.stat as SourceStats[string];
    } else {
      // One source rejecting must never affect any other source.
      console.warn(`[fetch-jobs] source ${statKey} rejected: ${(result.reason as Error)?.message ?? result.reason}`);
      sourceStats[statKey] = 'error';
    }
  });

  const deduped = dedupeJobs(allJobs);

  const sortByDateDesc = (a: NormalizedJob, b: NormalizedJob) => {
    if (a.postedDate === null && b.postedDate === null) return 0;
    if (a.postedDate === null) return 1;
    if (b.postedDate === null) return -1;
    return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
  };

  // Curated-list jobs (source starting with 'github:') carry NO description in their raw data —
  // they only become scoreable if hydration below finds a matching Greenhouse/SmartRecruiters
  // URL. The curated lists post very high volume with very fresh timestamps, so a plain
  // date-sorted truncation can crowd out direct-source jobs (Greenhouse/Lever/Ashby/
  // SmartRecruiters company lists) entirely — even though those are guaranteed to already have a
  // real description. Guarantee every direct-source job a slot first (there are far fewer of them
  // than the curated lists produce, so this is nearly free), then fill whatever's left with
  // curated entries by date — giving hydration the best remaining shot at rescuing some of them.
  const isCurated = (j: NormalizedJob) => j.source.startsWith('github:');
  const directJobs = deduped.filter((j) => !isCurated(j)).sort(sortByDateDesc).slice(0, RESULT_LIMIT);
  const curatedJobs = deduped.filter(isCurated).sort(sortByDateDesc);
  const remainingBudget = Math.max(0, RESULT_LIMIT - directJobs.length);

  const truncated = [...directJobs, ...curatedJobs.slice(0, remainingBudget)].sort(sortByDateDesc);

  // Hydrate whichever curated survivors link to a Greenhouse/SmartRecruiters-hosted posting.
  // Runs only on this bounded post-truncation slice, and only fills in description/requirements
  // (never postedDate), so it can't reorder anything — no re-sort needed after.
  const hydratedCurated = await hydrateCuratedJobs(truncated);

  return { jobs: hydratedCurated, sourceStats };
}
