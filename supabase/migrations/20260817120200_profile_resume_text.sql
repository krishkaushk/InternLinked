-- Persisted resume text, extracted once client-side (via pdfjs-dist, already a dependency) at
-- upload time rather than re-parsed by score-jobs on every scoring run. score-jobs reads this
-- column via the user's own RLS-scoped client — it never accepts resume text from the request
-- body, which closes off a "send arbitrary text to burn shared Groq tokens" abuse path.
--
-- resume_text_sha256 keys the job_scores cache (see 20260817120300): change your resume, scores
-- invalidate.
alter table public.profiles
  add column if not exists resume_text text,
  add column if not exists resume_text_sha256 text;
