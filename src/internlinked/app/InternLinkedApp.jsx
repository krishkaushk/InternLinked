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
        level: 1, xp: 0, xpToNextLevel: 500, currentStreak: 0,
        totalApplications: 0, interviewsScheduled: 0, offersReceived: 0,
        badges: [], lastActivityDate: null
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (profileData) setProfile(profileData);

            const { data: apps } = await supabase.from('applications').select('*').order('created_at', { ascending: false });

            if (apps) {
                const mappedApps = apps.map(app => ({
                    ...app,
                    companyName: app.companyName || app.company,
                    position: app.position || app.role,
                    cv_url: app.cv_url || app.resume_url
                }));
                setApplications(mappedApps);

                const progress = calculateUserProgress(mappedApps, mockActivities, mockBadges);
                setUserStats(prev => ({
                    ...prev, ...progress,
                    totalApplications: mappedApps.length,
                    currentStreak: profileData?.current_streak || 0
                }));
            }
        };
        fetchInitialData();
    }, []);

    const handleUpdateApplications = async (updatedData, deletedId) => {
        if (deletedId) {
            const { error } = await supabase.from('applications').delete().eq('id', deletedId);
            if (error) return toast.error(error.message);

            const updatedApps = applications.filter(app => app.id !== deletedId);
            setApplications(updatedApps);
            const progress = calculateUserProgress(updatedApps, mockActivities, mockBadges);
            setUserStats(prev => ({ ...prev, ...progress, totalApplications: updatedApps.length }));
            toast.success("ENTRY_DELETED");
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const isEditing = updatedData.id && applications.some(a => a.id === updatedData.id);

        const dbPayload = {
            user_id: user.id,
            companyName: updatedData.companyName,
            position: updatedData.position,
            status: updatedData.status,
            notes: updatedData.notes,
            cv_url: updatedData.cv_url,
            jobType: updatedData.jobType,
            jobUrl: updatedData.jobUrl
        };

        if (isEditing) {
            const { error } = await supabase.from('applications').update(dbPayload).eq('id', updatedData.id);
            if (error) return toast.error(error.message);

            setApplications(apps => apps.map(a => a.id === updatedData.id ? { ...a, ...updatedData } : a));
            toast.success("RECORD_UPDATED");
        } else {
            const { data, error } = await supabase.from('applications').insert([dbPayload]).select();
            if (error) return toast.error(error.message);

            const newApp = {
                ...data[0],
                companyName: data[0].companyName,
                position: data[0].position,
                cv_url: data[0].cv_url
            };
            setApplications(prev => [newApp, ...prev]);
            toast.success("ENTRY_INITIALIZED");
        }
    };

    const renderView = () => {
        switch (currentView) {
            case 'dashboard': return <SimpleDashboard userStats={userStats} activities={mockActivities} />;
            case 'applications': return <ApplicationTracker applications={applications} onUpdateApplications={handleUpdateApplications} />;
            case 'profile': return profile ? <ProfileView profile={profile} onUpdateProfile={setProfile} /> : null;
            default: return <SimpleDashboard userStats={userStats} />;
        }
    };

    return (
        /* FIX: Changed to flex-row and h-screen to lock sidebar height */
        <div className="flex h-screen w-full bg-[#FCFBF4] overflow-hidden">
            {/* Navigation component spans 100% height */}
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

            <Toaster position="bottom-right" toastOptions={{ className: 'rounded-none border-2 border-zinc-900 font-bold uppercase text-[10px]' }} />
        </div>
    );
}