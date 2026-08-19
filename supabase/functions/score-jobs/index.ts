// Server-side replacement for src/internlinked/utils/llmScore.js's direct-from-browser Groq call.
// Moves the Groq API key server-side, adds real per-user + global rate limiting, a global token
// budget with a keyword-matching fallback when that budget is exhausted, retry via the shared
// fetchWithRetry helper, and a resume-scoped score cache (job_scores) so repeat scoring runs for
// the same resume don't re-pay Groq token cost.

import { handlePreflight } from '../_shared/cors.ts';
import { AppError, jsonError, jsonOk } from '../_shared/errors.ts';
import { requireUser } from '../_shared/auth.ts';
import { fetchWithRetry, RetryExhaustedError } from '../_shared/retry.ts';
import {
  RATE_LIMIT_POLICIES,
  enforceUserRateLimit,
  enforceGlobalRequestLimit,
  checkGlobalTokenBudget,
  reconcileTokenUsage,
} from '../_shared/rateLimit.ts';
import { validateScoreRequest, ScoreJobInput } from './schema.ts';
import { buildBatchPrompt, extractJSONArray, ParsedJobScore } from './prompt.ts';
import { keywordScore } from './keywordFallback.ts';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// llama-3.3-70b-versatile and llama-3.1-8b-instant were both decommissioned on Groq's side
// (confirmed via live 404 model_not_found responses on 2026-08-17). Fetched the real current
// model list from GET /openai/v1/models and picked openai/gpt-oss-20b: a genuine general-purpose
// instruction-following model (unlike whisper-*/orpheus-*/prompt-guard-* in the same account,
// which are speech/classifier models unsuited to a JSON-scoring task), and the smaller/faster
// variant tends to carry more generous per-minute rate limits than openai/gpt-oss-120b.
const GROQ_MODEL = 'openai/gpt-oss-20b';

// Defense in depth: cap resumeText server-side regardless of what's stored in the DB.
const RESUME_TEXT_MAX_CHARS = 2500;
const DESCRIPTION_MAX_CHARS = 500;
const MAX_TOKENS_PER_JOB = 110;
// gpt-oss-20b is a reasoning model — it spends a chunk of max_tokens on hidden chain-of-thought
// before writing the actual answer. REASONING_TOKEN_BUFFER gives it room to do that without
// starving the actual JSON output (confirmed via a live `json_validate_failed` error: the
// constrained-JSON decoder was running out of budget mid-structure at 110 tokens/job with no
// buffer at all).
const REASONING_TOKEN_BUFFER = 1000;

interface ScoredResult {
  jobId: string;
  ok: true;
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  reason: string;
  source: 'llm' | 'keyword' | 'cache';
}

interface FailedResult {
  jobId: string;
  ok: false;
  code: string;
}

type ResultEntry = ScoredResult | FailedResult;

interface ProfileForScoring {
  skills: string[];
  school: string | null;
  major: string | null;
  location: string | null;
}

