import React from 'react';
import { LayoutGrid, Target, Briefcase, User } from 'lucide-react';

/**
 * Navigation Component (Yellow Retro Version)
 * FIXED: Prop names now match InternLinkedApp.jsx
 */
// 1. Change 'onTabChange' to 'onViewChange' to match the parent
export function Navigation({ currentView, onViewChange, userStats }) {
    const { level, xp, xpToNextLevel } = userStats;
    const progressPercentage = (xp / xpToNextLevel) * 100;

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
        { id: 'matches', label: 'Job_Matches', icon: Target },
        { id: 'applications', label: 'Applications', icon: Briefcase },
        { id: 'profile', label: 'Profile', icon: User },
    ];

    return (
        <div className="w-64 h-full bg-white border-r-4 border-zinc-900 flex flex-col shadow-[4px_0px_0px_0px_rgba(0,0,0,1)]">
            {/* Header & XP Section */}
            <div className="p-6 border-b-4 border-zinc-900">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-[#EBBB49] border-2 border-zinc-900 p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <User className="text-zinc-900 size-5" strokeWidth={3} />
                    </div>
                    <div>
                        <h2 className="font-black uppercase text-sm italic leading-none">Intern_Linked</h2>
                        <span className="text-[10px] font-bold uppercase text-zinc-500">Level_{level}</span>
                    </div>
                </div>

                {/* Yellow XP Bar */}
                <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-black uppercase">
                        <span>{xp} XP</span>
                        <span>{xpToNextLevel} XP</span>
                    </div>
                    <div className="h-4 border-2 border-zinc-900 bg-white p-0.5">
                        <div
                            className="h-full bg-[#EBBB49] border-r-2 border-zinc-900 transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 p-4 space-y-3">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    // 2. Use 'currentView' instead of 'activeTab'
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            // 3. Call 'onViewChange' instead of 'onTabChange'
                            onClick={() => onViewChange(item.id)}
                            className={`w-full flex items-center gap-4 p-3 font-black uppercase text-xs border-2 transition-all
                                ${isActive
                                ? 'bg-[#EBBB49] text-zinc-900 border-zinc-900 translate-x-[2px] translate-y-[2px] shadow-none'
                                : 'bg-white text-zinc-900 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
                            }`}
                        >
                            <Icon size={18} strokeWidth={3} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}