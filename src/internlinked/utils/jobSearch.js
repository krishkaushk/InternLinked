import { supabase } from './supabase';

// Job fetching now happens server-side (supabase/functions/fetch-jobs) — Greenhouse, Lever,
// Ashby, SmartRecruiters, and curated GitHub internship lists are all fanned out, deduped, and
// cached there. This keeps the same exported signature so callers (InternLinkedApp.jsx) need no
// changes: fetchJobs() still resolves to a plain array of job objects.
export async function fetchJobs() {
    const { data, error } = await supabase.functions.invoke('fetch-jobs');
    if (error) throw error;
    // postedDate arrives as an ISO string (or null) from the function — every consumer already
    // does `new Date(job.postedDate)` defensively, so no conversion is needed here.
    return data?.jobs ?? [];
}
