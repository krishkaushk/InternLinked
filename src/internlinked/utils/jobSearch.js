import { GREENHOUSE_COMPANIES, LEVER_COMPANIES } from './companySources';

const isInternRole = (title = '') => {
    const t = title.toLowerCase();
    return /\bintern\b/.test(t) ||   // "intern" as a whole word — excludes "internal"
           t.includes('internship') ||
           t.includes('co-op') ||
           t.includes('co op') ||
           t.includes('coop');
};

// Fetch job list without content (fast), filter intern roles, then fetch descriptions
async function fetchGreenhouseCompany(company) {
    try {
        const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${company}/jobs`);
        if (!res.ok) { console.warn(`[GH] ${company}: ${res.status}`); return []; }
        const data = await res.json();
        const intern = (data.jobs || []).filter(j => isInternRole(j.title));
        if (intern.length) console.log(`[GH] ${company}: ${intern.length} intern roles`);
        return intern.map(j => ({
            id: `gh-${j.id}`,
            _ghId: j.id,
            _company: company,
            companyName: j.company_name || company,
            title: j.title,
            location: j.location?.name || 'Remote',
            type: 'internship',
            postedDate: j.updated_at ? new Date(j.updated_at) : new Date(),
            description: '',
            requirements: [],
            jobUrl: j.absolute_url || '',
            source: 'greenhouse',
            saved: false,
        }));
    } catch (e) {
        console.error(`[GH] ${company} failed:`, e.message);
        return [];
    }
}

async function fetchLeverCompany(company) {
    try {
        const res = await fetch(`https://api.lever.co/v0/postings/${company}?mode=json`);
        if (!res.ok) return [];
        const data = await res.json();
        if (!Array.isArray(data)) return [];
        return data
            .filter(j => isInternRole(j.text))
            .map(j => ({
                id: `lv-${j.id}`,
                companyName: j.company || company,
                title: j.text,
                location: j.categories?.location || j.categories?.allLocations?.[0] || 'Remote',
                type: 'internship',
                postedDate: j.createdAt ? new Date(j.createdAt) : new Date(),
                description: [j.descriptionPlain, ...(j.lists || []).map(l => l.content)].join('\n'),
                requirements: j.lists?.find(l =>
                    l.text?.toLowerCase().includes('require') ||
                    l.text?.toLowerCase().includes('qualif')
                )?.content?.split('<') || [],
                jobUrl: j.hostedUrl || j.absoluteUrl || '',
                source: 'lever',
                saved: false,
            }));
    } catch {
        return [];
    }
}

// Fetch full description for a Greenhouse job
async function fetchGreenhouseDescription(job) {
    try {
        const res = await fetch(
            `https://boards-api.greenhouse.io/v1/boards/${job._company}/jobs/${job._ghId}`
        );
        if (!res.ok) return job;
        const data = await res.json();
        return { ...job, description: data.content || '' };
    } catch {
        return job;
    }
}

export async function fetchJobs() {
    // Step 1: fast parallel fetch of job lists — no content payload
    const [ghResults, lvResults] = await Promise.all([
        Promise.all(GREENHOUSE_COMPANIES.map(fetchGreenhouseCompany)),
        Promise.all(LEVER_COMPANIES.map(fetchLeverCompany)),
    ]);

    const internJobs = [
        ...ghResults.flat(),
        ...lvResults.flat(),
    ].sort((a, b) => b.postedDate - a.postedDate).slice(0, 40);

    console.log(`[JobSearch] Found ${internJobs.length} intern/co-op roles`);

    if (internJobs.length === 0) return [];

    // Step 2: fetch descriptions only for Greenhouse jobs we're actually scoring
    const ghJobs = internJobs.filter(j => j.source === 'greenhouse');
    const lvJobs = internJobs.filter(j => j.source === 'lever');

    const ghWithDesc = await Promise.all(ghJobs.map(fetchGreenhouseDescription));

    return [...ghWithDesc, ...lvJobs].sort((a, b) => b.postedDate - a.postedDate);
}
