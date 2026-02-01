import React from 'react';
import { Trophy, TrendingUp, Zap, Target } from 'lucide-react';

export function SimpleDashboard({ userStats, activities }) {
    const { level, xp, xpToNextLevel, totalApplications, interviewsScheduled } = userStats;
    const progressPercentage = (xp / xpToNextLevel) * 100;

    return (
        <div className="space-y-8">
            {/* 1. Main Level Card - Brutalist Version */}
            <div className="bg-white border-4 border-zinc-900 p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                        <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-zinc-500">Current_Standing</h2>
                        <div className="flex items-baseline gap-2">
                            <span className="text-7xl font-black italic tracking-tighter uppercase">LVL_{level}</span>
                        </div>
                    </div>

                    <div className="bg-[#EBBB49] border-2 border-zinc-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <Trophy size={48} strokeWidth={3} className="text-zinc-900" />
                    </div>
                </div>

                {/* Yellow XP Progress */}
                <div className="mt-8 space-y-2">
                    <div className="flex justify-between font-black uppercase text-xs italic">
                        <span>XP_Progress: {xp} / {xpToNextLevel}</span>
                        <span>{Math.round(progressPercentage)}%</span>
                    </div>
                    <div className="h-6 border-4 border-zinc-900 bg-white p-1">
                        <div
                            className="h-full bg-[#EBBB49] border-r-2 border-zinc-900 transition-all duration-700"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                    <p className="text-[10px] font-bold uppercase text-zinc-400 italic">
                        Next_Level_Threshold: {xpToNextLevel - xp} XP Remaining
                    </p>
                </div>
            </div>

            {/* 2. Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total_Apps', value: totalApplications, icon: Target, color: 'bg-white' },
                    { label: 'Interviews', value: interviewsScheduled, icon: Zap, color: 'bg-white' },
                    { label: 'XP_Streak', value: userStats.currentStreak || 0, icon: TrendingUp, color: 'bg-[#EBBB49]' }
                ].map((stat, i) => (
                    <div key={i} className={`${stat.color} border-4 border-zinc-900 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between`}>
                        <div>
                            <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">{stat.label}</p>
                            <p className="text-3xl font-black italic">{stat.value}</p>
                        </div>
                        <stat.icon size={28} strokeWidth={3} className="text-zinc-900" />
                    </div>
                ))}
            </div>

            {/* 3. Activity Log */}
            <div className="bg-white border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="border-b-4 border-zinc-900 p-4 bg-zinc-900">
                    <h3 className="text-white font-black uppercase italic text-sm tracking-widest">Recent_Activity_Logs</h3>
                </div>
                <div className="p-2">
                    {activities.map((activity, i) => (
                        <div key={i} className="flex justify-between items-center p-4 border-b-2 border-zinc-100 last:border-0 hover:bg-zinc-50">
                            <div>
                                <p className="text-xs font-black uppercase">{activity.type}</p>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase">{activity.description}</p>
                            </div>
                            <span className="font-black italic text-[#EBBB49] drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">+{activity.xp} XP</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}