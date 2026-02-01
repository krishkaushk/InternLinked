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

    // Scale up base gains
    const XP_VALUES = {
        APPLICATION: 150, // Increased from 50
        INTERVIEW: 400,   // Increased from 150
        BADGE: 200
    };

    applications.forEach(app => {
        if (app.status === 'applied') totalXp += XP_VALUES.APPLICATION;
        if (app.status === 'interview') totalXp += XP_VALUES.INTERVIEW;
    });

    // Starting XP at 0: If no applications, totalXp remains 0
    let level = 1;
    let xpForCurrentLevel = 0;

    // Exponential scaling: Level 2 needs ~700 total, Level 3 needs ~1800 total
    const getThreshold = (lvl) => Math.floor(500 * Math.pow(lvl, 1.5));

    while (totalXp >= getThreshold(level)) {
        level++;
    }

    const currentThreshold = getThreshold(level - 1);
    const nextThreshold = getThreshold(level);
    xpForCurrentLevel = totalXp - currentThreshold;
    const xpRequiredForNext = nextThreshold - currentThreshold;

    return {
        level,
        xp: xpForCurrentLevel,
        xpToNextLevel: xpRequiredForNext,
        progressPercentage: (xpForCurrentLevel / xpRequiredForNext) * 100
    };
}

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