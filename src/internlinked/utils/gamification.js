/**
 * Dynamic XP System for InternLinked
 */

// Define how much XP each action is worth
const XP_VALUES = {
    APPLICATION: 50,
    INTERVIEW: 150,
    RESUME_UPDATE: 25,
    BADGE_EARNED: 100,
    MATCH_SCORE_BONUS: 0.1,
};

export function calculateUserProgress(applications = [], activities = [], badges = []) {
    let totalXp = 0;

    activities.forEach(activity => {
        totalXp += activity.xpEarned || 0;
    });

    applications.forEach(app => {
        if (app.status === 'applied') totalXp += XP_VALUES.APPLICATION;
        if (app.status === 'interview') totalXp += XP_VALUES.INTERVIEW;

        if (app.matchScore > 80) {
            totalXp += Math.floor(app.matchScore * XP_VALUES.MATCH_SCORE_BONUS);
        }
    });

    totalXp += (badges.length * XP_VALUES.BADGE_EARNED);

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
} // <--- Ensure this brace is closed before starting the next export

export function calculateNewStreak(lastActivityDateStr, currentStreak) {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = lastActivityDateStr ? new Date(lastActivityDateStr).toISOString().split('T')[0] : null;

    if (!lastDate) return 1;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastDate === today) {
        return currentStreak;
    } else if (lastDate === yesterdayStr) {
        return currentStreak + 1;
    } else {
        return 1;
    }
}