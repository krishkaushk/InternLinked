import {
    LayoutDashboard,
    Briefcase,
    User,
    Trophy,
    Menu,
    X,
    Target
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useState } from 'react';

// Removed: type NavItem
// Removed: interface NavigationProps

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'job-matches', label: 'Job Matches', icon: Target },
    { id: 'applications', label: 'Applications', icon: Briefcase },
    { id: 'profile', label: 'Profile', icon: User },
];

export function Navigation({ currentView, onViewChange, userStats }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const NavContent = () => (
        <>
            {/* Logo & Level */}
            <div className="p-6 border-b">
                <div className="flex items-center gap-3 mb-4">
                    <div className="size-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Trophy className="size-6 text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg">InternLinked</h2>
                        <p className="text-xs text-gray-500">Level {userStats?.level || 1}</p>
                    </div>
                </div>

                {/* XP Progress */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                        <span>{userStats?.xp || 0} XP</span>
                        <span>{userStats?.xpToNextLevel || 100} XP</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                            style={{
                                width: `${((userStats?.xp || 0) / (userStats?.xpToNextLevel || 100)) * 100}%`,
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Navigation Items */}
            <nav className="p-3 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                onViewChange(item.id);
                                setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                isActive
                                    ? 'bg-purple-50 text-purple-700 font-medium'
                                    : 'text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <Icon className="size-5" />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </>
    );

    return (
        <>
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-40 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <div className="size-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Trophy className="size-4 text-white" />
                    </div>
                    <span className="font-bold">InternLinked</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                </Button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40 mt-16"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 bg-white border-r">
                <NavContent />
            </aside>

            {/* Mobile Sidebar */}
            <aside
                className={`lg:hidden fixed inset-y-0 left-0 w-64 bg-white border-r z-50 transform transition-transform duration-200 mt-16 ${
                    isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <NavContent />
            </aside>
        </>
    );
}