import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, Target, Briefcase, User } from 'lucide-react';

export function Navigation({ userStats, profile }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { level, xpIntoLevel, nextLevelXp } = userStats;
    const progressPercentage = Math.min((xpIntoLevel / nextLevelXp) * 100, 100);

    const menuItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
        { path: '/applications', label: 'Applications', icon: Briefcase },
        { path: '/jobs', label: 'Job Matches', icon: Target },
        { path: '/profile', label: 'Profile', icon: User },
    ];

    return (
        <div className="w-64 h-full bg-white border-r-4 border-zinc-900 flex flex-col shadow-[4px_0px_0px_0px_rgba(0,0,0,1)]">
            <div className="p-6 border-b-4 border-zinc-900">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-[#EBBB49] border-2 border-zinc-900 p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <User className="text-zinc-900 size-5" strokeWidth={3} />
                    </div>
                    <div>
                        <h2 className="font-black uppercase text-sm leading-none">{profile?.name || profile?.full_name || 'User'}</h2>
                        <span className="text-[10px] font-bold uppercase text-zinc-500">Level_{level}</span>
                    </div>
                </div>
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

            <nav className="flex-1 p-4 space-y-3">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/');
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
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