export function computeMatch(userSkills, description = '') {
    const skillList = (userSkills ?? []).filter(s => typeof s === 'string' && s.trim().length > 0);
    if (!skillList.length) return { matchPercentage: 0, matchedSkills: [], missingSkills: [] };

    const corpus = description.toLowerCase();

    const matchedSkills = [];
    const missingSkills = [];

    for (const skill of skillList) {
        if (corpus.includes(skill.toLowerCase())) {
            matchedSkills.push(skill);
        } else {
            missingSkills.push(skill);
        }
    }

    const matchPercentage = Math.round((matchedSkills.length / skillList.length) * 100);

    return { matchPercentage, matchedSkills, missingSkills };
}

// Ported from supabase/functions/fetch-jobs/lib/normalize.ts's normalizeCompany — same grouping
// key so "Stripe" and "Stripe Inc." collapse for the diversity cap below, but this file can't
// import that Deno module directly (browser bundle vs. edge runtime).
const LEGAL_SUFFIX_RE = /\s+(inc|l l c|llc|ltd|corp|corporation|plc|gmbh|co)$/i;

function normalizeCompanyName(name) {
    let s = (name ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '');
    s = s.toLowerCase();
    s = s.replace(/[^\w\s]/g, ' ');
    s = s.replace(/\s+/g, ' ').trim();
    s = s.replace(LEGAL_SUFFIX_RE, '');
    return s.trim();
}

// Selects up to `limit` entries from `rankedEntries` (already sorted best-first), capping any
// one company at `cap` entries so a high-volume poster can't fill the whole set. If honoring the
// cap would leave fewer than `limit` entries (not enough other companies to fill the remaining
// slots), backfills from the capped-out leftovers — in the same rank order — rather than
// returning a shorter list. Each entry must have a `job.companyName`.
export function selectDiverse(rankedEntries, cap, limit) {
    const counts = new Map();
    const primary = [];
    const leftover = [];

    for (const entry of rankedEntries) {
        if (primary.length >= limit) break;
        const key = normalizeCompanyName(entry.job.companyName);
        const count = counts.get(key) || 0;
        if (count < cap) {
            counts.set(key, count + 1);
            primary.push(entry);
        } else {
            leftover.push(entry);
        }
    }

    for (const entry of leftover) {
        if (primary.length >= limit) break;
        primary.push(entry);
    }

    return primary;
}
