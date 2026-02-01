import React from 'react';
import { LayoutGrid, Target, Briefcase, User } from 'lucide-react';

export function Navigation({ currentView, onViewChange, userStats }) {
    // Destructuring to ensure we use the correct level-specific XP
    const { level, xpIntoLevel, nextLevelXp } = userStats;

    // Safety check for percentage to prevent overflow
    const progressPercentage = Math.min((xpIntoLevel / nextLevelXp) * 100, 100);

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
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
                        <h2 className="font-black uppercase text-sm leading-none">Krish Kaushik</h2>
                        <span className="text-[10px] font-bold uppercase text-zinc-500">Level_{level}</span>
                    </div>
                </div>

                {/* Fixed Sidebar XP Bar */}
                <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-black uppercase">
                        <span>{xpIntoLevel} XP</span>
                        <span>{nextLevelXp} XP</span>
                    </div>
                    <div className="h-4 border-2 border-zinc-900 bg-white p-0.5 relative overflow-hidden">
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
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.id}
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