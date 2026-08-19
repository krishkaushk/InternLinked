import { supabase } from './supabase';
import { computeMatch, selectDiverse } from './matchScore';

// Groq scoring now happens server-side (supabase/functions/score-jobs) — the key is no longer
// bundled into client JS, real per-user/global rate limiting applies, and retry/backoff is
// handled there. This file is a thin orchestrator: prefilter -> batch -> invoke -> merge.
const BATCH_SIZE = 10;
const INTER_BATCH_DELAY_MS = 12000;
const MAX_JOBS_SCORED = 25; // keyword-prefiltered before any Groq call — see matchScore.js
// A high-volume poster (e.g. one company running 40 near-identical internship postings)
// shouldn't be able to fill most of MAX_JOBS_SCORED by itself — see selectDiverse in
// matchScore.js for the backfill-if-starved behavior that keeps this from shrinking the result
// when there genuinely aren't enough other companies to fill the remaining slots.
const MAX_PER_COMPANY = 3;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function toRequestJob(job) {
    return {
        id: job.id,
        title: job.title,
        companyName: job.companyName,
        location: job.location,
        postedDate: job.postedDate ? new Date(job.postedDate).toISOString() : null,
        description: job.description || '',
    };
}

// supabase.functions.invoke() surfaces a non-2xx response as `error`, but the structured error
// body (our AppError JSON: { code, message, ... }) has to be read out of `error.context`.
async function readFunctionErrorBody(error) {
    try {
        return await error.context.json();
    } catch {
        return null;
    }
}

function sortResults(results) {
    return [...results].sort((a, b) => {
        const av = a.ok === false ? -1 : (a.matchPercentage ?? 0);
        const bv = b.ok === false ? -1 : (b.matchPercentage ?? 0);
        return bv - av;
    });
}

export async function scoreJobs(jobs, profile, { onProgress } = {}) {
    // Some sources (e.g. the curated GitHub internship lists) don't carry a job description at
    // all — there's nothing for either the keyword prefilter or Groq to actually evaluate, so a
    // description-less job is unscoreable by definition. Excluding it up front means it can't
    // occupy one of the precious MAX_JOBS_SCORED slots on a meaningless 0%.
    const describedJobs = jobs.filter(job => job.description && job.description.trim().length > 0);

    // Free, local prefilter — decides which jobs are worth spending Groq tokens on. Only the top
    // MAX_JOBS_SCORED by keyword overlap get a real AI-reasoned score; everything else is left
    // out of the result entirely (by product decision — a raw keyword-overlap percentage isn't a
    // trustworthy enough signal to present as "matched to your resume"). selectDiverse caps any
    // one company at MAX_PER_COMPANY of those slots so a high-volume poster can't crowd out
    // everyone else, backfilling from the capped-out leftovers if there aren't enough other
    // companies to fill MAX_JOBS_SCORED.
    const ranked = describedJobs
        .map(job => ({ job, pre: computeMatch(profile.skills, job.description) }))
        .sort((a, b) => b.pre.matchPercentage - a.pre.matchPercentage);
    const toScore = selectDiverse(ranked, MAX_PER_COMPANY, MAX_JOBS_SCORED).map(({ job }) => job);

    const results = [];
    let failedCount = 0;
    let degraded = false;
    let rateLimited = null;

    for (let i = 0; i < toScore.length; i += BATCH_SIZE) {
        const batch = toScore.slice(i, i + BATCH_SIZE);

        const { data, error } = await supabase.functions.invoke('score-jobs', {
            body: { jobs: batch.map(toRequestJob) },
        });

        if (error) {
            const body = await readFunctionErrorBody(error);
            if (body?.code === 'RATE_LIMITED_USER') {
                rateLimited = { retryAfterSeconds: body.retryAfterSeconds ?? 60 };
                break; // don't keep burning batches against a limiter that already said no
            }
            console.error('[scoreJobs] batch failed:', body?.message || error.message);
            failedCount += batch.length;
            results.push(...batch.map(job => ({ ...job, ok: false })));
            onProgress?.(sortResults(results));
            if (i + BATCH_SIZE < toScore.length) await sleep(INTER_BATCH_DELAY_MS);
            continue;
        }

        if (data?.degraded) degraded = true;

        const byId = new Map((data?.results ?? []).map(r => [r.jobId, r]));
        const scoredBatch = batch.map(job => {
            const r = byId.get(job.id);
            if (!r || r.ok === false) {
                failedCount += 1;
                return { ...job, ok: false };
            }
            return {
                ...job,
                ok: true,
                matchPercentage: r.matchPercentage,
                matchedSkills: r.matchedSkills,
                missingSkills: r.missingSkills,
                reason: r.reason,
                source: r.source,
            };
        });
        results.push(...scoredBatch);
        onProgress?.(sortResults(results));

        if (i + BATCH_SIZE < toScore.length) await sleep(INTER_BATCH_DELAY_MS);
    }

    return { results: sortResults(results), failedCount, degraded, rateLimited };
}
