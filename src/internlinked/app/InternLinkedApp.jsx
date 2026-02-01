import { useState, useEffect } from 'react';
import { createClient } from "@supabase/supabase-js";
import { Navigation } from "./components/Navigation";
import { SimpleDashboard } from "./components/SimpleDashboard";
import { ApplicationTracker } from "./components/ApplicationTracker";
import { ProfileView } from "./components/ProfileView";
import { JobMatches } from "./components/JobMatches";
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
    const [userStats, setUserStats] = useState({
        level: 1, xp: 0, xpToNextLevel: 100, currentStreak: 0,
        totalApplications: 0, interviewsScheduled: 0, offersReceived: 0,
        badges: [], lastActivityDate: null
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Try to fetch the profile
            let { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            // 2. FALLBACK: If no profile exists, create a default one immediately
            if (!profileData) {
                const { data: newProfile, error: createError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        full_name: user.email.split('@')[0], // Use email prefix as default name
                        xp: 0,
                        level: 1,
                        current_streak: 0
                    })
                    .select()
                    .single();

                if (newProfile) profileData = newProfile;
                if (createError) console.error("Profile creation failed:", createError.message);
            }

            if (profileData) setProfile(profileData);

            // 3. Fetch applications as normal
            const { data: apps } = await supabase.from('applications').select('*').order('created_at', { ascending: false });
            if (apps) {
                const mappedApps = apps.map(app => ({
                    ...app,
                    companyName: app.companyName || app.company,
                    position: app.position || app.role
                }));
                setApplications(mappedApps);

                // Recalculate stats based on apps found
                const progress = calculateUserProgress(mappedApps);
                setUserStats(prev => ({ ...prev, ...progress }));
            }
        };
        fetchInitialData();
    }, []);

    // Brutalist Level Up Animation
    const triggerLevelUpAnimation = (newLevel) => {
        toast.custom((t) => (
            <div className="bg-[#EBBB49] border-4 border-zinc-900 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-bounce">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-zinc-900">
                    Level_Up!
                </h2>
                <p className="font-bold uppercase text-[10px] text-zinc-800">Ranked_Up_To_Level_{newLevel}</p>
            </div>
        ), { duration: 4000 });
    };

    const handleUpdateApplications = (updatedData, deletedId) => {
        // 1. HANDLE DELETION
        if (deletedId) {
            setApplications(prev => {
                const newApps = prev.filter(app => app.id !== deletedId);
                // Re-calculate stats based on the new list
                const progress = calculateUserProgress(newApps, mockActivities, mockBadges);
                setUserStats(prevStats => ({ 
                    ...prevStats, 
                    ...progress, 
                    totalApplications: newApps.length 
                }));
                return newApps;
            });
            return;
        }
    
        // 2. HANDLE ADD / UPDATE
        // We treat both the same way: remove old version (if any), add new version
        setApplications(prev => {
            // Find if it exists and remove it to prevent duplicates
            const filtered = prev.filter(app => app.id !== updatedData.id);
            
            // Map the data to ensure consistency across the app
            const formattedApp = {
                ...updatedData,
                companyName: updatedData.companyName || updatedData.company,
                position: updatedData.position || updatedData.role,
                cv_url: updatedData.cv_url || updatedData.resume_url
            };
    
            const newAppsList = [formattedApp, ...filtered];
            
            // Update stats immediately
            const progress = calculateUserProgress(newAppsList, mockActivities, mockBadges);
            setUserStats(prevStats => ({ 
                ...prevStats, 
                ...progress, 
                totalApplications: newAppsList.length 
            }));
    
            return newAppsList;
        });
    };

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <SimpleDashboard userStats={userStats} activities={mockActivities} />;
            case 'applications':
                return <ApplicationTracker applications={applications} onUpdateApplications={handleUpdateApplications} />;
            case 'matches':
                return <JobMatches />;
            case 'profile':
                // FIX: If profile is null, show a brutalist loading state instead of a blank page
                return profile ? (
                    <ProfileView profile={profile} onUpdateProfile={setProfile} />
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
            {/* Navigation pinned to left with 100% height */}
            <Navigation currentView={currentView} onViewChange={setCurrentView} userStats={userStats} />

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header Section */}
                <div className="bg-white border-b-4 border-zinc-900 px-6 py-4 flex justify-between items-center z-10">
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase">
                        <span>Intern</span><span className="text-[#EBBB49]">Linked</span>
                    </h1>
                    <button
                        onClick={() => supabase.auth.signOut()}
                        className="px-4 py-2 border-2 border-zinc-900 bg-zinc-900 text-white text-[10px] font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all hover:bg-zinc-800"
                    >
                        Exit_Session
                    </button>
                </div>

                {/* Scrollable View Area */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-8">
                    {renderView()}
                </div>
            </main>

            <Toaster position="bottom-right" toastOptions={{ className: 'rounded-none border-4 border-zinc-900 font-black uppercase text-[10px]' }} />
        </div>
    );
}