// Ported (essentially verbatim) from src/internlinked/utils/llmScore.js — same weighted-scoring
// prompt and JSON-array response contract. The only behavioral change from the client version is
// that `descriptionMaxChars` is now a parameter (index.ts passes 500, was a hardcoded 600) and
// resumeText truncation happens in index.ts before this is called, not in here.

export interface PromptJobInput {
  id: string;
  title: string;
  companyName: string;
  location: string;
  postedDate: string | null;
  description: string;
}

export interface PromptProfileInput {
  skills?: string[] | null;
  school?: string | null;
  major?: string | null;
  location?: string | null;
}

export interface ParsedJobScore {
  matchPercentage?: unknown;
  matchedSkills?: unknown;
  missingSkills?: unknown;
  reason?: unknown;
}

// Reasoning-style models (e.g. gpt-oss) often prepend chain-of-thought text before the actual
// answer, which breaks a naive "find the first '[' and last ']'" parse if that preamble itself
// contains stray brackets — this is what was causing every batch to come back
// MODEL_OUTPUT_INVALID. index.ts deliberately does NOT set `response_format: json_object` (Groq's
// constrained-JSON decoder for this model returned json_validate_failed under token pressure), so
// the model's raw text may or may not be clean JSON — try a direct parse first (often is), and
// fall back to bracket-hunting heuristics below when it's mixed in with prose/reasoning preamble.
export function extractJSONArray(text: string): ParsedJobScore[] {
  try {
    const direct = JSON.parse(text);
    if (Array.isArray(direct)) return direct;
    if (direct && Array.isArray(direct.scores)) return direct.scores;
    if (direct && Array.isArray(direct.results)) return direct.results;
  } catch {
    // fall through to bracket-hunting below
  }

  // Fallback 1: an object wrapper mixed in with prose — find the outermost {...} instead.
  const objStart = text.indexOf('{');
  const objEnd = text.lastIndexOf('}');
  if (objStart !== -1 && objEnd !== -1) {
    try {
      const parsed = JSON.parse(text.slice(objStart, objEnd + 1));
      if (Array.isArray(parsed.scores)) return parsed.scores;
      if (Array.isArray(parsed.results)) return parsed.results;
    } catch {
      // fall through
    }
  }

  // Fallback 2: a bare array mixed in with prose.
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start !== -1 && end !== -1) {
    return JSON.parse(text.slice(start, end + 1));
  }

  throw new Error('No JSON array found in response');
}

export function buildBatchPrompt(
  jobs: PromptJobInput[],
  profile: PromptProfileInput,
  resumeText: string | null,
  descriptionMaxChars = 500
): string {
  const studentSection = resumeText
    ? `STUDENT RESUME:\n${resumeText}`
    : `STUDENT PROFILE:
- Skills: ${(profile.skills || []).join(', ') || 'Not specified'}
- School: ${profile.school || 'N/A'}
- Major: ${profile.major || 'N/A'}
- Location: ${profile.location || 'N/A'}`;

  const jobsText = jobs
    .map((job, i) => {
      const daysSincePosted = job.postedDate
        ? Math.floor((Date.now() - new Date(job.postedDate).getTime()) / (1000 * 60 * 60 * 24))
        : 30;
      return `JOB ${i}:
- Title: ${job.title}
- Company: ${job.companyName}
- Location: ${job.location}
- Posted: ${daysSincePosted} day(s) ago
- Description: ${(job.description || 'No description available').slice(0, descriptionMaxChars)}`;
    })
    .join('\n\n');

  return `You are evaluating how well a student matches ${jobs.length} job posting(s). For each job compute a score 0-100 using these exact weights:

- 40% Skill overlap: direct matches between student skills and job requirements
- 25% Semantic similarity: alignment with the role's context even without exact keyword matches
- 15% Recency: newer postings score higher (0 days = full, 30+ days = low)
- 10% Location/remote fit: remote roles score full marks
- 10% Seniority fit: penalise if it requires 2+ years of experience

${studentSection}

${jobsText}

Respond with ONLY a JSON object of this exact shape, with exactly ${jobs.length} entries in "scores", in order (one per job, no other keys, no extra text before or after):
{"scores": [{"matchPercentage": <0-100>, "matchedSkills": [<strings>], "missingSkills": [<strings>], "reason": "<one sentence>"}, ...]}`;
}
