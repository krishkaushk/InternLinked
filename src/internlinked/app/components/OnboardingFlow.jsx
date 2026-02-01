import { useState } from 'react';
import { createClient } from "@supabase/supabase-js";
import { Card } from './ui/card'; // Fixed path if in same folder
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Upload, User, Briefcase, FileText, CheckCircle, X, Loader2, GraduationCap, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Bevel/Shadow Styles
const boxStyle = "border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
const inputStyle = "border-2 border-zinc-900 bg-white p-2 shadow-inner focus-within:ring-2 ring-zinc-200 transition-all";

export function OnboardingFlow({ onComplete }) {
    const [step, setStep] = useState(1);
    const [profile, setProfile] = useState({
        name: '', email: '', phone: '', location: '',
        skills: [], education: [], experience: [], resumes: [],
    });
    const [isParsing, setIsParsing] = useState(false);
    const [hasUploadedResume, setHasUploadedResume] = useState(false);
    const [uploadedApplications, setUploadedApplications] = useState([]);

    const totalSteps = 4;
    const progress = (step / totalSteps) * 100;

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    // ... (Keep your existing handleResumeUpload, handleAddSkill, handleFileUpload functions here)

    const handleComplete = () => {
        const finalProfile = {
            id: crypto.randomUUID(),
            name: profile.name || 'User',
            email: profile.email || '',
            phone: profile.phone,
            location: profile.location,
            skills: profile.skills || [],
            education: profile.education || [],
            experience: profile.experience || [],
            resumes: profile.resumes || [],
        };

        const applications = uploadedApplications.map((app) => ({
            id: crypto.randomUUID(),
            companyName: app.companyName,
            position: app.position,
            status: app.status,
            dateAdded: new Date(),
            location: profile.location || 'Remote',
            jobType: app.jobType,
            notes: app.notes,
        }));

        onComplete(finalProfile, applications);
        toast.success('Welcome to InternLinked! 🎉');
    };

    const canProceedStep1 = profile.name && profile.email;
    const canProceedStep2 = hasUploadedResume;

    return (
        <div className="min-h-screen bg-[#FDFCF0] font-sans flex items-center justify-center p-4">
            {/* LOGOUT BUTTON */}
            <div className="fixed top-6 right-6 z-50">
                <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-zinc-900 text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-red-50 hover:text-red-600 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                >
                    <LogOut size={14} />
                    Cancel_Setup
                </button>
            </div>

            <div className="w-full max-w-3xl">
                {/* WIZARD HEADER */}
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-zinc-900">
                        Intern<span className="text-primary">Linked</span>
                    </h1>
                    <div className="mt-4 flex flex-col items-center">
                        <div className={`w-64 h-3 bg-zinc-200 ${boxStyle} shadow-none overflow-hidden`}>
                            <div 
                                className="h-full bg-zinc-900 transition-all duration-500" 
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-[10px] font-bold text-zinc-400 mt-2 uppercase tracking-[0.2em]">
                            Progress: Step {step} of {totalSteps}
                        </p>
                    </div>
                </div>

                <div className={`bg-white ${boxStyle} overflow-hidden`}>
                    {/* Window Title Bar */}
                    <div className="bg-zinc-900 text-white px-4 py-2 flex justify-between items-center border-b-2 border-zinc-900">
                        <span className="text-[10px] font-black uppercase tracking-widest">Setup_Wizard.exe</span>
                        <div className="flex gap-2">
                            <div className="size-2 rounded-full bg-zinc-700" />
                            <div className="size-2 rounded-full bg-zinc-700" />
                        </div>
                    </div>

                    <div className="p-8">
                        {step === 1 && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 mb-6 border-b-2 border-zinc-100 pb-4">
                                    <div className={`p-3 bg-[#FDFCF0] ${boxStyle} shadow-none`}>
                                        <User className="size-6 text-zinc-900" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black uppercase tracking-tight">Identity Profile</h2>
                                        <p className="text-xs font-bold text-zinc-400">Initialize your core user data</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase">Full Name *</Label>
                                        <div className={inputStyle}>
                                            <Input 
                                                className="border-none focus-visible:ring-0 shadow-none p-0 h-auto"
                                                placeholder="John Doe" 
                                                value={profile.name} 
                                                onChange={(e) => setProfile({ ...profile, name: e.target.value })} 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase">Email *</Label>
                                        <div className={inputStyle}>
                                            <Input 
                                                className="border-none focus-visible:ring-0 shadow-none p-0 h-auto"
                                                type="email" 
                                                placeholder="john@example.com" 
                                                value={profile.email} 
                                                onChange={(e) => setProfile({ ...profile, email: e.target.value })} 
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex justify-end pt-6 border-t-2 border-zinc-100 mt-8">
                                    <button 
                                        onClick={() => setStep(2)} 
                                        disabled={!canProceedStep1}
                                        className={`px-8 py-3 font-black uppercase text-sm tracking-widest bg-primary hover:bg-primary/90 disabled:opacity-50 ${boxStyle}`}
                                    >
                                        Next_Step &gt;
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ... Steps 2, 3, 4 would follow the same pattern ... */}
                        {/* Summary of logic: replace shadcn buttons with our custom retro button style */}
                        
                        {step === 2 && (
                             <div className="space-y-6">
                                <div className="flex items-center gap-4 mb-6 border-b-2 border-zinc-100 pb-4">
                                    <div className={`p-3 bg-[#FDFCF0] ${boxStyle} shadow-none`}>
                                        <FileText className="size-6 text-zinc-900" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black uppercase tracking-tight">Data Extraction</h2>
                                        <p className="text-xs font-bold text-zinc-400">Upload PDF for automatic parsing</p>
                                    </div>
                                </div>

                                {!hasUploadedResume ? (
                                    <div className={`border-2 border-dashed border-zinc-300 p-12 text-center hover:bg-zinc-50 transition-colors cursor-pointer`}>
                                        <input type="file" accept=".pdf" onChange={handleResumeUpload} className="hidden" id="resume-upload" disabled={isParsing} />
                                        <label htmlFor="resume-upload" className="cursor-pointer">
                                            {isParsing ? (
                                                <Loader2 className="size-10 text-zinc-900 mx-auto mb-4 animate-spin" />
                                            ) : (
                                                <Upload className="size-10 text-zinc-400 mx-auto mb-4" />
                                            )}
                                            <p className="text-sm font-black uppercase tracking-tighter">
                                                {isParsing ? "Scanning_Document..." : "Drop_Resume_Here"}
                                            </p>
                                        </label>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="bg-green-50 border-2 border-green-900 p-4 text-green-900 flex items-center gap-3">
                                            <CheckCircle className="size-5" />
                                            <span className="text-xs font-black uppercase">Parse_Success: Review Skills</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.skills?.map((skill, i) => (
                                                <div key={i} className="flex items-center gap-2 px-3 py-1 bg-white border-2 border-zinc-900 text-[10px] font-black uppercase">
                                                    {skill}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between pt-6 border-t-2 border-zinc-100 mt-8">
                                    <button onClick={() => setStep(1)} className="text-[10px] font-black uppercase underline">Back</button>
                                    <button onClick={() => setStep(3)} disabled={!canProceedStep2} className={`px-8 py-3 font-black uppercase text-sm tracking-widest bg-primary ${boxStyle}`}>Next_Step &gt;</button>
                                </div>
                             </div>
                        )}
                    </div>
                    
                    {/* Status Bar */}
                    <div className="bg-zinc-50 border-t-2 border-zinc-900 px-4 py-1.5 flex justify-between items-center">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">
                            Wizard_Status: Step_{step}_Active
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}