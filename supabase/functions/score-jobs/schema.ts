// Plain-function request body validator — no external validation library, edge functions stay
// dependency-light. Also enforces the "never accept resume/profile data from the client" rule:
// this function only ever reads resume text / profile fields from the DB via the caller's own
// RLS-scoped row, never from the request body.

import { AppError } from '../_shared/errors.ts';

export interface ScoreJobInput {
  id: string;
  title: string;
  companyName: string;
  location: string;
  postedDate: string | null;
  description: string;
}

export interface ScoreRequest {
  jobs: ScoreJobInput[];
}

const MAX_JOBS = 12;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

export function validateScoreRequest(body: unknown): ScoreRequest {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new AppError('BAD_REQUEST', 'Request body must be a JSON object');
  }
  const b = body as Record<string, unknown>;

  // The function must never accept resume text or profile data from the client — only from the
  // DB via the user's own row. Reject outright if either key is even present.
  if ('profile' in b || 'resumeText' in b) {
    throw new AppError('BAD_REQUEST', 'profile and resumeText must not be sent in the request body');
  }

  const jobsRaw = b.jobs;
  if (!Array.isArray(jobsRaw)) {
    throw new AppError('BAD_REQUEST', 'jobs must be an array');
  }
  if (jobsRaw.length < 1) {
    throw new AppError('BAD_REQUEST', 'jobs must not be empty');
  }
  if (jobsRaw.length > MAX_JOBS) {
    throw new AppError('BAD_REQUEST', `Too many jobs in one request (max ${MAX_JOBS})`);
  }

  const jobs: ScoreJobInput[] = jobsRaw.map((raw, i) => {
    if (typeof raw !== 'object' || raw === null) {
      throw new AppError('BAD_REQUEST', `Job at index ${i} must be an object`);
    }
    const j = raw as Record<string, unknown>;

    if (!isNonEmptyString(j.id)) {
      throw new AppError('BAD_REQUEST', `Job at index ${i} is missing a non-empty "id"`);
    }
    if (!isNonEmptyString(j.title)) {
      throw new AppError('BAD_REQUEST', `Job at index ${i} is missing a non-empty "title"`);
    }
    if (!isNonEmptyString(j.companyName)) {
      throw new AppError('BAD_REQUEST', `Job at index ${i} is missing a non-empty "companyName"`);
    }

    return {
      id: j.id,
      title: j.title,
      companyName: j.companyName,
      location: typeof j.location === 'string' ? j.location : '',
      postedDate: typeof j.postedDate === 'string' ? j.postedDate : null,
      description: typeof j.description === 'string' ? j.description : '',
    };
  });

  return { jobs };
}
