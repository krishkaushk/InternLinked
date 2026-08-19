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

// A browser-like User-Agent measurably improves success odds fetching arbitrary career-page
// HTML (confirmed empirically: several ATS/custom career pages return different content, or
// reject the request outright, for Deno's default UA) — never used for the JSON API sources
// above, which don't care about UA.
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

// Fetches raw response text (HTML) rather than parsing as JSON — for generic career-page
// scraping (see lib/jsonLd.ts) where the response isn't a JSON API. Same never-throws contract.
export async function fetchTextWithStatus(
  url: string,
  opts: { timeoutMs?: number } = {}
): Promise<{ text: string | null; status: number | null }> {
  const policy: RetryPolicy = opts.timeoutMs
    ? { ...JOB_BOARD_RETRY_POLICY, perAttemptTimeoutMs: opts.timeoutMs }
    : JOB_BOARD_RETRY_POLICY;

  try {
    const { response } = await fetchWithRetry(url, { headers: { 'User-Agent': BROWSER_USER_AGENT } }, policy);
    if (!response.ok) {
      console.warn(`[fetch-jobs] fetchTextWithStatus non-ok status ${response.status} for ${url}`);
      return { text: null, status: response.status };
    }
    try {
      return { text: await response.text(), status: response.status };
    } catch (readErr) {
      console.warn(`[fetch-jobs] fetchTextWithStatus body read failure for ${url}: ${(readErr as Error).message}`);
      return { text: null, status: response.status };
    }
  } catch (err) {
    console.warn(`[fetch-jobs] fetchTextWithStatus request failure for ${url}: ${(err as Error).message}`);
    return { text: null, status: null };
  }
}
