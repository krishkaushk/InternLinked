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

  // Modern-retro: Flat borders with a "hard" drop shadow
  const boxStyle = "border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
  const inputStyle = "border-2 border-zinc-900 bg-white p-2 shadow-inner";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#92B6F0] font-sans p-4">
          {/* Main Window Container */}
      <div className={`w-full max-w-md bg-white ${boxStyle}`}>
        
        {/* Simplified Header Bar (Hints at retro without the blue gradient) */}
        <div className="bg-zinc-900 text-white flex items-center justify-between px-3 py-2">
          <span className="text-xs font-bold tracking-widest uppercase">
            
          </span>
          <div className="flex gap-3">
            <Minus size={14} className="cursor-pointer hover:text-primary transition-colors" />
            <Square size={12} className="cursor-pointer hover:text-primary transition-colors" />
            <X size={14} className="cursor-pointer hover:text-primary transition-colors" />
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8">
          <div className="mb-10 text-left border-b-2 border-zinc-100 pb-4">
          <h1 className="text-4xl font-black italic tracking-tighter uppercase">
            <span className="text-black-600">Intern</span>
            <span className="text-[#EBBB49]">Linked</span>
            </h1>
            <p className="text-xs font-bold text-zinc-400 mt-1 uppercase tracking-widest">
              {isSignUp ? "User Registration" : "User Authentication"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-tight">Email Address</label>
              <div className={`flex items-center ${inputStyle} focus-within:ring-2 ring-primary/20 transition-all`}>
                <Mail className="size-4 text-zinc-400 mr-3" />
                <input
                  type="email"
                  className="w-full outline-none text-sm font-medium text-black bg-transparent"
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-tight">Secure Password</label>
              <div className={`flex items-center ${inputStyle} focus-within:ring-2 ring-primary/20 transition-all`}>
                <Lock className="size-4 text-zinc-400 mr-3" />
                <input
                  type="password"
                  className="w-full outline-none text-sm font-medium text-black bg-transparent"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border-2 border-red-900 text-red-900 text-xs font-bold uppercase tracking-tighter">
                System Error: {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-3 bg-primary text-black font-black uppercase tracking-widest text-sm transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${boxStyle.replace('shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]', 'shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]')} hover:bg-primary/90`}
            >
              {loading ? (
                <Loader2 className="animate-spin mx-auto size-5" />
              ) : (
                isSignUp ? "Create Profile" : "Access System"
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-primary transition-colors underline decoration-2 underline-offset-4"
            >
              {isSignUp ? "Switch to Login" : "Initialize New Account"}
            </button>
          </div>
        </div>
        
        {/* Subtle Bottom Bar */}
        <div className="bg-zinc-50 border-t-2 border-zinc-900 px-4 py-2 flex justify-between items-center">
          <div className="flex gap-1">
            <div className="size-2 bg-green-500 rounded-full border border-zinc-900" />
            <div className="size-2 bg-zinc-200 rounded-full border border-zinc-900" />
          </div>
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">
            
          </span>
        </div>
      </div>
    </div>
  );
}