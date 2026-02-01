import { useState } from 'react';
import { createClient } from "@supabase/supabase-js";
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Upload, X, Loader2, FileCheck, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function OnboardingFlow({ onComplete }) {
    const [isParsing, setIsParsing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [skillInput, setSkillInput] = useState('');
    const [resumeUrl, setResumeUrl] = useState('');
    const [profile, setProfile] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        location: '',
        skills: [],
    });

    const boxStyle = "border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
    const inputStyle = "border-2 border-zinc-900 bg-white p-2 shadow-inner focus-within:ring-2 ring-[#EBBB49] transition-all";

    // --- UPLOAD & PARSE ---
    const handleFileProcess = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        const loadingToast = toast.loading('Initializing Neural Scan...');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            // 1. Storage Upload
            const filePath = `${user.id}/resume_${Date.now()}.pdf`;
            const { error: uploadError } = await supabase.storage
                .from('resumes')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(filePath);
            setResumeUrl(publicUrl);

            // 2. Nanonets Sync Call
            const response = await fetch(`https://extraction-api.nanonets.com/api/v1/extract/sync`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${import.meta.env.VITE_NANONETS_API_KEY}` },
                body: (() => {
                    const fd = new FormData();
                    fd.append('file', file);
                    return fd;
                })()
            });

            const result = await response.json();
            const extracted = result.data?.[0]?.prediction || [];
            const findText = (label) => extracted.find(p => p.label === label)?.ocr_text || "";

            setProfile(prev => ({
                ...prev,
                firstName: findText('name').split(' ')[0] || prev.firstName,
                lastName: findText('name').split(' ').pop() || prev.lastName,
                location: findText('city') || prev.location,
                skills: extracted.filter(p => p.label === 'skills').map(p => p.ocr_text)
            }));

            toast.dismiss(loadingToast);
            toast.success('Resume Synced!');
        } catch (error) {
            console.error(error);
            toast.dismiss(loadingToast);
            toast.error('Sync failed. Please enter details manually.');
        } finally {
            setIsParsing(false);
        }
    };

    // --- THE COMPLETE FUNCTION ---
    const handleComplete = async () => {
        // Validation: Ensure First and Last names are present
        if (!profile.firstName || !profile.lastName) {
            toast.error("First and Last name are required.");
            return;
        }

        setIsSaving(true);
        
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            const finalName = `${profile.firstName} ${profile.lastName}`.trim();

            // Update Database
            const { error: upsertError } = await supabase
                .from('profiles')
                .upsert({ 
                    id: user.id,
                    name: finalName,
                    onboarding_completed: true,
                    location: profile.location,
                    skills: profile.skills,
                    xp: 150
                });

            if (upsertError) throw upsertError;

            toast.success("Profile Activated!");
            // This triggers the view change in App.jsx
            onComplete(); 
            
        } catch (err) {
            console.error("Save Error:", err.message);
            toast.error(`Failed to save: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCF0] flex items-center justify-center p-4 font-sans">
            <div className={`w-full max-w-2xl bg-white ${boxStyle}`}>
                <div className="bg-zinc-900 text-white px-4 py-2 flex justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest italic">Setup_Wizard.exe</span>
                </div>

                <div className="p-8 space-y-6">
                    {/* TOP: AUTOFILL */}
                    <div className="bg-zinc-50 border-2 border-dashed border-zinc-300 p-6 text-center hover:bg-zinc-100 transition-all cursor-pointer relative">
                        <input type="file" id="resume-up" className="hidden" onChange={handleFileProcess} disabled={isParsing} />
                        <label htmlFor="resume-up" className="cursor-pointer">
                            {isParsing ? (
                                <Loader2 className="animate-spin size-10 mx-auto text-[#EBBB49]" />
                            ) : resumeUrl ? (
                                <CheckCircle className="size-10 mx-auto text-green-500" />
                            ) : (
                                <Upload className="size-10 mx-auto text-zinc-400" />
                            )}
                            <p className="mt-2 text-xs font-black uppercase tracking-tighter">
                                {isParsing ? "Neural_Extracting..." : "Sync_Resume_To_Autofill"}
                            </p>
                        </label>
                    </div>

                    {/* NAME FIELDS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase italic">First Name *</Label>
                            <div className={inputStyle}>
                                <input 
                                    className="w-full outline-none text-sm bg-transparent" 
                                    value={profile.firstName} 
                                    onChange={e => setProfile({...profile, firstName: e.target.value})} 
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase italic">Middle</Label>
                            <div className={inputStyle}>
                                <input 
                                    className="w-full outline-none text-sm bg-transparent" 
                                    value={profile.middleName} 
                                    onChange={e => setProfile({...profile, middleName: e.target.value})} 
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase italic">Last Name *</Label>
                            <div className={inputStyle}>
                                <input 
                                    className="w-full outline-none text-sm bg-transparent" 
                                    value={profile.lastName} 
                                    onChange={e => setProfile({...profile, lastName: e.target.value})} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* CITY & SKILLS */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase italic">Base City</Label>
                            <div className={inputStyle}>
                                <input 
                                    className="w-full outline-none text-sm bg-transparent" 
                                    value={profile.location} 
                                    onChange={e => setProfile({...profile, location: e.target.value})} 
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase italic">Skills Matrix</Label>
                            <div className="flex flex-wrap gap-2 p-3 bg-zinc-50 border-2 border-zinc-900 shadow-inner min-h-[50px]">
                                {profile.skills.map((s, i) => (
                                    <span key={i} className="flex items-center gap-1 px-3 py-1 bg-[#EBBB49] border-2 border-zinc-900 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        {s} 
                                        <X 
                                            size={10} 
                                            className="ml-1 cursor-pointer hover:text-white" 
                                            onClick={() => setProfile({...profile, skills: profile.skills.filter(x => x !== s)})} 
                                        />
                                    </span>
                                ))}
                                <input 
                                    className="bg-transparent outline-none text-[10px] font-bold uppercase flex-1 min-w-[120px]"
                                    placeholder="+ Add Skill"
                                    value={skillInput}
                                    onChange={e => setSkillInput(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && skillInput.trim()) {
                                            setProfile({...profile, skills: [...profile.skills, skillInput.trim()]});
                                            setSkillInput('');
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t-2 border-zinc-100">
                        <button 
                            onClick={handleComplete} 
                            disabled={isSaving || !profile.firstName || !profile.lastName}
                            className={`px-10 py-3 font-black uppercase text-sm tracking-widest bg-[#EBBB49] hover:bg-[#d4a942] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${boxStyle} ${isSaving || !profile.firstName || !profile.lastName ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                        >
                            {isSaving ? "SYNCING..." : "Complete_Setup >"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}