import { useState, useEffect } from 'react';
import { createClient } from "@supabase/supabase-js";
import { Navigation } from "./components/Navigation";
import { SimpleDashboard } from "./components/SimpleDashboard";
import { ApplicationTracker } from "./components/ApplicationTracker";
import { ProfileView } from "./components/ProfileView";
import { JobMatches } from "./components/JobMatches";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { calculateUserProgress } from '../utils/gamification';

// 1. Supabase Client created outside component to prevent multiple instances
const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

// 2. Helper function for streak logic
const calculateStreak = (lastActivityDate, currentStreak = 0) => {
    const today = new Date().toISOString().split('T')[0];
    if (!lastActivityDate) return 1;
    if (lastActivityDate === today) return currentStreak || 1;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString().split('T')[0];

    return lastActivityDate === yesterdayISO ? currentStreak + 1 : 1;
};

export default function InternLinkedApp({ session }) {
    const [currentView, setCurrentView] = useState('dashboard');
    const [applications, setApplications] = useState([]);
    const [profile, setProfile] = useState(null);
    const [activities, setActivities] = useState([]);
    const [userStats, setUserStats] = useState({
        level: 1, xp: 0, xpIntoLevel: 0, nextLevelXp: 100,
        currentStreak: 0, totalApplications: 0, interviewsScheduled: 0,
        lastActivityDate: null
    });

    // 3. Initial Data Fetch
    useEffect(() => {
        const fetchInitialData = async () => {
            // 1. Get the current authenticated user
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                console.error("Auth Error:", authError?.message);
                return;
            }

            // 2. Fetch User Profile (Name, XP, Level, Streak)
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError) {
                console.error("Profile Fetch Error:", profileError.message);
            } else if (profileData) {
                setProfile(profileData); // Stores full_name for your header
            }

            // 3. Fetch Applications
            const { data: apps, error: appsError } = await supabase
                .from('applications')
                .select('*')
                .order('created_at', { ascending: false });

            if (appsError) {
                console.error("Apps Fetch Error:", appsError.message);
            } else if (apps) {
                const mappedApps = apps.map(app => ({
                    ...app,
                    companyName: app.companyName || app.company,
                    position: app.position || app.role
                }));

                setApplications(mappedApps);

                // Calculate current stats using your gamification logic
                const progress = calculateUserProgress(mappedApps);

                setUserStats(prev => ({
                    ...prev,
                    ...progress,
                    currentStreak: profileData?.current_streak || 0,
                    lastActivityDate: profileData?.last_activity_date,
                    totalApplications: mappedApps.length
                }));
            }

            // 4. Fetch the 5 most recent Activity Logs
            const { data: activityData, error: logError } = await supabase
                .from('activities')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (logError) {
                console.error("Activity Log Fetch Error:", logError.message);
            } else if (activityData) {
                setActivities(activityData);
            }
        };

        fetchInitialData();
    }, []); // Empty dependency array ensures this only runs once on mount

    const triggerLevelUpAnimation = (newLevel) => {
        toast.custom(() => (
            <div className="bg-[#EBBB49] border-4 border-zinc-900 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-bounce">
                <h2 className="text-2xl font-black italic uppercase text-zinc-900">Level_Up!</h2>
                <p className="font-bold uppercase text-[10px] text-zinc-800">Reached_Level_{newLevel}</p>
            </div>
        ), { duration: 4000 });
    };

    // 4. Main Update Function
    const handleUpdateApplications = async (updatedData, deletedId) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let finalApps = [...applications];
        let activityType = '';
        let activityDesc = '';

        if (deletedId) {
            const { error: appDeleteError } = await supabase.from('applications').delete().eq('id', deletedId);
            if (appDeleteError) return toast.error(appDeleteError.message);
            finalApps = applications.filter(app => app.id !== deletedId);
            activityType = 'DELETION';
            activityDesc = `Removed application entry`;
        } else {
            const isEditing = updatedData.id && applications.some(a => a.id === updatedData.id);
            const dbPayload = {
                user_id: user.id,
                companyName: updatedData.companyName || updatedData.company,
                position: updatedData.position || updatedData.role,
                status: updatedData.status,
                cv_url: updatedData.cv_url
            };

            if (isEditing) {
                const { error: appUpdateError } = await supabase.from('applications').update(dbPayload).eq('id', updatedData.id);
                if (appUpdateError) return toast.error(appUpdateError.message);
                finalApps = applications.map(a => a.id === updatedData.id ? { ...a, ...updatedData } : a);
                activityType = 'UPDATE';
                activityDesc = `Updated ${dbPayload.companyName}`;
            } else {
                const { data: newData, error: appInsertError } = await supabase.from('applications').insert([dbPayload]).select();
                if (appInsertError) return toast.error(appInsertError.message);
                finalApps = [{ ...newData[0], companyName: newData[0].companyName, position: newData[0].position }, ...applications];
                activityType = 'APPLICATION';
                activityDesc = `Applied to ${dbPayload.companyName}`;
            }
        }

        const progress = calculateUserProgress(finalApps);
        const newStreakValue = calculateStreak(userStats.lastActivityDate, userStats.currentStreak);
        const todayISO = new Date().toISOString().split('T')[0];

        // 5. Correctly scoped Profile Sync logic
        // InternLinkedApp.jsx
        const { error: profileSyncError } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                xp: Math.round(progress.xp || 0),
                level: Math.round(progress.level || 1),
                current_streak: Math.round(newStreakValue || 0), // MATCHES THE NEW SQL COLUMN
                last_activity_date: todayISO
            });

        if (profileSyncError) {
            console.error("400 Error Details:", profileSyncError);
            return toast.error("STATS_SYNC_FAILED");
        }

        const logPayload = {
            user_id: user.id,
            type: activityType,
            description: activityDesc,
            xp: deletedId ? 0 : 50
        };

        const { data: newLog, error: logErr } = await supabase
            .from('activities')
            .insert([logPayload])
            .select()
            .single();

        if (progress.level > userStats.level) {
            triggerLevelUpAnimation(progress.level);
        }

        setApplications(finalApps);
        setUserStats(prev => ({
            ...prev,
            ...progress,
            currentStreak: newStreakValue,
            lastActivityDate: todayISO,
            totalApplications: finalApps.length
        }));

        if (!logErr && newLog) {
            setActivities(prev => [newLog, ...prev].slice(0, 5));
        }

        toast.success(deletedId ? "ENTRY_REMOVED" : "XP_SYNCED");
    };

    const renderView = () => {
        switch (currentView) {
            case 'dashboard': return <SimpleDashboard userStats={userStats} activities={activities} />;
            case 'applications': return <ApplicationTracker applications={applications} onUpdateApplications={handleUpdateApplications} />;
            case 'profile': return profile ? <ProfileView profile={profile} onUpdateProfile={setProfile} /> : null;
            default: return <SimpleDashboard userStats={userStats} activities={activities} />;
        }
    };

    return (
        <div className="flex h-screen w-full bg-[#FCFBF4] overflow-hidden">
            <Navigation currentView={currentView} onViewChange={setCurrentView} userStats={userStats} />
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div className="bg-white border-b-4 border-zinc-900 px-6 py-4 flex justify-between items-center z-10">
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase">
                        Intern<span className="text-[#EBBB49]">Linked</span>
                    </h1>
                    <button onClick={() => supabase.auth.signOut()} className="px-4 py-2 border-2 border-zinc-900 bg-zinc-900 text-white text-[10px] font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Exit Session</button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 lg:p-8">{renderView()}</div>
            </main>
            <Toaster position="bottom-right" />
        </div>
    );
}