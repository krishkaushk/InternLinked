-- Per-user cache of Groq scoring results, keyed by job + resume version. Without this, every
-- fresh tab/reload re-pays the full Groq token cost for jobs that haven't changed since the
-- last run — this is what keeps steady-state cost sane once job-fetch scope expands well beyond
-- the ~40 jobs/day this was originally tuned around.
create table public.job_scores (
  user_id          uuid        not null references auth.users(id) on delete cascade,
  job_id           text        not null,
  resume_sha256    text,
  match_percentage smallint    not null,
  matched_skills   jsonb       not null default '[]'::jsonb,
  missing_skills   jsonb       not null default '[]'::jsonb,
  reason           text,
  model            text        not null,
  scored_at        timestamptz not null default now(),
  primary key (user_id, job_id)
);

alter table public.job_scores enable row level security;
revoke all on table public.job_scores from anon;

create policy "job_scores_select_own" on public.job_scores
  for select to authenticated using (auth.uid() = user_id);

-- Writes are service_role only, from score-jobs — no insert/update policy for clients.
