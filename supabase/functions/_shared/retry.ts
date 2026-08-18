// Generic retrying fetch wrapper, shared by score-jobs (Groq) and fetch-jobs (upstream job boards).
// Full-jitter exponential backoff spreads a thundering herd of independently-retrying Edge
// Function invocations better than fixed/equal jitter — relevant because many users' invocations
// may be retrying against the same shared upstream quota (e.g. Groq) at once.

const RETRYABLE_STATUSES = new Set([429, 408, 500, 502, 503, 504]);

export interface RetryPolicy {
  maxAttempts?: number; // total attempts, including the first — default 4
  baseDelayMs?: number; // default 1000
  maxDelayMs?: number; // default 20000
  perAttemptTimeoutMs?: number; // default 25000
  respectRetryAfterUpToMs?: number; // default 30000 — beyond this, fail fast instead of holding the invocation open
}

export interface RetryResult {
  response: Response;
  attempts: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function fullJitterDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const cap = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
  return Math.random() * cap;
}

export class RetryExhaustedError extends Error {
  lastResponse?: Response;
  constructor(message: string, lastResponse?: Response) {
    super(message);
    this.lastResponse = lastResponse;
  }
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  policy: RetryPolicy = {}
): Promise<RetryResult> {
  const maxAttempts = policy.maxAttempts ?? 4;
  const baseDelayMs = policy.baseDelayMs ?? 1000;
  const maxDelayMs = policy.maxDelayMs ?? 20000;
  const perAttemptTimeoutMs = policy.perAttemptTimeoutMs ?? 25000;
  const respectRetryAfterUpToMs = policy.respectRetryAfterUpToMs ?? 30000;

  let lastResponse: Response | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), perAttemptTimeoutMs);

    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        return { response: res, attempts: attempt + 1 };
      }

      if (!RETRYABLE_STATUSES.has(res.status) || attempt === maxAttempts - 1) {
        return { response: res, attempts: attempt + 1 };
      }

      lastResponse = res;

      // Retry-After is authoritative when present. Beyond the cap, don't hold the invocation
      // open waiting — better to fail fast and let the caller decide (e.g. surface a 503).
      const retryAfterHeader = res.headers.get('retry-after');
      if (retryAfterHeader) {
        const retryAfterMs = Math.ceil(parseFloat(retryAfterHeader) * 1000) + 250;
        if (retryAfterMs > respectRetryAfterUpToMs) {
          return { response: res, attempts: attempt + 1 };
        }
        await sleep(retryAfterMs);
        continue;
      }

      await sleep(fullJitterDelay(attempt, baseDelayMs, maxDelayMs));
    } catch (e) {
      clearTimeout(timeout);
      if (attempt === maxAttempts - 1) {
        throw new RetryExhaustedError(
          `Request failed after ${attempt + 1} attempt(s): ${(e as Error).message}`
        );
      }
      await sleep(fullJitterDelay(attempt, baseDelayMs, maxDelayMs));
    }
  }

  if (lastResponse) return { response: lastResponse, attempts: maxAttempts };
  throw new RetryExhaustedError('Retry loop exited without a response', undefined);
}
