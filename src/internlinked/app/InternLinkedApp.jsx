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
    const [currentView, setCurrentView] = useState('dashboard');
    const [applications, setApplications] = useState(mockApplications);
    const [profile, setProfile] = useState(null);

    // 1. Calculate the progress first into a SEPARATE variable
    const initialProgress = calculateUserProgress(mockApplications, mockActivities, mockBadges);

    // 2. Use that variable to initialize your state
    const [userStats, setUserStats] = useState({
        ...mockUserStats, // Use the IMPORTED mockUserStats, not the local state variable
        ...initialProgress,
        totalApplications: mockApplications.length
    });

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const handleUpdateApplications = async (newJob) => {
        // 1. Get the current user's ID
        const { data: { user } } = await supabase.auth.getUser();

        // 2. Insert the new job into your 'applications' table
        const { data, error } = await supabase
            .from('applications')
            .insert([
                {
                    user_id: user.id,
                    company_name: newJob.companyName,
                    position: newJob.position,
                    status: 'applied',
                    match_score: newJob.matchScore || 0
                }
            ])
            .select();

        if (error) {
            console.error("Error saving job:", error.message);
            return;
        }

        // 3. Update the local state so the Level System reacts
        const updatedList = [...applications, data[0]];
        setApplications(updatedList);

        // This triggers your 'Level Up' toast automatically!
        const newProgress = calculateUserProgress(updatedList, mockActivities, mockBadges);
        setUserStats(prev => ({
            ...prev,
            ...newProgress
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