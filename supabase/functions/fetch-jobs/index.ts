// EdgeRuntime.waitUntil is a Supabase Edge Functions (Deno Deploy) global; declare it so
// TypeScript doesn't complain, since it's not part of any stock Deno lib.
declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void };

import { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { handlePreflight } from '../_shared/cors.ts';
import { AppError, jsonError, jsonOk } from '../_shared/errors.ts';
import { requireUser } from '../_shared/auth.ts';
import { enforceUserRateLimit, RATE_LIMIT_POLICIES } from '../_shared/rateLimit.ts';
import { runPipeline } from './pipeline.ts';
import { NormalizedJob, SourceStats } from './types.ts';

const CACHE_ROW_ID = 'global';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min — single source of truth for the TTL value
const REFRESH_LOCK_MS = 2 * 60 * 1000; // 2 min — guards against a stampede of background refreshes

interface CacheRow {
  id: string;
  payload: NormalizedJob[];
  job_count: number;
  source_stats: SourceStats | null;
  fetched_at: string;
  expires_at: string;
  refreshing_until: string | null;
}

interface ResponseMeta {
  count: number;
  fetched_at: string;
  cached: boolean;
  stale: boolean;
  source_stats: SourceStats | null;
}

function buildMeta(
  row: Pick<CacheRow, 'job_count' | 'fetched_at' | 'source_stats'>,
  cached: boolean,
  stale: boolean
): ResponseMeta {
  return {
    count: row.job_count,
    fetched_at: row.fetched_at,
    cached,
    stale,
    source_stats: row.source_stats,
  };
}

async function refreshCache(
  adminClient: SupabaseClient
): Promise<{ jobs: NormalizedJob[]; meta: ResponseMeta }> {
  const { jobs, sourceStats } = await runPipeline();
  const fetchedAt = new Date();
  const expiresAt = new Date(fetchedAt.getTime() + CACHE_TTL_MS);

  const { error } = await adminClient.from('job_listings_cache').upsert({
    id: CACHE_ROW_ID,
    payload: jobs,
    job_count: jobs.length,
    source_stats: sourceStats,
    fetched_at: fetchedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    refreshing_until: null,
  });

  if (error) {
    // Don't fail the request over a caching write failure — the caller still gets fresh jobs,
    // we just lose the cache for next time. Log loudly so it's visible in function logs.
    console.error('[fetch-jobs] failed to persist cache row:', error.message);
  }

  return {
    jobs,
    meta: {
      count: jobs.length,
      fetched_at: fetchedAt.toISOString(),
      cached: false,
      stale: false,
      source_stats: sourceStats,
    },
  };
}

Deno.serve(async (req: Request) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  try {
    const { user, adminClient } = await requireUser(req);

    await enforceUserRateLimit(
      adminClient,
      user.id,
      RATE_LIMIT_POLICIES.fetchJobsUserShort,
      RATE_LIMIT_POLICIES.fetchJobsUserDaily
    );

    const { data: row, error: readError } = await adminClient
      .from('job_listings_cache')
      .select('*')
      .eq('id', CACHE_ROW_ID)
      .maybeSingle<CacheRow>();

    if (readError) {
      console.error('[fetch-jobs] failed to read cache row:', readError.message);
    }

    const now = Date.now();

    if (row) {
      const expiresAtMs = new Date(row.expires_at).getTime();

      if (expiresAtMs > now) {
        // Fresh — serve straight from cache, no upstream calls at all.
        return jsonOk({ jobs: row.payload, meta: buildMeta(row, true, false) });
      }

      // Stale — serve what we have immediately, then kick off a background refresh (unless one
      // is already in flight, per refreshing_until).
      const refreshingUntilMs = row.refreshing_until ? new Date(row.refreshing_until).getTime() : 0;
      if (refreshingUntilMs <= now) {
        const lockUntil = new Date(now + REFRESH_LOCK_MS).toISOString();
        const { error: lockError } = await adminClient
          .from('job_listings_cache')
          .update({ refreshing_until: lockUntil })
          .eq('id', CACHE_ROW_ID);

        if (lockError) {
          console.error('[fetch-jobs] failed to set refresh lock:', lockError.message);
        } else {
          EdgeRuntime.waitUntil(refreshCache(adminClient));
        }
      }

      return jsonOk({ jobs: row.payload, meta: buildMeta(row, true, true) });
    }

    // No row at all yet (first-ever call, or the table was truncated) — nothing to serve stale,
    // so refresh synchronously and return the result directly.
    const { jobs, meta } = await refreshCache(adminClient);
    return jsonOk({ jobs, meta });
  } catch (err) {
    if (err instanceof AppError) {
      return jsonError(err);
    }
    console.error('[fetch-jobs] unhandled error:', (err as Error)?.message ?? err);
    return jsonError(err as Error);
  }
});
