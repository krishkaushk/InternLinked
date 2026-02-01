/**
 * Dynamic XP System for InternLinked
 */

// Define how much XP each action is worth
const XP_VALUES = {
    APPLICATION: 50,
    INTERVIEW: 150,
    RESUME_UPDATE: 25,
    BADGE_EARNED: 100,
    MATCH_SCORE_BONUS: 0.1, // 10% of match score as bonus XP
};

export function calculateUserProgress(applications, activities, badges) {
    let totalXp = 0;

    // 1. XP from Activities (The historical log)
    activities.forEach(activity => {
        totalXp += activity.xpEarned || 0;
    });

    // 2. XP from Application Status
    applications.forEach(app => {
        if (app.status === 'applied') totalXp += XP_VALUES.APPLICATION;
        if (app.status === 'interview') totalXp += XP_VALUES.INTERVIEW;

        // Bonus for high match scores
        if (app.matchScore > 80) {
            totalXp += Math.floor(app.matchScore * XP_VALUES.MATCH_SCORE_BONUS);
        }
    });

    // 3. XP from Badges
    totalXp += (badges.length * XP_VALUES.BADGE_EARNED);

    // 4. Calculate Level (Using a simple linear or quadratic curve)
    // Let's say Level 1 = 0 XP, and each level needs 500 more XP
    const xpPerLevel = 500;
    const level = Math.floor(totalXp / xpPerLevel) + 1;
    const currentLevelXp = totalXp % xpPerLevel;
    const xpToNextLevel = xpPerLevel;

    return {
        level,
        xp: currentLevelXp,
        xpToNextLevel,
        totalXp,
        progressPercentage: (currentLevelXp / xpPerLevel) * 100
    };
}