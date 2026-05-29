import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { Navigation } from "./components/Navigation";
import { SimpleDashboard } from "./components/SimpleDashboard";
import { ApplicationTracker } from "./components/ApplicationTracker";
import { ProfileView } from "./components/ProfileView";
import { JobMatches } from "./components/JobMatches";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { calculateUserProgress } from '../utils/gamification';
import { fetchJobs } from '../utils/jobSearch';
import { scoreJobs } from '../utils/llmScore';


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
    const location = useLocation();
    const [applications, setApplications] = useState([]);
    const [profile, setProfile] = useState(null);
    const [activities, setActivities] = useState([]);
    const [userStats, setUserStats] = useState(() => {
        try {
            const cached = localStorage.getItem('il_stats');
            return cached ? JSON.parse(cached) : {
                level: 1, xp: 0, xpIntoLevel: 0, nextLevelXp: 100,
                currentStreak: 0, totalApplications: 0, interviewsScheduled: 0,
                lastActivityDate: null
            };
        } catch { return { level: 1, xp: 0, xpIntoLevel: 0, nextLevelXp: 100, currentStreak: 0, totalApplications: 0, interviewsScheduled: 0, lastActivityDate: null }; }
    });
    const [jobs, setJobs] = useState(() => {
        try {
            const cached = sessionStorage.getItem('il_jobs');
            return cached ? JSON.parse(cached) : [];
        } catch { return []; }
    });
    const [jobsLoading, setJobsLoading] = useState(false);

    const saveUserStats = (stats) => {
        setUserStats(stats);
        try { localStorage.setItem('il_stats', JSON.stringify(stats)); } catch {}
    };

    const saveJobs = (scored) => {
        setJobs(scored);
        try { sessionStorage.setItem('il_jobs', JSON.stringify(scored)); } catch {}
    };

    const handleRefreshJobs = () => {
        try { sessionStorage.removeItem('il_jobs'); } catch {}
        setJobs([]);
    };

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
                const mappedApps = apps.map(app => ({ ...app }));

                setApplications(mappedApps);

                // Calculate current stats using your gamification logic
                const progress = calculateUserProgress(mappedApps);

                saveUserStats({
                    ...userStats,
                    ...progress,
                    currentStreak: profileData?.streak || 0,
                    lastActivityDate: profileData?.last_activity,
                    totalApplications: mappedApps.length
                });
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
    }, []);

    useEffect(() => {
        if (location.pathname !== '/jobs' || !profile?.skills?.length || jobs.length > 0) return;
        setJobsLoading(true);
        fetchJobs().then(async (rawJobs) => {
            const scored = await scoreJobs(rawJobs, profile);
            saveJobs(scored);
            setJobsLoading(false);
        }).catch(() => {
            toast.error('Could not load job matches');
            setJobsLoading(false);
        });
    }, [location.pathname, profile, jobs.length]);


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
            const alreadySaved = updatedData.id && !isEditing;
            const dbPayload = {
                user_id: user.id,
                companyName: updatedData.companyName,
                position: updatedData.position,
                status: updatedData.status,
                cv_url: updatedData.cv_url
            };

            if (isEditing) {
                const { error: appUpdateError } = await supabase.from('applications').update(dbPayload).eq('id', updatedData.id);
                if (appUpdateError) return toast.error(appUpdateError.message);
                finalApps = applications.map(a => a.id === updatedData.id ? { ...a, ...updatedData } : a);
                activityType = 'UPDATE';
                activityDesc = `Updated ${dbPayload.companyName}`;
            } else if (alreadySaved) {
                // Already inserted to DB by ApplicationTracker — just update local state
                finalApps = [updatedData, ...applications];
                activityType = 'APPLICATION';
                activityDesc = `Applied to ${dbPayload.companyName}`;
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
                streak: Math.round(newStreakValue || 0),
                last_activity: todayISO
            });

        if (profileSyncError) {
            console.error("400 Error Details:", profileSyncError);
            return toast.error("Sync failed");
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
        saveUserStats({
            ...userStats,
            ...progress,
            currentStreak: newStreakValue,
            lastActivityDate: todayISO,
            totalApplications: finalApps.length
        });

        if (!logErr && newLog) {
            setActivities(prev => [newLog, ...prev].slice(0, 5));
        }

        toast.success(deletedId ? "Deleted" : "Saved");
    };

    return (
        <div className="flex h-screen w-full bg-[#FCFBF4] overflow-hidden">
            <Navigation userStats={userStats} profile={profile} />
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div className="bg-white border-b-4 border-zinc-900 px-6 py-4 flex justify-between items-center z-10">
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase">
                        Intern<span className="text-[#EBBB49]">Linked</span>
                    </h1>
                    <button onClick={() => supabase.auth.signOut()} className="px-4 py-2 border-2 border-zinc-900 bg-zinc-900 text-white text-[10px] font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Exit Session</button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 lg:p-8">
                    {/* Keep all views mounted — show/hide with CSS so state is never lost */}
                    <div style={{ display: location.pathname === '/dashboard' || location.pathname === '/' ? 'block' : 'none' }}>
                        <SimpleDashboard userStats={userStats} activities={activities} />
                    </div>
                    <div style={{ display: location.pathname === '/applications' ? 'block' : 'none' }}>
                        <ApplicationTracker applications={applications} onUpdateApplications={handleUpdateApplications} />
                    </div>
                    <div style={{ display: location.pathname === '/jobs' ? 'block' : 'none' }}>
                        <JobMatches profile={profile} jobs={jobs} isLoading={jobsLoading} onRefresh={handleRefreshJobs} />
                    </div>
                    <div style={{ display: location.pathname === '/profile' ? 'block' : 'none' }}>
                        {profile && <ProfileView profile={profile} onUpdateProfile={setProfile} />}
                    </div>
                </div>
            </main>
            <Toaster position="bottom-right" />
        </div>
    );
}