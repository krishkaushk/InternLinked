import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Paths updated to match: src/internlinked/app/components/
import SignIn from "./internlinked/app/components/SignIn";
import { OnboardingFlow } from "./internlinked/app/components/OnboardingFlow"; 
import InternLinkedApp from "./internlinked/app/InternLinkedApp";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null); // Track the DB profile
    const [loading, setLoading] = useState(true);
  
    const fetchProfile = async (userId) => {
        // Use a try/catch to handle cases where the profile doesn't exist yet
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', userId)
            .single();
      
          if (error) throw error;
          setProfile(data);
        } catch (err) {
          console.log("Profile not found, staying in onboarding.");
          setProfile({ onboarding_completed: false });
        } finally {
          setLoading(false);
        }
      };
  
    useEffect(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session) fetchProfile(session.user.id);
        else setLoading(false);
      });
  
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (session) fetchProfile(session.user.id);
        else {
          setProfile(null);
          setLoading(false);
        }
      });
  
      return () => subscription.unsubscribe();
    }, []);
  
    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FDFCF0]">Initializing_System...</div>;
  
    if (!session) return <SignIn />;

            // App.jsx

        // Change your onboarding check to this:
        if (!loading && session) {
            // If no profile exists yet, or onboarding isn't finished
            if (!profile || profile.onboarding_completed === false) {
                return (
                    <OnboardingFlow 
                        onComplete={() => fetchProfile(session.user.id)} 
                    />
                );
            }
        }

        // Otherwise, show the dashboard
        return <InternLinkedApp session={session} />;
        }