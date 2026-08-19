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
