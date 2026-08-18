-- Fixes a real bug found in production logs: checkGlobalTokenBudget/reconcileTokenUsage call
-- consume_rate_limit without a request-count cap (they only care about the token cap) — the
-- TS wrapper previously defaulted the missing p_max_requests to Number.MAX_SAFE_INTEGER
-- (9007199254740991) as a "no limit" sentinel, which overflows the `integer` parameter type
-- (max ~2.1 billion) and made the RPC error on every call of that shape. It failed open (an
-- RPC error was treated as "allowed"), so this didn't hard-block scoring, but it meant the
-- global Groq token-budget safety net was silently never actually functioning.
--
-- Fix: p_max_requests is now nullable, and null means "no request-count limit" — the request
-- side of the check is skipped entirely rather than compared against an overflowing sentinel.
create or replace function public.consume_rate_limit(
  p_subject        text,
  p_endpoint       text,
  p_window_seconds integer,
  p_max_requests   integer default null,
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

  insert into public.api_rate_limits as t
    (subject, endpoint, window_seconds, window_start, request_count, token_count)
  values (p_subject, p_endpoint, p_window_seconds, v_window_start, 1, p_tokens)
  on conflict (subject, endpoint, window_seconds, window_start) do update
    set request_count = t.request_count + 1,
        token_count   = t.token_count + p_tokens,
        updated_at    = now()
  returning t.request_count, t.token_count into v_requests, v_tokens;

  return query select
    ((p_max_requests is null or v_requests <= p_max_requests)
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
