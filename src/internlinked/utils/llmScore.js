const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

async function fetchResumeBase64(resumeUrl) {
    try {
        const res = await fetch(resumeUrl);
        if (!res.ok) return null;
        const blob = await res.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]); // strip data:...;base64,
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

function buildParts(job, profile, resumeBase64) {
    const daysSincePosted = job.postedDate
        ? Math.floor((Date.now() - new Date(job.postedDate).getTime()) / (1000 * 60 * 60 * 24))
        : 30;

    const jobText = `You are evaluating how well a student matches a job posting. Compute a score 0-100 using these exact weights:

- 40% Skill overlap: direct matches between student skills and job requirements
- 25% Semantic similarity: how well the student's overall background, projects, and experience align with the role's context, even without exact keyword matches
- 15% Recency: the job was posted ${daysSincePosted} day(s) ago — newer postings score higher (0 days = full score, 30+ days = low score)
- 10% Location/remote fit: student location vs job location; remote roles score full marks
- 10% Seniority fit: is this role genuinely intern/entry-level? penalise if it requires 2+ years of experience

${resumeBase64 ? "The student's resume is attached as a PDF above." : `STUDENT PROFILE:
- Skills: ${(profile.skills || []).join(', ')}
- School: ${profile.school || 'N/A'}
- Major: ${profile.major || 'N/A'}
- Location: ${profile.location || 'N/A'}`}

JOB:
- Title: ${job.title}
- Company: ${job.companyName}
- Location: ${job.location}
- Posted: ${daysSincePosted} day(s) ago
- Description: ${job.description.slice(0, 1500)}

Respond with ONLY valid JSON, no markdown:
{
  "matchPercentage": <number 0-100>,
  "matchedSkills": [<skills/experiences relevant to this job>],
  "missingSkills": [<important skills the job wants that the student lacks>],
  "reason": "<one sentence explanation of the score>"
}`;

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

        if (!res.ok) return { ...job, matchPercentage: 0, matchedSkills: [], missingSkills: [], reason: '' };

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

        return {
            ...job,
            matchPercentage: Math.min(100, Math.max(0, parsed.matchPercentage ?? 0)),
            matchedSkills: parsed.matchedSkills ?? [],
            missingSkills: parsed.missingSkills ?? [],
            reason: parsed.reason ?? '',
        };
    } catch {
        return { ...job, matchPercentage: 0, matchedSkills: [], missingSkills: [] };
    }
}

export async function scoreJobs(jobs, profile) {
    // Fetch resume once and reuse for all jobs
    const resumeBase64 = profile.resume_url
        ? await fetchResumeBase64(profile.resume_url)
        : null;

    // Score in batches of 5 to respect Gemini's 15 RPM free tier
    const results = [];
    for (let i = 0; i < jobs.length; i += 5) {
        const batch = jobs.slice(i, i + 5);
        const scored = await Promise.all(batch.map(job => scoreJob(job, profile, resumeBase64)));
        results.push(...scored.filter(Boolean));
        if (i + 5 < jobs.length) await new Promise(r => setTimeout(r, 4000));
    }
    return results.sort((a, b) => b.matchPercentage - a.matchPercentage);
}
