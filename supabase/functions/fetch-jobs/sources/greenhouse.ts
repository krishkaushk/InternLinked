import { NormalizedJob, SourceResult, SourceStat } from '../types.ts';
import { fetchJsonWithStatus } from '../lib/http.ts';
import { isInternRole, stripHtml, toIsoDate, truncate } from '../lib/normalize.ts';

interface GreenhouseListJob {
  id: number;
  title: string;
  company_name?: string;
  location?: { name?: string };
  absolute_url?: string;
  updated_at?: string;
  first_published?: string;
}

interface GreenhouseJobDetail {
  content?: string;
}

// Exported so curated-GitHub-list jobs (which carry no description at all in their raw source
// data) can be hydrated too, whenever their URL happens to point at a Greenhouse-hosted posting —
// see lib/curatedHydration.ts. Returns empty description/requirements on any failure, never throws.
export async function fetchGreenhouseJobDescription(
  board: string,
  jobId: string
): Promise<{ description: string; requirements: string[] }> {
  const { data } = await fetchJsonWithStatus(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs/${jobId}`);
  const description = stripHtml((data as GreenhouseJobDetail | null)?.content ?? '');
  return { description: truncate(description, 2000), requirements: [] };
}

// Fetches a Greenhouse board's job list, filters to intern/co-op roles, then hydrates each
// surviving job's full description via a second per-job call. Only intern-filtered survivors are
// hydrated (never the whole board) — the pipeline caps total hydration cost by capping which
// companies/sources run, not by skipping hydration here.
export async function fetchGreenhouseCompany(company: string): Promise<SourceResult> {
  const listUrl = `https://boards-api.greenhouse.io/v1/boards/${company}/jobs`;
  const { data, status } = await fetchJsonWithStatus(listUrl);

  if (data === null) {
    const stat: SourceStat = status === 404 ? 'http_404' : status === null ? 'timeout' : 'error';
    return { jobs: [], stat };
  }

  const rawJobs: GreenhouseListJob[] = Array.isArray(data?.jobs) ? data.jobs : [];
  const intern = rawJobs.filter((j) => isInternRole(j.title));

  if (intern.length === 0) {
    return { jobs: [], stat: 'zero_intern' };
  }

  const hydrated = await Promise.all(
    intern.map(async (j): Promise<NormalizedJob> => {
      const { description } = await fetchGreenhouseJobDescription(company, String(j.id));

      return {
        id: `gh-${j.id}`,
        companyName: j.company_name || company,
        title: j.title,
        location: j.location?.name || 'Remote',
        type: 'internship',
        postedDate: toIsoDate(j.first_published ?? j.updated_at ?? null),
        description,
        requirements: [],
        jobUrl: j.absolute_url || '',
        source: 'greenhouse',
        saved: false,
        salary: null,
        _sources: ['greenhouse'],
      };
    })
  );

  return { jobs: hydrated, stat: 'ok' };
}
