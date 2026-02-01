import { useState } from 'react';
import { createClient } from "@supabase/supabase-js";
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Upload, X, Loader2, CheckCircle } from 'lucide-react';
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
        school: '',
        major: '',
        minor: '',
        schoolStartDate: '', 
        gradDate: '',       
        skills: [],
    });

    const boxStyle = "border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
    const inputStyle = "border-2 border-zinc-900 bg-white p-2 shadow-inner focus-within:ring-2 ring-[#EBBB49] transition-all";

    const handleFileProcess = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        const loadingToast = toast.loading('Neural Engine: Scanning...');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const filePath = `${user.id}/resume_${Date.now()}.pdf`;
            
            await supabase.storage.from('resumes').upload(filePath, file);
            const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(filePath);
            setResumeUrl(publicUrl);

            const response = await fetch(`https://extraction-api.nanonets.com/api/v1/extract/sync`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${import.meta.env.VITE_NANONETS_API_KEY}` },
                body: (() => { const fd = new FormData(); fd.append('file', file); return fd; })()
            });

            const result = await response.json();
            const extracted = result.data?.[0]?.prediction || [];
            const findText = (label) => extracted.find(p => p.label.toLowerCase().includes(label))?.ocr_text || "";

            setProfile(prev => ({
                ...prev,
                firstName: findText('name').split(' ')[0] || prev.firstName,
                lastName: findText('name').split(' ').pop() || prev.lastName,
                location: findText('city') || findText('address') || prev.location,
                school: findText('university') || findText('school') || prev.school,
                major: findText('degree') || findText('major') || prev.major,
                skills: [...new Set([...prev.skills, ...extracted.filter(p => p.label === 'skills').map(p => p.ocr_text)])]
            }));

            toast.dismiss(loadingToast);
            toast.success('Sync Complete');
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error('Scan failed.');
        } finally {
            setIsParsing(false);
        }
    };

    const handleComplete = async () => {
        // Clear state and block if names are missing
        if (!profile.firstName || !profile.lastName) {
            toast.error("First and Last Name required.");
            return;
        }

        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Authentication session lost.");

            const { error: upsertError } = await supabase
                .from('profiles')
                .upsert({ 
                    id: user.id,
                    name: `${profile.firstName} ${profile.lastName}`.trim(),
                    location: profile.location,
                    school: profile.school,
                    major: profile.major,
                    minor: profile.minor,
                    school_start_date: profile.schoolStartDate ? `${profile.schoolStartDate}-01` : null,
                    grad_date: profile.gradDate ? `${profile.gradDate}-01` : null,
                    skills: profile.skills,
                    onboarding_completed: true,
                    xp: 150
                });

            if (upsertError) throw upsertError;
            
            toast.success("Profile Activated");
            onComplete(); // <--- This triggers App.jsx to switch to Dashboard
            
        } catch (err) {
            console.error("Critical Save Error:", err);
            toast.error(`Error: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCF0] font-sans flex items-center justify-center p-4">
            <div className={`w-full max-w-2xl bg-white ${boxStyle}`}>
                <div className="bg-zinc-900 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest italic">
                <span className="text-black-600">Intern</span>
                <span className="text-[#EBBB49]">Linked</span>
                    
                </div>

                <div className="p-8 space-y-6">
                    {/* RESUME DROP */}
                    <div className="bg-zinc-50 border-2 border-dashed border-zinc-300 p-6 text-center hover:border-[#EBBB49] transition-all cursor-pointer">
                        <input type="file" id="res-up" className="hidden" accept=".pdf" onChange={handleFileProcess} disabled={isParsing} />
                        <label htmlFor="res-up" className="cursor-pointer">
                            {isParsing ? <Loader2 className="animate-spin size-8 mx-auto text-[#EBBB49]" /> : 
                             resumeUrl ? <CheckCircle className="size-8 mx-auto text-green-500" /> : 
                             <Upload className="size-8 mx-auto text-zinc-400" />}
                            <p className="mt-2 text-[10px] font-black uppercase italic">Drop Resume to Sync</p>
                        </label>
                    </div>

                    {/* NAMES */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase text-zinc-500">First Name <span className="text-red-500">*</span></Label>
                            <div className={inputStyle}><input className="w-full bg-transparent outline-none text-sm" value={profile.firstName} onChange={e => setProfile({...profile, firstName: e.target.value})} /></div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase text-zinc-500">Middle</Label>
                            <div className={inputStyle}><input className="w-full bg-transparent outline-none text-sm" value={profile.middleName} onChange={e => setProfile({...profile, middleName: e.target.value})} /></div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase text-zinc-500">Last Name <span className="text-red-500">*</span></Label>
                            <div className={inputStyle}><input className="w-full bg-transparent outline-none text-sm" value={profile.lastName} onChange={e => setProfile({...profile, lastName: e.target.value})} /></div>
                        </div>
                    </div>

                    {/* SEPARATE ROW: CITY */}
                    <div className="space-y-1 border-t-2 border-zinc-100 pt-4">
                        <Label className="text-[10px] font-black uppercase text-zinc-500">City / Current Location <span className="text-red-500">*</span></Label>
                        <div className={inputStyle}><input className="w-full bg-transparent outline-none text-sm" value={profile.location} onChange={e => setProfile({...profile, location: e.target.value})} /></div>
                    </div>

                    {/* SEPARATE ROW: SCHOOL */}
                    <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-zinc-500">Institution / University <span className="text-red-500">*</span></Label>
                        <div className={inputStyle}><input className="w-full bg-transparent outline-none text-sm" placeholder="e.g. Stanford University" value={profile.school} onChange={e => setProfile({...profile, school: e.target.value})} /></div>
                    </div>

                    {/* MAJORS & DATES */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase text-zinc-500">Major <span className="text-red-500">*</span></Label>
                            <div className={inputStyle}><input className="w-full bg-transparent outline-none text-sm" value={profile.major} onChange={e => setProfile({...profile, major: e.target.value})} /></div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase text-zinc-500">Minor (if applicable)</Label>
                            <div className={inputStyle}><input className="w-full bg-transparent outline-none text-sm" value={profile.minor} onChange={e => setProfile({...profile, minor: e.target.value})} /></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase text-zinc-500">Start (MONTH/YEAR) <span className="text-red-500">*</span></Label>
                            <div className={inputStyle}><input type="month" className="w-full bg-transparent outline-none text-xs uppercase" value={profile.schoolStartDate} onChange={e => setProfile({...profile, schoolStartDate: e.target.value})} /></div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase text-zinc-500">Expected Grad (MONTH/YEAR) <span className="text-red-500">*</span></Label>
                            <div className={inputStyle}><input type="month" className="w-full bg-transparent outline-none text-xs uppercase" value={profile.gradDate} onChange={e => setProfile({...profile, gradDate: e.target.value})} /></div>
                        </div>
                    </div>

                    {/* SKILLS */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-zinc-500">Skills</Label>
                        <div className="flex flex-wrap gap-2 p-3 bg-zinc-50 border-2 border-zinc-900 shadow-inner min-h-[50px]">
                            {profile.skills.map((s, i) => (
                                <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-[#EBBB49] border-2 border-zinc-900 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    {s} <X size={12} className="cursor-pointer" onClick={() => setProfile({...profile, skills: profile.skills.filter(x => x !== s)})} />
                                </span>
                            ))}
                            <input 
                                className="bg-transparent outline-none text-[10px] font-bold uppercase flex-1 min-w-[100px]"
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

                    <div className="flex justify-end pt-4">
                        <button 
                            onClick={handleComplete} 
                            disabled={isSaving || !profile.firstName || !profile.lastName}
                            className={`px-12 py-4 bg-[#EBBB49] font-black uppercase text-xs tracking-widest ${boxStyle} 
                                ${ (isSaving || !profile.firstName || !profile.lastName) ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:bg-[#d4a942] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all'}`}
                        >
                            {isSaving ? "Syncing..." : "Complete Setup >"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}