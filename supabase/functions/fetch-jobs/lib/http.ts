// Thin JSON-fetch wrapper around _shared/retry.ts's fetchWithRetry, tuned for free/unauthenticated
// upstream job-board APIs: short retry budget, short per-attempt timeout — never the full
// 4-attempt/25s Groq policy. NEVER throws — every failure mode (network error, non-ok status
// after retries exhausted, JSON parse failure) resolves to null so one flaky upstream can't take
// down the whole fan-out in pipeline.ts.
import { fetchWithRetry, RetryPolicy } from '../../_shared/retry.ts';

const JOB_BOARD_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 2,
  baseDelayMs: 500,
  maxDelayMs: 3000,
  perAttemptTimeoutMs: 8000,
};

export async function fetchJson(url: string, opts: { timeoutMs?: number } = {}): Promise<any | null> {
  const { data } = await fetchJsonWithStatus(url, opts);
  return data;
}

// Exposes the HTTP status of a fetchJson-style call when the caller needs to distinguish
// e.g. 404 (dead slug) from other failures. Same never-throws contract as fetchJson.
export async function fetchJsonWithStatus(
  url: string,
  opts: { timeoutMs?: number } = {}
): Promise<{ data: any | null; status: number | null }> {
  const policy: RetryPolicy = opts.timeoutMs
    ? { ...JOB_BOARD_RETRY_POLICY, perAttemptTimeoutMs: opts.timeoutMs }
    : JOB_BOARD_RETRY_POLICY;

  try {
    const { response } = await fetchWithRetry(url, {}, policy);
    if (!response.ok) {
      console.warn(`[fetch-jobs] fetchJsonWithStatus non-ok status ${response.status} for ${url}`);
      return { data: null, status: response.status };
    }
    try {
      return { data: await response.json(), status: response.status };
    } catch (parseErr) {
      console.warn(`[fetch-jobs] fetchJsonWithStatus JSON parse failure for ${url}: ${(parseErr as Error).message}`);
      return { data: null, status: response.status };
    }
  } catch (err) {
    console.warn(`[fetch-jobs] fetchJsonWithStatus request failure for ${url}: ${(err as Error).message}`);
    return { data: null, status: null };
  }
}
