-- Reconciled against the live schema/policy dump obtained 2026-08-17 (via the Supabase
-- dashboard / SQL editor) and confirmed live with the two queries below, not guessed at:
--
--   select relname, relrowsecurity from pg_class
--     where relnamespace = 'public'::regnamespace and relkind = 'r'
--     and relname in ('activities','education','experience');
--   -- -> relrowsecurity = true for all three
--   select schemaname, tablename, policyname, cmd from pg_policies
--     where schemaname = 'public' and tablename in ('activities','education','experience');
--   -- -> zero rows: RLS is ON but with NO policies on any of the three
--
-- Findings:
--
--   * profiles, applications, files ALREADY have working owner-scoped RLS policies
--     (auth.uid() = id / auth.uid() = user_id, covering select/insert/update/delete).
--     No changes needed there — adding more policies would just be redundant duplicates
--     of existing, working coverage.
--   * activities has RLS enabled but ZERO policies — i.e. deny-all, for everyone,
--     including the owning user. This means every insert into activities (XP awards,
--     "Applied to X" logs) has almost certainly been silently failing, and every read
--     has been silently returning an empty array — InternLinkedApp.jsx swallows a
--     failed insert (`if (!logErr && newLog)`) and an RLS-blocked SELECT just returns
--     zero rows rather than erroring, so the gamification/activity feed has likely
--     never actually worked, with no visible error anywhere. This migration's four
--     policies below fix that by granting the owner real access.
--   * education and experience tables exist (confirmed via the schema dump) but are
--     referenced by no client code, and are ALSO RLS-enabled with zero policies —
--     already correctly deny-all. The statements below for these two tables are
--     no-ops confirming that state, not a change in behavior.

-- ---------------------------------------------------------------------------
-- activities (owner column = user_id, NOT NULL per the schema dump — no default needed)
-- ---------------------------------------------------------------------------
alter table public.activities enable row level security;
revoke all on table public.activities from anon;

create policy "activities_select_own" on public.activities
  for select to authenticated using (auth.uid() = user_id);

create policy "activities_insert_own" on public.activities
  for insert to authenticated with check (auth.uid() = user_id);

create policy "activities_update_own" on public.activities
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "activities_delete_own" on public.activities
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- education / experience — unreferenced by any client code found in the repo. Deny-all
-- (RLS enabled, zero policies) is the correct default for tables nothing uses: it closes
-- them off without breaking anything, since nothing reads or writes them today. If a
-- future feature needs these tables, add owner-scoped policies matching the
-- activities/applications pattern above at that point.
-- ---------------------------------------------------------------------------
alter table public.education enable row level security;
revoke all on table public.education from anon, authenticated;

alter table public.experience enable row level security;
revoke all on table public.experience from anon, authenticated;
