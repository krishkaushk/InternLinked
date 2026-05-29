const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

async function fetchResumeBase64(resumeUrl) {
    try {
        const res = await fetch(resumeUrl);
        if (!res.ok) return null;
        const blob = await res.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

// Robustly extract JSON from Gemini response — handles markdown fences and extra text
function extractJSON(text) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON object found in response');
    return JSON.parse(text.slice(start, end + 1));
}

function buildParts(job, profile, resumeBase64) {
    const daysSincePosted = job.postedDate
        ? Math.floor((Date.now() - new Date(job.postedDate).getTime()) / (1000 * 60 * 60 * 24))
        : 30;

    const description = (job.description || '').slice(0, 1500);

    const jobText = `You are evaluating how well a student matches a job posting. Compute a score 0-100 using these exact weights:

- 40% Skill overlap: direct matches between student skills and job requirements
- 25% Semantic similarity: how well the student's overall background, projects, and experience align with the role's context, even without exact keyword matches
- 15% Recency: the job was posted ${daysSincePosted} day(s) ago — newer postings score higher (0 days = full score, 30+ days = low score)
- 10% Location/remote fit: student location vs job location; remote roles score full marks
- 10% Seniority fit: is this role genuinely intern/entry-level? penalise if it requires 2+ years of experience

${resumeBase64 ? "The student's resume is attached as a PDF above." : `STUDENT PROFILE:
- Skills: ${(profile.skills || []).join(', ') || 'Not specified'}
- School: ${profile.school || 'N/A'}
- Major: ${profile.major || 'N/A'}
- Location: ${profile.location || 'N/A'}`}

JOB:
- Title: ${job.title}
- Company: ${job.companyName}
- Location: ${job.location}
- Posted: ${daysSincePosted} day(s) ago
- Description: ${description || 'No description available'}

Respond with ONLY a valid JSON object, nothing else:
{"matchPercentage": <number 0-100>, "matchedSkills": [<strings>], "missingSkills": [<strings>], "reason": "<one sentence>"}`;

    if (resumeBase64) {
        return [
            { inlineData: { mimeType: 'application/pdf', data: resumeBase64 } },
            { text: jobText },
        ];
    }
    return [{ text: jobText }];
}

async function scoreJob(job, profile, resumeBase64) {
    try {
        const res = await fetch(
            `${GEMINI_URL}?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: buildParts(job, profile, resumeBase64) }],
                    generationConfig: { temperature: 0.1, maxOutputTokens: 300 },
                }),
            }
        );

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.error(`[Gemini] ${res.status} for "${job.title}":`, err?.error?.message || res.statusText);
            return { ...job, matchPercentage: 0, matchedSkills: [], missingSkills: [], reason: '' };
        }

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        const parsed = extractJSON(text);

        return {
            ...job,
            matchPercentage: Math.min(100, Math.max(0, Number(parsed.matchPercentage) || 0)),
            matchedSkills: parsed.matchedSkills ?? [],
            missingSkills: parsed.missingSkills ?? [],
            reason: parsed.reason ?? '',
        };
    } catch (e) {
        console.error(`[Gemini] Failed scoring "${job.title}":`, e.message);
        return { ...job, matchPercentage: 0, matchedSkills: [], missingSkills: [], reason: '' };
    }
}

export async function scoreJobs(jobs, profile) {
    const resumeBase64 = profile.resume_url
        ? await fetchResumeBase64(profile.resume_url)
        : null;

    console.log(`[LLM] Scoring ${jobs.length} jobs. Resume: ${resumeBase64 ? 'attached' : 'not found — using skills only'}`);

    const results = [];
    for (let i = 0; i < jobs.length; i += 5) {
        const batch = jobs.slice(i, i + 5);
        const scored = await Promise.all(batch.map(job => scoreJob(job, profile, resumeBase64)));
        results.push(...scored.filter(Boolean));
        console.log(`[LLM] Scored ${Math.min(i + 5, jobs.length)}/${jobs.length}`);
        if (i + 5 < jobs.length) await new Promise(r => setTimeout(r, 4000));
    }
    return results.sort((a, b) => b.matchPercentage - a.matchPercentage);
}
