// Curated-list sources (the GitHub internship-list repos) carry no description at all in their
// raw source data — SimplifyJobs'/vanshb03's listings.json has no such field, only metadata
// (title, company, url, locations, dates). A description-less job is unscoreable by either the
// client's keyword prefilter or Groq, so this recovers what's cheaply recoverable: many curated
// entries link to postings hosted on ATSs we already integrate with directly (Greenhouse,
// SmartRecruiters), which expose single-posting endpoints we already call elsewhere. Anything
// else falls through to a generic JSON-LD JobPosting scrape (see lib/jsonLd.ts), which covers a
// real chunk of the rest (confirmed against live data: Workday, Eightfold) without needing a
// dedicated integration per platform. Whatever's left after both — pages that render content
// client-side, or block simple server-side fetches outright — stays unscoreable, which is an
// accepted gap, not a regression.
import { NormalizedJob } from '../types.ts';
import { fetchGreenhouseJobDescription } from '../sources/greenhouse.ts';
import { fetchSmartRecruitersJobDescription } from '../sources/smartrecruiters.ts';
import { fetchTextWithStatus } from './http.ts';
import { extractJobPostingDescription } from './jsonLd.ts';

const GREENHOUSE_URL_RE = /^https?:\/\/(?:boards|job-boards)\.greenhouse\.io\/([^/]+)\/jobs\/(\d+)/i;
const SMARTRECRUITERS_URL_RE = /^https?:\/\/jobs\.smartrecruiters\.com\/([^/]+)\/(\d+)/i;

async function hydrateOne(job: NormalizedJob): Promise<NormalizedJob> {
  if (job.description || !job.jobUrl) return job;

  try {
    const ghMatch = job.jobUrl.match(GREENHOUSE_URL_RE);
    if (ghMatch) {
      const { description, requirements } = await fetchGreenhouseJobDescription(ghMatch[1], ghMatch[2]);
      if (description) return { ...job, description, requirements };
    }

    const srMatch = job.jobUrl.match(SMARTRECRUITERS_URL_RE);
    if (srMatch) {
      const { description, requirements } = await fetchSmartRecruitersJobDescription(srMatch[1], srMatch[2]);
      if (description) return { ...job, description, requirements };
    }

    // Generic fallback for everything not matched (or matched but empty) above.
    const { text } = await fetchTextWithStatus(job.jobUrl);
    if (text) {
      const description = extractJobPostingDescription(text);
      if (description) return { ...job, description };
    }
  } catch (e) {
    console.warn(`[fetch-jobs] curated hydration failed for ${job.jobUrl}: ${(e as Error).message}`);
  }

  return job;
}

// Only ever called on the post-truncation slice (see pipeline.ts) so cost is bounded to at most
// RESULT_LIMIT checks, most of which exit immediately (already has a description, or an
// unrecognized host) rather than making a network call.
export async function hydrateCuratedJobs(jobs: NormalizedJob[]): Promise<NormalizedJob[]> {
  const results = await Promise.allSettled(
    jobs.map((j) => (j.source.startsWith('github:') ? hydrateOne(j) : Promise.resolve(j)))
  );
  return results.map((r, i) => (r.status === 'fulfilled' ? r.value : jobs[i]));
}
