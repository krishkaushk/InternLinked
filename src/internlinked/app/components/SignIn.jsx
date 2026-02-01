import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Loader2, Mail, Lock, X, Minus, Square } from "lucide-react";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function SignIn() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = isSignUp 
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Bevel styles for that Win95 feel
  const outdent = "border-t-white border-l-white border-b-zinc-800 border-r-zinc-800 border-2";
  const indent = "border-b-white border-r-white border-t-zinc-800 border-l-zinc-800 border-2";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#008080] font-mono p-4">
      {/* Main Window */}
      <div className={`w-full max-w-md bg-[#c0c0c0] ${outdent} shadow-xl`}>
        
        {/* Title Bar */}
        <div className="bg-[#000080] text-white flex items-center justify-between px-2 py-1 m-1">
          <span className="text-sm font-bold flex items-center gap-2">
            InternLinked.exe
          </span>
          <div className="flex gap-1">
            <button className={`bg-[#c0c0c0] text-black px-1 ${outdent} active:border-none`}><Minus size={12}/></button>
            <button className={`bg-[#c0c0c0] text-black px-1 ${outdent} active:border-none`}><Square size={10}/></button>
            <button className={`bg-[#c0c0c0] text-black px-1 ml-1 ${outdent} active:border-none`}><X size={12}/></button>
          </div>
        </div>

        {/* Form Area */}
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tighter uppercase">InternLinked</h1>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-1">
              <label className="text-sm font-bold">Username/Email:</label>
              <div className={`bg-white p-1 flex items-center ${indent}`}>
                <Mail className="size-4 text-zinc-500 mr-2" />
                <input
                  type="email"
                  className="w-full outline-none text-black bg-transparent"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold">Password:</label>
              <div className={`bg-white p-1 flex items-center ${indent}`}>
                <Lock className="size-4 text-zinc-500 mr-2" />
                <input
                  type="password"
                  className="w-full outline-none text-black bg-transparent"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className={`p-2 bg-red-100 text-red-700 text-xs ${outdent}`}>
                Error: {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-2 bg-[#c0c0c0] font-bold uppercase active:translate-y-[1px] ${outdent} hover:bg-zinc-300 transition-colors`}
            >
              {loading ? <Loader2 className="animate-spin mx-auto size-5" /> : (isSignUp ? "Create_Account" : "Login")}
            </button>
          </form>

          <div className="mt-8 pt-4 border-t border-zinc-500 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-blue-800 font-bold hover:underline"
            >
              {isSignUp ? "Already have a profile? Sign In" : "Need a new profile? Register here"}
            </button>
          </div>
        </div>
        
        {/* Status Bar */}
        <div className={`m-1 mt-0 px-2 py-0.5 text-[10px] text-zinc-600 ${indent}`}>
            Status: Ready
        </div>
      </div>
    </div>
  );
}