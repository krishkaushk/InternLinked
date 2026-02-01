import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import SignIn from "./internlinked/app/components/SignIn";
import { OnboardingFlow } from "./internlinked/app/components/OnboardingFlow"; 
import InternLinkedApp from "./internlinked/app/InternLinkedApp";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
  
    const fetchProfile = async (userId) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
    
            if (error || !data) {
                setProfile({ onboarding_completed: false });
            } else {
                setProfile(data);
            }
        } catch (err) {
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
  
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCF0]">
                <h1 className="text-2xl font-black italic mb-4 uppercase">
                   <span className="text-black-600">Intern</span><span className="text-[#EBBB49]">Linked</span>
                </h1>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Initializing_System...</div>
            </div>
        );
    }
  
    if (!session) return <SignIn />;

    if (session && (!profile || profile.onboarding_completed === false)) {
        return <OnboardingFlow onComplete={() => fetchProfile(session.user.id)} />;
    }

    return <InternLinkedApp session={session} />;
}