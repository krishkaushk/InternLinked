import { NormalizedJob, SourceResult, SourceStat } from '../types.ts';
import { fetchJsonWithStatus } from '../lib/http.ts';
import { extractListItems, isInternRole, stripHtml, toIsoDate } from '../lib/normalize.ts';

const SR_MAX_PAGES = 3;
const SR_PAGE_SIZE = 100;

interface SmartRecruitersPosting {
  id: string;
  name: string;
  typeOfEmployment?: { label?: string };
  location?: { remote?: boolean; fullLocation?: string };
  releasedDate?: string;
  company: { identifier: string };
}

interface SmartRecruitersListResponse {
  totalFound?: number;
  content?: SmartRecruitersPosting[];
}

interface SmartRecruitersDetailResponse {
  jobAd?: {
    sections?: {
      jobDescription?: { text?: string };
      qualifications?: { text?: string };
    };
  };
}

// Exported (and made job-shape-agnostic, taking company+id directly rather than parsing a `sr-`
// prefixed job.id) so curated-GitHub-list jobs — which carry no description in their raw source
// data — can be hydrated too, whenever their URL happens to point at a SmartRecruiters-hosted
// posting. See lib/curatedHydration.ts. Never throws; returns empty on any failure.
export async function fetchSmartRecruitersJobDescription(
  company: string,
  postingId: string
): Promise<{ description: string; requirements: string[] }> {
  const { data } = await fetchJsonWithStatus(
    `https://api.smartrecruiters.com/v1/companies/${company}/postings/${postingId}`
  );
  const detail = data as SmartRecruitersDetailResponse | null;
  if (!detail) return { description: '', requirements: [] };

  const descriptionHtml = detail.jobAd?.sections?.jobDescription?.text ?? '';
  const qualificationsHtml = detail.jobAd?.sections?.qualifications?.text ?? '';

  const descriptionParts = [stripHtml(descriptionHtml), stripHtml(qualificationsHtml)].filter(Boolean);
  const requirements = extractListItems(qualificationsHtml);

  return { description: descriptionParts.join('\n'), requirements };
}

async function hydrateSmartRecruitersDescription(
  company: string,
  job: NormalizedJob
): Promise<NormalizedJob> {
  const idPart = job.id.replace(/^sr-/, '');
  const { description, requirements } = await fetchSmartRecruitersJobDescription(company, idPart);
  if (!description) return job;
  return { ...job, description, requirements };
}

// Filters LOCALLY, never via `?q=` — that query param false-positives on "international"/
// "internal" on SmartRecruiters' search backend.
export async function fetchSmartRecruitersCompany(company: string): Promise<SourceResult> {
  const allPostings: SmartRecruitersPosting[] = [];
  let totalFound = 0;

  for (let page = 0; page < SR_MAX_PAGES; page++) {
    const offset = page * SR_PAGE_SIZE;
    const { data, status } = await fetchJsonWithStatus(
      `https://api.smartrecruiters.com/v1/companies/${company}/postings?limit=${SR_PAGE_SIZE}&offset=${offset}`
    );

    if (data === null) {
      if (page === 0) {
        const stat: SourceStat = status === 404 ? 'http_404' : status === null ? 'timeout' : 'error';
        return { jobs: [], stat };
      }
      break; // later page failed — use what we already collected
    }

    const list = data as SmartRecruitersListResponse;
    totalFound = list.totalFound ?? 0;
    allPostings.push(...(list.content ?? []));

    if (allPostings.length >= totalFound || (list.content ?? []).length === 0) break;
  }

  if (totalFound === 0) {
    return { jobs: [], stat: 'zero_total' };
  }

  const intern = allPostings.filter(
    (x) => x.typeOfEmployment?.label === 'Intern' || isInternRole(x.name)
  );

  if (intern.length === 0) {
    return { jobs: [], stat: 'zero_intern' };
  }

  const baseJobs: NormalizedJob[] = intern.map((x) => ({
    id: `sr-${x.id}`,
    companyName: company,
    title: x.name.trim(),
    location: x.location?.remote ? 'Remote' : x.location?.fullLocation || 'Remote',
    type: 'internship',
    postedDate: toIsoDate(x.releasedDate ?? null),
    jobUrl: `https://jobs.smartrecruiters.com/${x.company.identifier}/${x.id}`,
    description: '',
    requirements: [],
    source: 'smartrecruiters',
    saved: false,
    salary: null,
    _sources: ['smartrecruiters'],
  }));

  const hydrated = await Promise.all(baseJobs.map((j) => hydrateSmartRecruitersDescription(company, j)));

  return { jobs: hydrated, stat: 'ok' };
}
