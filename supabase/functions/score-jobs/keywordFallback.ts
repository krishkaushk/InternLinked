// Degraded-mode scorer used when the global Groq token budget is exhausted (checkGlobalTokenBudget
// returns withinBudget: false). Mirrors the spirit of the client's matchScore.js keyword-overlap
// logic without importing client code into a Deno function: count how many of the student's
// skills appear (case-insensitive substring match) in the job description.

export interface KeywordScoreResult {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export function keywordScore(
  skills: string[] | null | undefined,
  description: string | null | undefined
): KeywordScoreResult {
  const skillList = (skills ?? []).filter(
    (s): s is string => typeof s === 'string' && s.trim().length > 0
  );

  if (skillList.length === 0) {
    return { matchPercentage: 0, matchedSkills: [], missingSkills: [] };
  }

  const descLower = (description ?? '').toLowerCase();
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of skillList) {
    if (descLower.includes(skill.toLowerCase())) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  const matchPercentage = Math.round((matchedSkills.length / skillList.length) * 100);
  return { matchPercentage, matchedSkills, missingSkills };
}
