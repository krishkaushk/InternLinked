export function computeMatch(userSkills, qualifications = [], description = '') {
    if (!userSkills?.length) return { matchPercentage: 0, matchedSkills: [], missingSkills: [] };

    const corpus = [...qualifications, description].join(' ').toLowerCase();

    const matchedSkills = [];
    const missingSkills = [];

    for (const skill of userSkills) {
        if (corpus.includes(skill.toLowerCase())) {
            matchedSkills.push(skill);
        } else {
            missingSkills.push(skill);
        }
    }

    const matchPercentage = Math.round((matchedSkills.length / userSkills.length) * 100);

    return { matchPercentage, matchedSkills, missingSkills };
}
