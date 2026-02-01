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

// utils/gamification.js
export const calculateUserProgress = (applications = []) => {
    const XP_PER_APP = 50;
    const totalXp = applications.length * XP_PER_APP;

    // Each level requires 100 XP
    const level = Math.floor(totalXp / 100) + 1;

    // This is the fix: only show the REMAINDER of XP for the bar
    const xpIntoLevel = totalXp % 100;
    const nextLevelThreshold = 100;

    return {
        level,
        xp: totalXp,             // Total lifetime XP
        xpIntoLevel,          // This goes to the progress bar width
        nextLevelXp: nextLevelThreshold,
        totalApplications: applications.length
    };
};

const calculateStreak = (lastActivityDate, currentStreak = 0) => {
    if (!lastActivityDate) return 1;

    const lastDate = new Date(lastActivityDate).setHours(0, 0, 0, 0);
    const today = new Date().setHours(0, 0, 0, 0);
    const diffTime = Math.abs(today - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return currentStreak + 1; // Increment if consecutive day
    if (diffDays === 0) return currentStreak;     // Keep same if multiple apps today
    return 1;                                     // Reset to 1 if gap is > 1 day
};


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