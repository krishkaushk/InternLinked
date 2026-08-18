-- Single-row snapshot cache for fetch-jobs. Job fetching/dedup is 100% user-independent (only
-- scoring is per-user), so it's a shared cache, not per-user. Without it, every /jobs page load
-- across every user independently re-hits ~90-120 upstream requests (Greenhouse/Lever/Ashby/
-- SmartRecruiters boards + curated GitHub repo downloads) — costly, slow, and a good way to get
-- rate-limited or IP-blocked by the free upstream APIs.
create table public.job_listings_cache (
  id               text        primary key default 'global',
  payload          jsonb       not null,
  job_count        int         not null,
  source_stats     jsonb,                 -- per-source/per-company outcomes: ok/404/zero_total/zero_intern/timeout
  fetched_at       timestamptz not null default now(),
  expires_at       timestamptz not null,
  refreshing_until timestamptz            -- guards against a stampede of concurrent background refreshes
);

alter table public.job_listings_cache enable row level security;
revoke all on table public.job_listings_cache from anon, authenticated;
-- No policies: service_role (fetch-jobs) only.
