import { useState } from 'react';
import { createClient } from "@supabase/supabase-js";
import { Navigation } from "./components/Navigation";
import { SimpleDashboard } from "./components/SimpleDashboard";
import { ApplicationTracker } from "./components/ApplicationTracker";
import { ProfileView } from "./components/ProfileView";
import { JobMatches } from "./components/JobMatches";
import { mockUserStats, mockApplications, mockActivities, mockBadges } from "../data/mockData"; // Added these to imports
import { Toaster } from "./components/ui/sonner";
import { LogOut } from "lucide-react";
import { calculateUserProgress } from '../utils/gamification';
import { useEffect } from 'react'; // Add useEffect to your React imports
import { toast } from "sonner";    // Import toast from sonner


const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function InternLinkedApp({ session }) {
    useEffect(() => {
        // Check if level has actually increased from the initial state
        if (userStats.level > 1) {
            toast.success("LEVEL UP!", {
                description: `You've reached Level ${userStats.level}! Keep applying to earn more XP.`,
                icon: "🎉",
                duration: 5000,
            });
        }
    }, [userStats.level]);

    const [currentView, setCurrentView] = useState('dashboard');

    // 1. Initialize applications with mock data so progress can be calculated
    const [applications, setApplications] = useState(mockApplications);
    const [profile, setProfile] = useState(null);

    // 2. Initialize userStats dynamically using your new logic
    const initialProgress = calculateUserProgress(mockApplications, mockActivities, mockBadges);
    const [userStats, setUserStats] = useState({
        ...mockUserStats,
        ...initialProgress,
        totalApplications: mockApplications.length
    });

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const handleUpdateApplications = (updatedApplications) => {
        // 3. Update the applications list
        setApplications(updatedApplications);

        // 4. Recalculate progress whenever applications change
        const newProgress = calculateUserProgress(updatedApplications, mockActivities, mockBadges);
        setUserStats(prev => ({
            ...prev,
            ...newProgress,
            totalApplications: updatedApplications.length,
            interviewsScheduled: updatedApplications.filter(a => a.status === 'interview').length,
            offersReceived: updatedApplications.filter(a => a.status === 'offered').length,
        }));
    };

    const renderView = () => {
        switch (currentView) {
            case 'dashboard': return <SimpleDashboard userStats={userStats} activities={mockActivities} />; // Pass activities to dashboard
            case 'job-matches': return <JobMatches profile={profile} />;
            case 'applications': return <ApplicationTracker applications={applications} onUpdateApplications={handleUpdateApplications} />;
            case 'profile': return profile ? <ProfileView profile={profile} onUpdateProfile={setProfile} /> : null;
            default: return <SimpleDashboard userStats={userStats} />;
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCF0] font-sans">
            <Navigation
                currentView={currentView}
                onViewChange={setCurrentView}
                userStats={userStats}
            />

            <main className="lg:pl-64">
                <div className="bg-white border-b-2 border-zinc-900 px-6 py-4 flex justify-between items-center">
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase">
                        <span className="text-black-600">Intern</span>
                        <span className="text-[#800050]">Linked</span>
                    </h1>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-1.5 border-2 border-zinc-900 bg-white text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                    >
                        <LogOut size={14} />
                        Exit_Session
                    </button>
                </div>

                <div className="p-6 lg:p-8">
                    {renderView()}
                </div>
            </main>

            <Toaster />
        </div>
    );
}