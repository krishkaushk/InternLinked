import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Separator } from '@/app/components/ui/separator';
import {
    User, Mail, Phone, MapPin, Briefcase,
    GraduationCap, FileText, Plus, Edit,
    Upload, CheckCircle, X, Calendar, BookOpen, Loader2, ExternalLink
} from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function ProfileView({ profile, onUpdateProfile }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedProfile, setEditedProfile] = useState(profile);
    const [newSkill, setNewSkill] = useState('');
    const [isUploadingResume, setIsUploadingResume] = useState(false);

    const boxStyle = "border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none";
    const inputStyle = "border-2 border-zinc-900 bg-white p-2 shadow-inner focus-within:ring-2 ring-[#EBBB49] transition-all rounded-none";
    const yellowBtn = "bg-[#EBBB49] hover:bg-[#d4a942] text-zinc-900 font-black uppercase text-xs tracking-widest border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none rounded-none";

    const handleSave = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase.from('profiles').update({
                name: editedProfile.name,
                location: editedProfile.location,
                school: editedProfile.school,
                major: editedProfile.major,
                minor: editedProfile.minor,
                skills: editedProfile.skills,
            }).eq('id', user.id);
            if (error) throw error;
            onUpdateProfile(editedProfile);
            setIsEditing(false);
            toast.success('Profile saved');
        } catch (err) {
            toast.error(`Save failed: ${err.message}`);
        }
    };

    const handleResumeUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingResume(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const filePath = `${user.id}/resume_${Date.now()}.pdf`;
            const { error: uploadError } = await supabase.storage.from('resumes').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(filePath);
            const { error: updateError } = await supabase.from('profiles').update({ resume_url: publicUrl }).eq('id', user.id);
            if (updateError) throw updateError;
            const updated = { ...editedProfile, resume_url: publicUrl };
            setEditedProfile(updated);
            onUpdateProfile(updated);
            toast.success('Resume updated');
        } catch (err) {
            toast.error(`Upload failed: ${err.message}`);
        } finally {
            setIsUploadingResume(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-4 pb-20">
            {/* Header / Identity Card */}
            <div className={`bg-white p-8 flex flex-col md:flex-row items-center gap-6 ${boxStyle}`}>
                <div className="size-24 bg-[#EBBB49] border-2 border-zinc-900 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <User size={48} strokeWidth={2.5} />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter text-zinc-900">
                        {profile.name}
                    </h1>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase text-zinc-500">
                            <MapPin size={14} /> {profile.location || "Location not set"}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase text-[#EBBB49] bg-zinc-900 px-2 py-0.5">
                            Level {profile.level || 1} Intern
                        </span>
                    </div>
                </div>
                <Button className={yellowBtn} onClick={() => setIsEditing(!isEditing)}>
                    <Edit className="size-4 mr-2" />
                    {isEditing ? "Cancel Edit" : "Edit Profile"}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Academics & Skills */}
                <div className="md:col-span-2 space-y-8">
                    
                    {/* Education Card */}
                    <Card className={`p-6 bg-white ${boxStyle}`}>
                        <div className="flex items-center gap-2 border-b-2 border-zinc-100 pb-4 mb-4">
                            <GraduationCap className="text-[#EBBB49]" />
                            <h2 className="font-black uppercase text-sm tracking-widest">Academic Background</h2>
                        </div>

                        {isEditing ? (
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase">Institution</Label>
                                    <Input className={inputStyle} value={editedProfile.school} onChange={e => setEditedProfile({...editedProfile, school: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold uppercase">Major</Label>
                                        <Input className={inputStyle} value={editedProfile.major} onChange={e => setEditedProfile({...editedProfile, major: e.target.value})} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold uppercase">Minor</Label>
                                        <Input className={inputStyle} value={editedProfile.minor} onChange={e => setEditedProfile({...editedProfile, minor: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-zinc-900 uppercase">{profile.school || "No Institution Set"}</h3>
                                <div className="flex items-center gap-2 text-sm font-bold text-zinc-600">
                                    <BookOpen size={16} className="text-[#EBBB49]" />
                                    <span>{profile.major} {profile.minor && <span className="text-zinc-400">/ {profile.minor}</span>}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-400 pt-2">
                                    <Calendar size={14} /> 
                                    {profile.school_start_date || "???"} — {profile.grad_date || "???"}
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Skills Matrix */}
                    <Card className={`p-6 bg-white ${boxStyle}`}>
                        <div className="flex items-center gap-2 border-b-2 border-zinc-100 pb-4 mb-4">
                            <Briefcase className="text-[#EBBB49]" />
                            <h2 className="font-black uppercase text-sm tracking-widest">Skills Matrix</h2>
                        </div>
                        {isEditing ? (
                            <div className="flex flex-wrap gap-2 p-3 bg-zinc-50 border-2 border-zinc-900 min-h-[50px]">
                                {editedProfile.skills?.map((skill) => (
                                    <span key={skill} className="flex items-center gap-1.5 px-3 py-1 bg-[#EBBB49] border-2 border-zinc-900 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        {skill}
                                        <X size={12} className="cursor-pointer" onClick={() => setEditedProfile({...editedProfile, skills: editedProfile.skills.filter(s => s !== skill)})} />
                                    </span>
                                ))}
                                <input
                                    className="bg-transparent outline-none text-[10px] font-bold uppercase flex-1 min-w-[100px]"
                                    placeholder="+ Add skill, press Enter"
                                    value={newSkill}
                                    onChange={e => setNewSkill(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && newSkill.trim()) {
                                            e.preventDefault();
                                            if (!editedProfile.skills?.includes(newSkill.trim())) {
                                                setEditedProfile({...editedProfile, skills: [...(editedProfile.skills || []), newSkill.trim()]});
                                            }
                                            setNewSkill('');
                                        }
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {profile.skills?.map((skill) => (
                                    <Badge key={skill} className="bg-zinc-100 text-zinc-900 border-2 border-zinc-900 rounded-none font-black text-[10px] uppercase px-3 py-1">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right Column: Contact & Quick Stats */}
                <div className="space-y-8">
                    <Card className={`p-6 bg-zinc-900 text-white ${boxStyle} shadow-[4px_4px_0px_0px_#EBBB49]`}>
                        <h2 className="font-black uppercase text-[10px] tracking-[0.2em] text-[#EBBB49] mb-4">Contact</h2>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Mail size={16} className="text-[#EBBB49]" />
                                <span className="text-xs font-bold truncate">{profile.email}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone size={16} className="text-[#EBBB49]" />
                                <span className="text-xs font-bold">{profile.phone || "Not Linked"}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Resume Card */}
                    <Card className={`p-6 bg-white ${boxStyle}`}>
                        <div className="flex items-center gap-2 border-b-2 border-zinc-100 pb-4 mb-4">
                            <FileText className="text-[#EBBB49]" />
                            <h2 className="font-black uppercase text-sm tracking-widest">Resume</h2>
                        </div>
                        {profile.resume_url ? (
                            <div className="space-y-3">
                                <a
                                    href={profile.resume_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs font-black uppercase text-zinc-700 hover:text-[#EBBB49] transition-colors"
                                >
                                    <ExternalLink size={14} /> View Current Resume
                                </a>
                                <label className={`flex items-center justify-center gap-2 w-full py-3 cursor-pointer border-2 border-dashed border-zinc-400 hover:border-zinc-900 hover:bg-zinc-50 transition-all text-[10px] font-black uppercase text-zinc-500`}>
                                    {isUploadingResume ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                    {isUploadingResume ? 'Uploading...' : 'Replace Resume'}
                                    <input type="file" accept=".pdf" className="hidden" onChange={handleResumeUpload} disabled={isUploadingResume} />
                                </label>
                            </div>
                        ) : (
                            <label className={`flex items-center justify-center gap-2 w-full py-6 cursor-pointer border-2 border-dashed border-zinc-400 hover:border-zinc-900 hover:bg-zinc-50 transition-all text-[10px] font-black uppercase text-zinc-500`}>
                                {isUploadingResume ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                {isUploadingResume ? 'Uploading...' : 'Upload Resume'}
                                <input type="file" accept=".pdf" className="hidden" onChange={handleResumeUpload} disabled={isUploadingResume} />
                            </label>
                        )}
                    </Card>

                    {isEditing && (
                        <Button className={`w-full py-6 ${yellowBtn}`} onClick={handleSave}>
                            Save
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}