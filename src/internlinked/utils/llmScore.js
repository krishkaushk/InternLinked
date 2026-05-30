import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const BATCH_SIZE = 5;

async function extractPdfText(resumeUrl) {
    try {
        const res = await fetch(resumeUrl);
        if (!res.ok) return null;
        const arrayBuffer = await res.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pages = await Promise.all(
            Array.from({ length: pdf.numPages }, (_, i) =>
                pdf.getPage(i + 1).then(p => p.getTextContent()).then(tc =>
                    tc.items.map(item => item.str).join(' ')
                )
            )
        );
        const text = pages.join('\n').trim();
        return text.length > 100 ? text.slice(0, 4000) : null;
    } catch (e) {
        console.warn('[LLM] PDF text extraction failed:', e.message);
        return null;
    }
}

function extractJSONArray(text) {
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start === -1 || end === -1) throw new Error('No JSON array found in response');
    return JSON.parse(text.slice(start, end + 1));
}

function buildBatchPrompt(jobs, profile, resumeText) {
    const studentSection = resumeText
        ? `STUDENT RESUME:\n${resumeText}`
        : `STUDENT PROFILE:
- Skills: ${(profile.skills || []).join(', ') || 'Not specified'}
- School: ${profile.school || 'N/A'}
- Major: ${profile.major || 'N/A'}
- Location: ${profile.location || 'N/A'}`;

    const jobsText = jobs.map((job, i) => {
        const daysSincePosted = job.postedDate
            ? Math.floor((Date.now() - new Date(job.postedDate).getTime()) / (1000 * 60 * 60 * 24))
            : 30;
        return `JOB ${i}:
- Title: ${job.title}
- Company: ${job.companyName}
- Location: ${job.location}
- Posted: ${daysSincePosted} day(s) ago
- Description: ${(job.description || 'No description available').slice(0, 600)}`;
    }).join('\n\n');

    return `You are evaluating how well a student matches ${jobs.length} job posting(s). For each job compute a score 0-100 using these exact weights:

- 40% Skill overlap: direct matches between student skills and job requirements
- 25% Semantic similarity: alignment with the role's context even without exact keyword matches
- 15% Recency: newer postings score higher (0 days = full, 30+ days = low)
- 10% Location/remote fit: remote roles score full marks
- 10% Seniority fit: penalise if it requires 2+ years of experience

${studentSection}

${jobsText}

Respond with ONLY a valid JSON array with exactly ${jobs.length} objects in order (one per job):
[{"matchPercentage": <0-100>, "matchedSkills": [<strings>], "missingSkills": [<strings>], "reason": "<one sentence>"}, ...]`;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function scoreBatch(jobs, profile, resumeText, retrying = false) {
    try {
        const res = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: [{ role: 'user', content: buildBatchPrompt(jobs, profile, resumeText) }],
                temperature: 0.1,
                max_tokens: 150 * jobs.length,
            }),
        });

        if (res.status === 429 && !retrying) {
            const retryAfter = parseFloat(res.headers.get('retry-after') || '10');
            console.warn(`[Groq] Rate limited, retrying in ${retryAfter}s`);
            await sleep(Math.ceil(retryAfter * 1000) + 500);
            return scoreBatch(jobs, profile, resumeText, true);
        }

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.error(`[Groq] ${res.status}:`, err?.error?.message || res.statusText);
            return jobs.map(job => ({ ...job, matchPercentage: 0, matchedSkills: [], missingSkills: [], reason: '' }));
        }

        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || '';
        const parsed = extractJSONArray(text);

        return jobs.map((job, i) => {
            const r = parsed[i] ?? {};
            return {
                ...job,
                matchPercentage: Math.min(100, Math.max(0, Number(r.matchPercentage) || 0)),
                matchedSkills: r.matchedSkills ?? [],
                missingSkills: r.missingSkills ?? [],
                reason: r.reason ?? '',
            };
        });
    } catch (e) {
        console.error(`[Groq] Batch failed:`, e.message);
        return jobs.map(job => ({ ...job, matchPercentage: 0, matchedSkills: [], missingSkills: [], reason: '' }));
    }
}

export async function scoreJobs(jobs, profile) {
    const resumeText = profile.resume_url ? await extractPdfText(profile.resume_url) : null;
    console.log(`[LLM] Scoring ${jobs.length} jobs in batches of ${BATCH_SIZE} with Groq. Resume: ${resumeText ? 'extracted' : 'not found — using profile only'}`);

    const results = [];
    for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
        const batch = jobs.slice(i, i + BATCH_SIZE);
        const scored = await scoreBatch(batch, profile, resumeText);
        results.push(...scored);
        console.log(`[LLM] Scored ${Math.min(i + BATCH_SIZE, jobs.length)}/${jobs.length}`);
        if (i + BATCH_SIZE < jobs.length) await sleep(8000);
    }
    return results.sort((a, b) => b.matchPercentage - a.matchPercentage);
}
