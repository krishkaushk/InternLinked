import { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { AppError } from './errors.ts';

// Single source of truth for every rate-limit number in the app. Change them here — both
// score-jobs and fetch-jobs read from this table, nothing is hardcoded per-function.
//
// These are calibrated against TYPICAL Groq free-tier defaults, sized generically rather than
// per-model. Re-check against the actual Groq console (Settings -> Limits) for the current
// model (see score-jobs/index.ts's GROQ_MODEL) and the project's real tier before relying on
// them in production — confirmed for both llama-3.3-70b-versatile and llama-3.1-8b-instant that
// this account's model lineup has already changed once (both were decommissioned 2026-08-17).
export const RATE_LIMIT_POLICIES = {
  scoreJobsUserShort: { endpoint: 'score-jobs', windowSeconds: 600, maxRequests: 20 },
  scoreJobsUserDaily: { endpoint: 'score-jobs', windowSeconds: 86400, maxRequests: 150 },
  fetchJobsUserShort: { endpoint: 'fetch-jobs', windowSeconds: 600, maxRequests: 10 },
  fetchJobsUserDaily: { endpoint: 'fetch-jobs', windowSeconds: 86400, maxRequests: 100 },
  scoreJobsGlobalRpm: { endpoint: 'score-jobs', windowSeconds: 60, maxRequests: 20 },
  scoreJobsGlobalTokensPerMinute: { endpoint: 'score-jobs:tokens', windowSeconds: 60, maxTokens: 9000 },
  scoreJobsGlobalTokensPerDay: { endpoint: 'score-jobs:tokens', windowSeconds: 86400, maxTokens: 80000 },
} as const;

export const GLOBAL_SUBJECT = 'GLOBAL';

interface ConsumeArgs {
  subject: string;
  endpoint: string;
  windowSeconds: number;
  maxRequests?: number;
  maxTokens?: number;
  tokens?: number;
}

interface ConsumeResult {
  allowed: boolean;
  requestsUsed: number;
  tokensUsed: number;
  retryAfterSeconds: number;
}

async function consume(adminClient: SupabaseClient, args: ConsumeArgs): Promise<ConsumeResult> {
  const { data, error } = await adminClient.rpc('consume_rate_limit', {
    p_subject: args.subject,
    p_endpoint: args.endpoint,
    p_window_seconds: args.windowSeconds,
    // null means "no request-count cap" — the SQL function treats null as unlimited. Previously
    // this defaulted to Number.MAX_SAFE_INTEGER as a sentinel, which overflows Postgres's
    // `integer` parameter type (max ~2.1 billion) and made every token-budget-only call
    // (checkGlobalTokenBudget, reconcileTokenUsage) error out on every invocation.
    p_max_requests: args.maxRequests ?? null,
    p_max_tokens: args.maxTokens ?? null,
    p_tokens: args.tokens ?? 0,
  });
  if (error) {
    // Fail closed on a broken rate limiter would take the whole app down with it; fail open
    // here but log loudly, since the RPC itself has no client-facing side effects to abuse.
    console.error('[rateLimit] consume_rate_limit failed:', error.message);
    return { allowed: true, requestsUsed: 0, tokensUsed: 0, retryAfterSeconds: 1 };
  }
  const row = Array.isArray(data) ? data[0] : data;
  return {
    allowed: row.allowed,
    requestsUsed: row.requests_used,
    tokensUsed: row.tokens_used,
    retryAfterSeconds: row.retry_after_seconds,
  };
}

// Checks cheapest/most-specific first: per-user short window, per-user daily, then global.
// Throws RATE_LIMITED_USER (our own limiter) the moment any check fails — this is the ONLY
// place a 429 originates from; upstream provider failures surface as 503s instead, so 429
// unambiguously means "you are going too fast" from the caller's perspective.
export async function enforceUserRateLimit(
  adminClient: SupabaseClient,
  userId: string,
  shortPolicy: { endpoint: string; windowSeconds: number; maxRequests: number },
  dailyPolicy: { endpoint: string; windowSeconds: number; maxRequests: number }
): Promise<void> {
  const short = await consume(adminClient, { subject: userId, endpoint: shortPolicy.endpoint, windowSeconds: shortPolicy.windowSeconds, maxRequests: shortPolicy.maxRequests });
  if (!short.allowed) {
    throw new AppError('RATE_LIMITED_USER', 'Too many requests — slow down', { retryAfterSeconds: short.retryAfterSeconds });
  }
  const daily = await consume(adminClient, { subject: userId, endpoint: dailyPolicy.endpoint, windowSeconds: dailyPolicy.windowSeconds, maxRequests: dailyPolicy.maxRequests });
  if (!daily.allowed) {
    throw new AppError('RATE_LIMITED_USER', 'Daily request limit reached', { retryAfterSeconds: daily.retryAfterSeconds });
  }
}

export async function enforceGlobalRequestLimit(
  adminClient: SupabaseClient,
  policy: { endpoint: string; windowSeconds: number; maxRequests: number }
): Promise<void> {
  const result = await consume(adminClient, { subject: GLOBAL_SUBJECT, endpoint: policy.endpoint, windowSeconds: policy.windowSeconds, maxRequests: policy.maxRequests });
  if (!result.allowed) {
    throw new AppError('RATE_LIMITED_USER', 'Service is at capacity — try again shortly', { retryAfterSeconds: result.retryAfterSeconds });
  }
}

// Token gating is intentionally NOT thrown as an error — the caller (score-jobs) should catch
// this condition itself and degrade to keyword scoring instead of failing the request outright.
export async function checkGlobalTokenBudget(
  adminClient: SupabaseClient,
  estimatedTokens: number
): Promise<{ withinBudget: boolean; retryAfterSeconds: number }> {
  const perMinute = await consume(adminClient, {
    subject: GLOBAL_SUBJECT,
    endpoint: RATE_LIMIT_POLICIES.scoreJobsGlobalTokensPerMinute.endpoint,
    windowSeconds: RATE_LIMIT_POLICIES.scoreJobsGlobalTokensPerMinute.windowSeconds,
    maxTokens: RATE_LIMIT_POLICIES.scoreJobsGlobalTokensPerMinute.maxTokens,
    tokens: estimatedTokens,
  });
  if (!perMinute.allowed) return { withinBudget: false, retryAfterSeconds: perMinute.retryAfterSeconds };

  const perDay = await consume(adminClient, {
    subject: GLOBAL_SUBJECT,
    endpoint: RATE_LIMIT_POLICIES.scoreJobsGlobalTokensPerDay.endpoint,
    windowSeconds: RATE_LIMIT_POLICIES.scoreJobsGlobalTokensPerDay.windowSeconds,
    maxTokens: RATE_LIMIT_POLICIES.scoreJobsGlobalTokensPerDay.maxTokens,
    tokens: 0, // already counted per-minute; this call only checks the daily ceiling
  });
  if (!perDay.allowed) return { withinBudget: false, retryAfterSeconds: perDay.retryAfterSeconds };

  return { withinBudget: true, retryAfterSeconds: 0 };
}

// Fire-and-forget reconciliation of ACTUAL token usage (from Groq's response) against the
// per-minute counter, after the estimate was already used to gate the request. Never await
// this in a way that blocks the response to the client.
export function reconcileTokenUsage(adminClient: SupabaseClient, actualTokens: number): void {
  consume(adminClient, {
    subject: GLOBAL_SUBJECT,
    endpoint: RATE_LIMIT_POLICIES.scoreJobsGlobalTokensPerDay.endpoint,
    windowSeconds: RATE_LIMIT_POLICIES.scoreJobsGlobalTokensPerDay.windowSeconds,
    tokens: actualTokens,
  }).catch((e) => console.error('[rateLimit] token reconcile failed:', e.message));
}
