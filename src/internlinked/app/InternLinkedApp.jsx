import { useState, useEffect } from 'react';
import { createClient } from "@supabase/supabase-js";
import { Navigation } from "./components/Navigation";
import { SimpleDashboard } from "./components/SimpleDashboard";
import { ApplicationTracker } from "./components/ApplicationTracker";
import { ProfileView } from "./components/ProfileView";
import { mockActivities, mockBadges } from "../data/mockData";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { calculateUserProgress } from '../utils/gamification';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function InternLinkedApp({ session }) {
    const [currentView, setCurrentView] = useState('dashboard');
    const [applications, setApplications] = useState([]);
    const [profile, setProfile] = useState(null);
    const [isInitialSync, setIsInitialSync] = useState(true); // Guard for animations
    
    const [userStats, setUserStats] = useState({
        level: 1, 
        xp: 0, 
        xpIntoLevel: 0, 
        nextLevelXp: 300, 
        currentStreak: 0,
        totalApplications: 0, 
        interviewsScheduled: 0, 
        offersReceived: 0,
        badges: [], 
        lastActivityDate: null
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Profile Fetch/Create
            let { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (!profileData) {
                const { data: newProfile } = await supabase
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        full_name: user.email.split('@')[0],
                        xp: 0,
                        level: 1,
                        current_streak: 0
                    })
                    .select()
                    .single();
                if (newProfile) profileData = newProfile;
            }

            // 2. Application Fetch
            const { data: apps } = await supabase
                .from('applications')
                .select('*')
                .order('created_at', { ascending: false });

            if (apps) {
                const mappedApps = apps.map(app => ({
                    ...app,
                    companyName: app.companyName || app.company,
                    position: app.position || app.role
                }));
                setApplications(mappedApps);
            }

            // 3. Initial Sync (Sets state without triggering Level Up toast)
            if (profileData) {
                syncUserStats(profileData, apps?.length || 0);
            }

            setIsInitialSync(false); // Turn off guard after first load
        };
        fetchInitialData();
    }, []);

    // Unified function to handle XP math and state sync
    const syncUserStats = (updatedProfile, appCount) => {
        const XP_PER_LEVEL = 300; 
        const totalXp = updatedProfile.xp || 0;
        
        const newLevel = Math.floor(totalXp / XP_PER_LEVEL) + 1;
        const xpIntoLevel = totalXp % XP_PER_LEVEL; 

        // Animation Guard: Only fire if it's NOT the first load and level actually increased
        if (!isInitialSync && newLevel > userStats.level) {
            triggerLevelUpAnimation(newLevel);
        }

        setProfile(updatedProfile);
        setUserStats(prev => ({
            ...prev,
            level: newLevel,
            xp: totalXp,
            xpIntoLevel: xpIntoLevel,
            nextLevelXp: XP_PER_LEVEL,
            currentStreak: updatedProfile.current_streak || updatedProfile.streak || 0,
            totalApplications: appCount !== undefined ? appCount : prev.totalApplications
        }));
    };

    const triggerLevelUpAnimation = (newLevel) => {
        toast.custom((t) => (
            <div className="bg-[#EBBB49] border-4 border-zinc-900 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-bounce">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-zinc-900">Level_Up!</h2>
                <p className="font-bold uppercase text-[10px] text-zinc-800">Ranked_Up_To_Level_{newLevel}</p>
            </div>
        ), { duration: 4000 });
    };

    const handleUpdateApplications = (updatedData, deletedId) => {
        if (deletedId) {
            setApplications(prev => {
                const newApps = prev.filter(app => app.id !== deletedId);
                setUserStats(s => ({ ...s, totalApplications: newApps.length }));
                return newApps;
            });
            return;
        }
    
        setApplications(prev => {
            const filtered = prev.filter(app => app.id !== updatedData.id);
            const formattedApp = {
                ...updatedData,
                companyName: updatedData.companyName || updatedData.company,
                position: updatedData.position || updatedData.role,
            };
            const newList = [formattedApp, ...filtered];
            setUserStats(s => ({ ...s, totalApplications: newList.length }));
            return newList;
        });
    };

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <SimpleDashboard userStats={userStats} activities={mockActivities} />;
            case 'applications':
                return (
                    <ApplicationTracker 
                        applications={applications} 
                        onUpdateApplications={handleUpdateApplications} 
                        onUpdateProfile={(data) => syncUserStats(data)} 
                    />
                );
            case 'profile':
                return profile ? (
                    <ProfileView profile={profile} onUpdateProfile={(data) => syncUserStats(data)} />
                ) : (
                    <div className="p-12 border-4 border-dashed border-zinc-200 text-center">
                        <p className="font-black uppercase italic text-zinc-400">Loading_Profile_Data...</p>
                    </div>
                );
            default:
                return <SimpleDashboard userStats={userStats} activities={mockActivities} />;
        }
    };

    return (
        <div className="flex h-screen w-full bg-[#FCFBF4] overflow-hidden">
            <Navigation currentView={currentView} onViewChange={setCurrentView} userStats={userStats} />

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <div className="bg-white border-b-4 border-zinc-900 px-6 py-4 flex justify-between items-center z-10">
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase">
                        <span className="text-black-600">Intern</span><span className="text-[#EBBB49]">Linked</span>
                    </h1>
                    <button
                        onClick={() => supabase.auth.signOut()}
                        className="px-4 py-2 border-2 border-zinc-900 bg-zinc-900 text-white text-[10px] font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all hover:bg-zinc-800"
                    >
                        Exit_Session
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 lg:p-8">
                    {renderView()}
                </div>
            </main>

            <Toaster position="bottom-right" toastOptions={{ className: 'rounded-none border-4 border-zinc-900 font-black uppercase text-[10px]' }} />
        </div>
    );
}