function callGroq(prompt: string, jobCount: number) {
  return fetchWithRetry(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      // gpt-oss's reasoning length varies unpredictably per request (observed: a 5-job batch
      // burned its whole token budget on chain-of-thought and returned empty content, while a
      // larger 10-job batch succeeded) — capping reasoning effort directly is more reliable than
      // just raising max_tokens further, since a bigger ceiling just gives it more room to
      // over-think rather than guaranteeing it leaves room for the actual answer.
      reasoning_effort: 'low',
      // Reasoning buffer + a generous per-job output budget. NOT using response_format:
      // json_object here — Groq's constrained-JSON decoder for this model returned
      // json_validate_failed when the generation ran out of room, which is a harder failure
      // than a plain-text response with reasoning preamble that extractJSONArray's fallback
      // parsing can still recover.
      max_tokens: REASONING_TOKEN_BUFFER + MAX_TOKENS_PER_JOB * jobCount,
    }),
  });
}

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  try {
    // --- auth first: everything below assumes an authenticated user ---
    const { user, userClient, adminClient } = await requireUser(req);

    // --- parse + validate body (before any rate-limit/DB/Groq work) ---
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      throw new AppError('BAD_REQUEST', 'Request body must be valid JSON');
    }
    const { jobs } = validateScoreRequest(rawBody);

    // --- rate limits: user short/daily, then global RPM. All before any Groq call. ---
    await enforceUserRateLimit(
      adminClient,
      user.id,
      RATE_LIMIT_POLICIES.scoreJobsUserShort,
      RATE_LIMIT_POLICIES.scoreJobsUserDaily
    );
    await enforceGlobalRequestLimit(adminClient, RATE_LIMIT_POLICIES.scoreJobsGlobalRpm);

    // --- load profile via the caller's own RLS-scoped client (never trust client-supplied profile/resume) ---
    const { data: profileRow, error: profileError } = await userClient
      .from('profiles')
      .select('skills, school, major, location, resume_text, resume_text_sha256')
      .eq('id', user.id)
      .single();

    if (profileError || !profileRow) {
      throw new AppError('BAD_REQUEST', 'Complete your profile before scoring jobs');
    }

    const profile: ProfileForScoring = {
      skills: Array.isArray(profileRow.skills) ? (profileRow.skills as string[]) : [],
      school: (profileRow.school as string | null) ?? null,
      major: (profileRow.major as string | null) ?? null,
      location: (profileRow.location as string | null) ?? null,
    };

    const resumeText: string | null =
      typeof profileRow.resume_text === 'string' && profileRow.resume_text.length > 0
        ? profileRow.resume_text.slice(0, RESUME_TEXT_MAX_CHARS)
        : null;
    const resumeSha256: string | null = (profileRow.resume_text_sha256 as string | null) ?? null;

    // --- cache lookup, scoped to this resume version ---
    const jobIds = jobs.map((j) => j.id);
    const cacheHits = new Map<string, ScoredResult>();

    {
      let cacheQuery = userClient
        .from('job_scores')
        .select('job_id, match_percentage, matched_skills, missing_skills, reason')
        .eq('user_id', user.id)
        .in('job_id', jobIds);
      cacheQuery = resumeSha256 ? cacheQuery.eq('resume_sha256', resumeSha256) : cacheQuery.is('resume_sha256', null);

      const { data: cacheRows, error: cacheError } = await cacheQuery;
      if (cacheError) {
        // Cache is an optimization, not a correctness requirement — log and fall through to
        // treating everything as a miss rather than failing the whole request.
        console.error('[score-jobs] cache lookup failed:', cacheError.message);
      } else if (cacheRows) {
        for (const row of cacheRows as Array<Record<string, unknown>>) {
          const jobId = row.job_id as string;
          cacheHits.set(jobId, {
            jobId,
            ok: true,
            matchPercentage: row.match_percentage as number,
            matchedSkills: Array.isArray(row.matched_skills) ? (row.matched_skills as string[]) : [],
            missingSkills: Array.isArray(row.missing_skills) ? (row.missing_skills as string[]) : [],
            reason: (row.reason as string | null) ?? '',
            source: 'cache',
          });
        }
      }
    }

    const misses: ScoreJobInput[] = jobs.filter((j) => !cacheHits.has(j.id));

    let degraded = false;
    const liveResults = new Map<string, ResultEntry>();
    let usage: { totalTokens: number } | undefined;

    if (misses.length > 0) {
      // Rough char/4 heuristic — doesn't need to be precise, only good enough to gate the global
      // token budget before committing to a live Groq call. Includes REASONING_TOKEN_BUFFER since
      // gpt-oss-20b's hidden chain-of-thought counts against the same token budget as the answer.
      const estimatedTokens = Math.ceil(
        250 +
          (resumeText?.length ?? 0) / 4 +
          misses.length * (DESCRIPTION_MAX_CHARS / 4 + MAX_TOKENS_PER_JOB) +
          REASONING_TOKEN_BUFFER
      );

      const { withinBudget } = await checkGlobalTokenBudget(adminClient, estimatedTokens);

      if (!withinBudget) {
        // Degrade to keyword matching instead of failing outright — skip the Groq call entirely.
        degraded = true;
        for (const job of misses) {
          const { matchPercentage, matchedSkills, missingSkills } = keywordScore(profile.skills, job.description);
          liveResults.set(job.id, {
            jobId: job.id,
            ok: true,
            matchPercentage,
            matchedSkills,
            missingSkills,
            reason: '',
            source: 'keyword',
          });
        }
      } else {
        const truncatedMisses = misses.map((j) => ({
          ...j,
          description: (j.description || '').slice(0, DESCRIPTION_MAX_CHARS),
        }));

        let response: Response;
        try {
          const result = await callGroq(
            buildBatchPrompt(truncatedMisses, profile, resumeText, DESCRIPTION_MAX_CHARS),
            truncatedMisses.length
          );
          response = result.response;
        } catch (e) {
          if (e instanceof RetryExhaustedError) {
            throw new AppError('GROQ_UNAVAILABLE', 'Groq request failed after retries');
          }
          throw e;
        }

        if (!response.ok) {
          // Log the ACTUAL Groq error before throwing our own generic AppError — otherwise the
          // real cause (bad model name, invalid request, account issue, etc.) is invisible in
          // function logs and every failure just looks like "Groq request failed".
          const bodyText = await response.text().catch(() => '<unreadable body>');
          console.error(`[score-jobs] Groq responded ${response.status}: ${bodyText}`);

          if (response.status === 401 || response.status === 403) {
            throw new AppError('GROQ_AUTH', 'Groq authentication failed');
          }
          if (response.status === 429) {
            const retryAfterHeader = response.headers.get('retry-after');
            const retryAfterSeconds = retryAfterHeader ? Math.ceil(parseFloat(retryAfterHeader)) : undefined;
            throw new AppError('GROQ_RATE_LIMITED', 'Groq rate limited', { retryAfterSeconds });
          }
          throw new AppError('GROQ_UNAVAILABLE', `Groq request failed (${response.status})`);
        }

        const data = await response.json();
        const content: string = data.choices?.[0]?.message?.content ?? '';
        const finishReason: string | undefined = data.choices?.[0]?.finish_reason;
        if (!content) {
          // Empty content with finish_reason 'length' means the model burned its whole token
          // budget on reasoning and never got to the actual answer — distinguishing this from
          // other empty-content causes (content filter, etc.) via the logged finish_reason.
          console.error(`[score-jobs] Groq returned empty content (finish_reason: ${finishReason ?? 'unknown'})`);
        }

        // A parsed array shorter (or longer) than the batch means Groq ran out of room mid-array
        // but still produced syntactically valid JSON for the partial result — this must be
        // rejected outright, not accepted with missing indices silently defaulting to a fake
        // score. Indexed mapping also can't be trusted to still line up correctly once the
        // lengths disagree.
        function validateParsedLength(candidate: ParsedJobScore[], expected: number): ParsedJobScore[] {
          if (!Array.isArray(candidate) || candidate.length !== expected) {
            throw new Error(`Expected ${expected} scores, got ${Array.isArray(candidate) ? candidate.length : typeof candidate}`);
          }
          return candidate;
        }

        let parsed: ParsedJobScore[] | null = null;
        try {
          parsed = validateParsedLength(extractJSONArray(content), truncatedMisses.length);
        } catch (e) {
          console.error(`[score-jobs] failed to parse Groq content: ${(e as Error).message}. Raw content: ${content.slice(0, 1000)}`);
          parsed = null;
        }

        // Malformed JSON on the first attempt: retry ONCE with a terser prompt suffix, using a
        // fresh fetchWithRetry call (separate from fetchWithRetry's own transport-level retries).
        if (!parsed) {
          try {
            const retryPrompt =
              buildBatchPrompt(truncatedMisses, profile, resumeText, DESCRIPTION_MAX_CHARS) +
              '\n\nReturn ONLY the JSON object, no prose, no markdown code fences.';
            const retryResult = await callGroq(retryPrompt, truncatedMisses.length);
            if (retryResult.response.ok) {
              const retryData = await retryResult.response.json();
              const retryContent: string = retryData.choices?.[0]?.message?.content ?? '';
              if (!retryContent) {
                const retryFinishReason: string | undefined = retryData.choices?.[0]?.finish_reason;
                console.error(`[score-jobs] retry also returned empty content (finish_reason: ${retryFinishReason ?? 'unknown'})`);
              }
              try {
                parsed = validateParsedLength(extractJSONArray(retryContent), truncatedMisses.length);
              } catch (e) {
                console.error(`[score-jobs] retry parse also failed: ${(e as Error).message}. Raw content: ${retryContent.slice(0, 1000)}`);
                throw e;
              }
              data.usage = retryData.usage ?? data.usage;
            }
          } catch {
            parsed = null;
          }
        }

        if (!parsed) {
          // A malformed-output failure degrades gracefully for just these jobs — it must not
          // throw, since that would also kill any jobs in this request that had cache hits.
          for (const job of truncatedMisses) {
            liveResults.set(job.id, { jobId: job.id, ok: false, code: 'MODEL_OUTPUT_INVALID' });
          }
        } else {
          const parsedArray = parsed;
          truncatedMisses.forEach((job, i) => {
            const r = parsedArray[i] ?? {};
            liveResults.set(job.id, {
              jobId: job.id,
              ok: true,
              matchPercentage: Math.min(100, Math.max(0, Number(r.matchPercentage) || 0)),
              matchedSkills: Array.isArray(r.matchedSkills) ? (r.matchedSkills as string[]) : [],
              missingSkills: Array.isArray(r.missingSkills) ? (r.missingSkills as string[]) : [],
              reason: typeof r.reason === 'string' ? r.reason : '',
              source: 'llm',
            });
          });
        }

        const actualTokens: number = data.usage?.total_tokens ?? estimatedTokens;
        usage = { totalTokens: actualTokens };
        // Fire-and-forget — must not block the response to the client.
        reconcileTokenUsage(adminClient, actualTokens);
      }
    }

    // --- upsert newly-scored (non-cache-hit, ok:true, LLM-sourced) results into the cache ---
    // Keyword-fallback results (source: 'keyword') are used for this response but deliberately
    // NOT cached — they only exist because the global Groq token budget was exhausted, and
    // caching them would permanently serve a degraded score as if it were a real LLM score
    // (job_scores has no column to distinguish the two), even after the budget recovers.
    const rowsToUpsert = [...liveResults.values()]
      .filter((r): r is ScoredResult => r.ok && r.source === 'llm')
      .map((r) => ({
        user_id: user.id,
        job_id: r.jobId,
        resume_sha256: resumeSha256,
        match_percentage: r.matchPercentage,
        matched_skills: r.matchedSkills,
        missing_skills: r.missingSkills,
        reason: r.reason,
        model: GROQ_MODEL,
        scored_at: new Date().toISOString(),
      }));

    if (rowsToUpsert.length > 0) {
      const { error: upsertError } = await adminClient
        .from('job_scores')
        .upsert(rowsToUpsert, { onConflict: 'user_id,job_id' });
      if (upsertError) {
        console.error('[score-jobs] cache upsert failed:', upsertError.message);
      }
    }

    // --- merge cache hits + live results, preserving the original request order ---
    const results: ResultEntry[] = jobs.map((job) => {
      const cached = cacheHits.get(job.id);
      if (cached) return cached;
      const live = liveResults.get(job.id);
      if (live) return live;
      // Should be unreachable: every job is either a cache hit or a miss handled above.
      return { jobId: job.id, ok: false, code: 'INTERNAL' };
    });

    const scored = results.filter((r) => r.ok && r.source !== 'cache').length;
    const failed = results.filter((r) => !r.ok).length;

    return jsonOk({
      degraded,
      results,
      ...(usage ? { usage } : {}),
      meta: {
        cacheHits: cacheHits.size,
        scored,
        failed,
      },
    });
  } catch (e) {
    if (e instanceof AppError) {
      return jsonError(e);
    }
    console.error('[score-jobs] unexpected error:', e);
    return jsonError(new AppError('INTERNAL', 'Unexpected error'));
  }
});
