import { useState } from 'react';
import { Navigation } from "./components/Navigation";
import { SimpleDashboard } from "./components/SimpleDashboard";
import { ApplicationTracker } from "./components/ApplicationTracker";
import { ProfileView } from "./components/ProfileView";
import { OnboardingFlow } from "./components/OnboardingFlow";
import { JobMatches } from "./components/JobMatches";

// The data folder is one level up from the current 'app' folder
import { mockUserStats } from "../data/mockData";

// The UI components are inside a 'ui' subfolder within 'components'
import { Toaster } from "./components/ui/sonner";

export default function InternLinkedApp() {
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
    const [currentView, setCurrentView] = useState('dashboard');
    const [applications, setApplications] = useState([]);
    const [profile, setProfile] = useState(null);
    const [userStats, setUserStats] = useState(mockUserStats);

    // Removed Type Annotations: (newProfile, newApplications)
    const handleOnboardingComplete = (newProfile, newApplications) => {
        setProfile(newProfile);
        setApplications(newApplications);

        const xpGained = newApplications.length * 10;
        const newXP = userStats.xp + xpGained;
        const newLevel = Math.floor(newXP / userStats.xpToNextLevel) + userStats.level;

        setUserStats({
            ...userStats,
            totalApplications: newApplications.length,
            xp: newXP % userStats.xpToNextLevel,
            level: newLevel,
        });

        setHasCompletedOnboarding(true);
    };

    // Removed Type Annotation: (updatedApplications)
    const handleUpdateApplications = (updatedApplications) => {
        const previousCount = applications.length;
        const newCount = updatedApplications.length;

        if (newCount > previousCount) {
            const xpGained = (newCount - previousCount) * 10;
            const newXP = userStats.xp + xpGained;
            const levelsGained = Math.floor(newXP / userStats.xpToNextLevel);

            setUserStats({
                ...userStats,
                totalApplications: newCount,
                xp: newXP % userStats.xpToNextLevel,
                level: userStats.level + levelsGained,
                interviewsScheduled: updatedApplications.filter(app => app.status === 'interview').length,
                offersReceived: updatedApplications.filter(app => app.status === 'offer').length,
            });
        } else {
            setUserStats({
                ...userStats,
                totalApplications: newCount,
                interviewsScheduled: updatedApplications.filter(app => app.status === 'interview').length,
                offersReceived: updatedApplications.filter(app => app.status === 'offer').length,
            });
        }

        setApplications(updatedApplications);
    };

    if (!hasCompletedOnboarding) {
        return <OnboardingFlow onComplete={handleOnboardingComplete} />;
    }

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <SimpleDashboard userStats={userStats} />;
            case 'job-matches':
                return <JobMatches profile={profile} />;
            case 'applications':
                return (
                    <ApplicationTracker
                        applications={applications}
                        onUpdateApplications={handleUpdateApplications}
                    />
                );
            case 'profile':
                return profile ? (
                    <ProfileView profile={profile} onUpdateProfile={setProfile} />
                ) : null;
            default:
                return <SimpleDashboard userStats={userStats} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation
                currentView={currentView}
                onViewChange={setCurrentView}
                userStats={userStats}
            />

            <main className="lg:pl-64 pt-16 lg:pt-0">
                <div className="bg-white border-b px-6 py-4 flex justify-end">
                    <h1 className="text-2xl font-bold text-gray-900">InternLinked</h1>
                </div>

                <div className="p-6 lg:p-8">
                    {renderView()}
                </div>
            </main>

            <Toaster />
        </div>
    );
}