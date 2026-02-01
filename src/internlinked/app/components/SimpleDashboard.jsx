import { Card } from '@/app/components/ui/card';
import { Progress } from '@/app/components/ui/progress';
import { Trophy, TrendingUp, Target, Flame } from 'lucide-react';

// Removed: import { UserStats } from '@/types';
// Removed: interface SimpleDashboardProps

export function SimpleDashboard({ userStats }) {
    // Defensive check to prevent crashes if userStats is undefined
    if (!userStats) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Track your progress</p>
            </div>

            {/* Level & XP Card */}
            <Card className="p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Current Level</p>
                        <p className="text-5xl font-bold text-purple-600">{userStats.level}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                        <Trophy className="size-12 text-white" />
                    </div>
                </div>

                <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>XP Progress</span>
                        <span>
              {userStats.xp} / {userStats.xpToNextLevel} XP
            </span>
                    </div>
                    <Progress value={(userStats.xp / userStats.xpToNextLevel) * 100} className="h-3" />
                </div>

                <p className="text-sm text-gray-600">
                    {userStats.xpToNextLevel - userStats.xp} XP needed to reach Level {userStats.level + 1}
                </p>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <Flame className="size-6 text-orange-600" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Current Streak</p>
                    <p className="text-3xl font-bold text-orange-600 mb-2">{userStats.currentStreak} days</p>
                    <p className="text-xs text-gray-500">Longest: {userStats.longestStreak} days</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <TrendingUp className="size-6 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Total Applications</p>
                    <p className="text-3xl font-bold text-blue-600 mb-2">{userStats.totalApplications}</p>
                    <p className="text-xs text-gray-500">{userStats.interviewsScheduled} interviews</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Target className="size-6 text-green-600" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Offers Received</p>
                    <p className="text-3xl font-bold text-green-600 mb-2">{userStats.offersReceived}</p>
                    <p className="text-xs text-gray-500">{userStats.badges?.length || 0} badges earned</p>
                </Card>
            </div>

            {/* How to Earn XP */}
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
                <h2 className="text-xl font-semibold mb-4">How to Earn XP</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                            <span className="text-2xl" role="img" aria-label="memo">📝</span>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Add Application</p>
                            <p className="text-sm text-gray-600">+10 XP</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                            <span className="text-2xl" role="img" aria-label="briefcase">💼</span>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Schedule Interview</p>
                            <p className="text-sm text-gray-600">+25 XP</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                            <span className="text-2xl" role="img" aria-label="document">📄</span>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Update Resume</p>
                            <p className="text-sm text-gray-600">+15 XP</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                            <span className="text-2xl" role="img" aria-label="target">🎯</span>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Receive Offer</p>
                            <p className="text-sm text-gray-600">+50 XP</p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}