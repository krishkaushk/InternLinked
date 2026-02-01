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
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for Auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === 'SIGNED_IN' && session?.user?.last_sign_in_at === session?.user?.created_at) {
        setIsNewUser(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;

  // 1. If not logged in -> Show Sign In
  if (!session) {
    return <SignIn />;
  }

  // 2. If just signed up -> Show Onboarding
  if (isNewUser) {
    return <OnboardingFlow onComplete={() => setIsNewUser(false)} />;
  }

  // 3. If logged in -> Show the main App (Dashboard)
  return <InternLinkedApp session={session} />;
}