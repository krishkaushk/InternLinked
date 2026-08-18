// Curated-list sources (the GitHub internship-list repos) carry no description at all in their
// raw source data — SimplifyJobs'/vanshb03's listings.json has no such field, only metadata
// (title, company, url, locations, dates). A description-less job is unscoreable by either the
// client's keyword prefilter or Groq, so this recovers what's cheaply recoverable: many curated
// entries link to postings hosted on ATSs we already integrate with directly (Greenhouse,
// SmartRecruiters), which expose single-posting endpoints we already call elsewhere. Anything
// hosted on a platform we don't otherwise integrate (Workday, Oracle Cloud HCM, iCIMS, Workable,
// Eightfold, custom company career sites, etc.) has no cheap unified hydration path and is left
// as-is — those jobs simply stay unscoreable, which is an acceptable gap, not a regression.
import { NormalizedJob } from '../types.ts';
import { fetchGreenhouseJobDescription } from '../sources/greenhouse.ts';
import { fetchSmartRecruitersJobDescription } from '../sources/smartrecruiters.ts';

const GREENHOUSE_URL_RE = /^https?:\/\/(?:boards|job-boards)\.greenhouse\.io\/([^/]+)\/jobs\/(\d+)/i;
const SMARTRECRUITERS_URL_RE = /^https?:\/\/jobs\.smartrecruiters\.com\/([^/]+)\/(\d+)/i;

async function hydrateOne(job: NormalizedJob): Promise<NormalizedJob> {
  if (job.description || !job.jobUrl) return job;

  try {
    const ghMatch = job.jobUrl.match(GREENHOUSE_URL_RE);
    if (ghMatch) {
      const { description, requirements } = await fetchGreenhouseJobDescription(ghMatch[1], ghMatch[2]);
      return description ? { ...job, description, requirements } : job;
    }

    const srMatch = job.jobUrl.match(SMARTRECRUITERS_URL_RE);
    if (srMatch) {
      const { description, requirements } = await fetchSmartRecruitersJobDescription(srMatch[1], srMatch[2]);
      return description ? { ...job, description, requirements } : job;
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
