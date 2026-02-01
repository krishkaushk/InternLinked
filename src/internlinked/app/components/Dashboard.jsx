import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { Trophy, TrendingUp, Target, Calendar, Flame, Award } from 'lucide-react';
import { format, subDays, isSameDay } from 'date-fns';

// Removed: import { UserStats, Activity } from '@/types';
// Removed: interface DashboardProps

export function Dashboard({ userStats, activities, activityCalendar }) {
    const recentActivities = activities.slice(0, 10);

    // Generate calendar grid (last 52 weeks)
    const generateCalendarGrid = () => {
        const weeks = [];
        const today = new Date();

        for (let week = 51; week >= 0; week--) {
            const weekDays = [];
            for (let day = 6; day >= 0; day--) {
                const date = subDays(today, week * 7 + day);
                weekDays.push(date);
            }
            weeks.push(weekDays.reverse());
        }

        return weeks;
    };

    const getActivityLevel = (count) => {
        if (count === 0) return 'bg-gray-100';
        if (count === 1) return 'bg-green-200';
        if (count === 2) return 'bg-green-400';
        if (count === 3) return 'bg-green-600';
        return 'bg-green-800';
    };

    const calendarWeeks = generateCalendarGrid();

    const activityTypeIcons = {
        application: '📝',
        resume_update: '📄',
        profile_update: '👤',
        interview: '💼',
        company_follow: '🏢',
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Track your progress and stay motivated</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Level</p>
                            <p className="text-3xl font-bold text-purple-600">{userStats.level}</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Trophy className="size-8 text-purple-600" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <Progress value={(userStats.xp / userStats.xpToNextLevel) * 100} />
                        <p className="text-xs text-gray-500 mt-1">
                            {userStats.xp} / {userStats.xpToNextLevel} XP
                        </p>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Current Streak</p>
                            <p className="text-3xl font-bold text-orange-600">{userStats.currentStreak}</p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <Flame className="size-8 text-orange-600" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                        Longest streak: {userStats.longestStreak} days
                    </p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Applications</p>
                            <p className="text-3xl font-bold text-blue-600">{userStats.totalApplications}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <TrendingUp className="size-8 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                        {userStats.interviewsScheduled} interviews scheduled
                    </p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Offers</p>
                            <p className="text-3xl font-bold text-green-600">{userStats.offersReceived}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Target className="size-8 text-green-600" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                        {userStats.badges.length} badges earned
                    </p>
                </Card>
            </div>

            {/* Activity Calendar */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Calendar className="size-5" />
                        Activity Calendar
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>Less</span>
                        <div className="flex gap-1">
                            {[0, 1, 2, 3, 4].map((level) => (
                                <div
                                    key={level}
                                    className={`size-3 rounded-sm ${getActivityLevel(level)}`}
                                />
                            ))}
                        </div>
                        <span>More</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <div className="inline-flex gap-1">
                        {calendarWeeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="flex flex-col gap-1">
                                {week.map((date, dayIndex) => {
                                    const dateStr = format(date, 'yyyy-MM-dd');
                                    // Using .get() for Map, but also works if activityCalendar is a plain object
                                    const activityCount = activityCalendar?.get ? activityCalendar.get(dateStr) : activityCalendar[dateStr] || 0;
                                    const isToday = isSameDay(date, new Date());

                                    return (
                                        <div
                                            key={dayIndex}
                                            className={`size-3 rounded-sm ${getActivityLevel(activityCount)} ${
                                                isToday ? 'ring-2 ring-purple-500' : ''
                                            }`}
                                            title={`${format(date, 'MMM d, yyyy')}: ${activityCount} activities`}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                <p className="text-sm text-gray-600 mt-4">
                    Keep your streak going! Complete activities every week to level up faster.
                </p>
            </Card>

            {/* Badges */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                    <Award className="size-5" />
                    Badges
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {userStats.badges.map((badge) => (
                        <div
                            key={badge.id}
                            className="flex flex-col items-center text-center p-4 border rounded-lg bg-gradient-to-br from-yellow-50 to-amber-50"
                        >
                            <div className="text-4xl mb-2">{badge.icon}</div>
                            <p className="font-semibold text-sm text-gray-900">{badge.name}</p>
                            <p className="text-xs text-gray-600 mt-1">{badge.description}</p>
                            {badge.earnedDate && (
                                <p className="text-xs text-gray-500 mt-2">
                                    {format(new Date(badge.earnedDate), 'MMM d, yyyy')}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                    <TrendingUp className="size-5" />
                    Recent Activity
                </h2>

                <div className="space-y-3">
                    {recentActivities.map((activity) => (
                        <div
                            key={activity.id}
                            className="flex items-center justify-between py-3 border-b last:border-0"
                        >
                            <div className="flex items-center gap-3">
                                <div className="text-2xl">{activityTypeIcons[activity.type]}</div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                                    <p className="text-xs text-gray-500">{format(new Date(activity.date), 'MMM d, yyyy h:mm a')}</p>
                                </div>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                                +{activity.xpEarned} XP
                            </Badge>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}