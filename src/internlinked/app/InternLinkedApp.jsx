import { useState, useEffect } from 'react';
import { createClient } from "@supabase/supabase-js";
import { Navigation } from "./components/Navigation";
import { SimpleDashboard } from "./components/SimpleDashboard";
import { ApplicationTracker } from "./components/ApplicationTracker";
import { ProfileView } from "./components/ProfileView";
import { JobMatches } from "./components/JobMatches";
import { mockUserStats, mockActivities, mockBadges } from "../data/mockData";
import { Toaster } from "./components/ui/sonner";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { calculateUserProgress, calculateNewStreak } from '../utils/gamification';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function InternLinkedApp({ session }) {
    // 1. Initialize all required states correctly
    const [currentView, setCurrentView] = useState('dashboard');
    const [applications, setApplications] = useState([]);
    const [profile, setProfile] = useState(null);
    const [userStats, setUserStats] = useState({
        level: 1,
        xp: 0,
        xpToNextLevel: 500,
        currentStreak: 0,
        longestStreak: 0,
        totalApplications: 0,
        interviewsScheduled: 0,
        offersReceived: 0,
        badges: [],
        lastActivityDate: null
    });

    // 2. Fetch initial data from Supabase on load
    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch applications
            const { data: apps } = await supabase
                .from('applications')
                .select('*')
                .order('created_at', { ascending: false });

            // Fetch profile for streak data
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (apps) {
                setApplications(apps);
                const progress = calculateUserProgress(apps, mockActivities, mockBadges);
                setUserStats(prev => ({
                    ...prev,
                    ...progress,
                    totalApplications: apps.length,
                    currentStreak: profileData?.current_streak || 0,
                    lastActivityDate: profileData?.last_activity_date || null
                }));
            }
        };
        fetchInitialData();
    }, []);

    // 3. Trigger Level Up toast when level increases
    useEffect(() => {
        if (userStats.level > 1) {
            toast.success("LEVEL UP!", {
                description: `You've reached Level ${userStats.level}!`,
                icon: "🎉",
            });
        }
    }, [userStats.level]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const handleUpdateApplications = async (newJobOrList) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let updatedList;
        let newJobToInsert = null;

        if (Array.isArray(newJobOrList)) {
            updatedList = newJobOrList;
        } else {
            updatedList = [...applications, newJobOrList];
            newJobToInsert = newJobOrList;
        }

        // 4. Save to Supabase
        if (newJobToInsert) {
            const { error: insertError } = await supabase
                .from('applications')
                .insert([{
                    user_id: user.id,
                    company_name: newJobToInsert.companyName,
                    position: newJobToInsert.position,
                    status: newJobToInsert.status || 'saved',
                    job_type: newJobToInsert.jobType || 'internship',
                    notes: newJobToInsert.notes || '',
                    job_url: newJobToInsert.jobUrl || ''
                }]);

            if (insertError) {
                console.error("Supabase Insert Failed:", insertError.message);
                return;
            }

            // 5. Update Streak logic
            const updatedStreak = calculateNewStreak(userStats.lastActivityDate, userStats.currentStreak);
            await supabase
                .from('profiles')
                .update({
                    current_streak: updatedStreak,
                    last_activity_date: new Date().toISOString().split('T')[0]
                })
                .eq('id', user.id);
        }

        // 6. Final State Sync
        setApplications(updatedList);
        const newProgress = calculateUserProgress(updatedList, mockActivities, mockBadges);
        setUserStats(prev => ({
            ...prev,
            ...newProgress,
            totalApplications: updatedList.length
        }));
    };

    const renderView = () => {
        switch (currentView) {
            case 'dashboard': return <SimpleDashboard userStats={userStats} activities={mockActivities} />;
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