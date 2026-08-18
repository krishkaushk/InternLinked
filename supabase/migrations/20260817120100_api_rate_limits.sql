-- Fixed-window rate-limit counters shared by score-jobs and fetch-jobs. Fixed windows (one row
-- per subject/endpoint/window) are chosen over sliding windows because they need a single
-- atomic upsert per check rather than per-request rows plus a cleanup job — for abuse
-- prevention (as opposed to strict fairness), the boundary-burst weakness of fixed windows is
-- immaterial.
--
-- This table counts BOTH requests and tokens: the Groq constraint is tokens-per-minute, and a
-- request-count cap alone cannot protect a shared token budget.

create table public.api_rate_limits (
  subject         text        not null,   -- a user's uuid as text, or the literal 'GLOBAL'
  endpoint        text        not null,   -- 'score-jobs' | 'fetch-jobs' | 'score-jobs:tokens'
  window_seconds  integer     not null,
  window_start    timestamptz not null,
  request_count   integer     not null default 0,
  token_count     bigint      not null default 0,
  updated_at      timestamptz not null default now(),
  primary key (subject, endpoint, window_seconds, window_start)
);

create index api_rate_limits_sweep_idx on public.api_rate_limits (window_start);

-- Edge Functions only, via the service-role key (which bypasses RLS by design). Enabling RLS
-- with zero policies is belt-and-suspenders on top of the revoke: a `grant` added later by some
-- future tooling change won't silently re-open client access the way it could without RLS.
alter table public.api_rate_limits enable row level security;
revoke all on table public.api_rate_limits from anon, authenticated;

create or replace function public.consume_rate_limit(
  p_subject        text,
  p_endpoint       text,
  p_window_seconds integer,
  p_max_requests   integer,
  p_max_tokens     bigint  default null,
  p_tokens         bigint  default 0
) returns table (allowed boolean, requests_used integer, tokens_used bigint, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_window_start timestamptz;
  v_requests integer;
  v_tokens bigint;
begin
  v_window_start := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / p_window_seconds) * p_window_seconds
  );

  -- Single atomic INSERT ... ON CONFLICT ... RETURNING: takes the row lock implicitly, no
  -- read-then-write race. A rejected request still increments the counter — intentional, it
  -- closes the window where a client could keep probing the boundary via failed retries for
  -- free. Do not "fix" this later without re-reading this comment.
  insert into public.api_rate_limits as t
    (subject, endpoint, window_seconds, window_start, request_count, token_count)
  values (p_subject, p_endpoint, p_window_seconds, v_window_start, 1, p_tokens)
  on conflict (subject, endpoint, window_seconds, window_start) do update
    set request_count = t.request_count + 1,
        token_count   = t.token_count + p_tokens,
        updated_at    = now()
  returning t.request_count, t.token_count into v_requests, v_tokens;

  return query select
    (v_requests <= p_max_requests
       and (p_max_tokens is null or v_tokens <= p_max_tokens)),
    v_requests,
    v_tokens,
    greatest(1, ceil(extract(epoch from (v_window_start
       + make_interval(secs => p_window_seconds)) - clock_timestamp()))::integer);
end;
$$;

revoke all on function public.consume_rate_limit(text,text,integer,integer,bigint,bigint)
  from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text,text,integer,integer,bigint,bigint)
  to service_role;

-- Cleanup so this table doesn't grow unboundedly. Requires pg_cron to be enabled on the
-- project (Database -> Extensions in the dashboard). If pg_cron isn't available, delete old
-- rows opportunistically from within the Edge Function instead (e.g. on ~1% of invocations).
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'api-rate-limits-sweep',
      '17 * * * *',
      $sql$delete from public.api_rate_limits where window_start < now() - interval '3 days'$sql$
    );
  end if;
end;
$$;
