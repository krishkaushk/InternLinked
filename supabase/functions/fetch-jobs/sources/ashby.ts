import { NormalizedJob, SourceResult, SourceStat } from '../types.ts';
import { fetchJsonWithStatus } from '../lib/http.ts';
import { isInternRole, stripHtml, toIsoDate, truncate } from '../lib/normalize.ts';

interface AshbyCompensation {
  scrapeableCompensationSalarySummary?: string | null;
}

interface AshbyJob {
  id: string;
  title: string;
  isListed?: boolean;
  employmentType?: string;
  location?: string;
  secondaryLocations?: Array<{ location?: string }>;
  isRemote?: boolean;
  publishedAt?: string;
  descriptionPlain?: string;
  descriptionHtml?: string;
  jobUrl?: string;
  applyUrl?: string;
  compensation?: AshbyCompensation;
}

// Ashby's job-board API ships full descriptions in the list response, so no hydration pass is
// needed (unlike greenhouse.ts / smartrecruiters.ts).
export async function fetchAshbyCompany(board: string): Promise<SourceResult> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(board)}?includeCompensation=true`;
  const { data, status } = await fetchJsonWithStatus(url);

  if (data === null) {
    const stat: SourceStat = status === 404 ? 'http_404' : status === null ? 'timeout' : 'error';
    return { jobs: [], stat };
  }

  const rawJobs: AshbyJob[] = Array.isArray(data?.jobs) ? data.jobs : [];
  const intern = rawJobs.filter(
    (j) => j.isListed !== false && (j.employmentType === 'Intern' || isInternRole((j.title ?? '').trim()))
  );

  if (intern.length === 0) {
    return { jobs: [], stat: 'zero_intern' };
  }

  const jobs: NormalizedJob[] = intern.map((j) => ({
    id: `ab-${j.id}`,
    companyName: board,
    title: j.title.trim(),
    location: j.location || j.secondaryLocations?.[0]?.location || (j.isRemote ? 'Remote' : 'Remote'),
    type: 'internship',
    postedDate: toIsoDate(j.publishedAt ?? null),
    description: truncate(j.descriptionPlain || stripHtml(j.descriptionHtml ?? ''), 2000),
    requirements: [],
    jobUrl: j.jobUrl || j.applyUrl || '',
    source: 'ashby',
    saved: false,
    salary: j.compensation?.scrapeableCompensationSalarySummary ?? null,
    _sources: ['ashby'],
  }));

  return { jobs, stat: 'ok' };
}
