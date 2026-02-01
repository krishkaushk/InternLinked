import { useState } from 'react';
import { KanbanBoard } from './KanbanBoard';
import { ApplicationTable } from './ApplicationTable';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Plus, LayoutGrid, Table as TableIcon, X } from 'lucide-react';
import { createClient } from "@supabase/supabase-js";


const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function ApplicationTracker({ applications, onUpdateApplications }) {
    const [view, setView] = useState('kanban');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    const [cvFile, setCvFile] = useState(null);

    // 1. Add state for the application being edited
    const [selectedApp, setSelectedApp] = useState(null);

    // 2. Add a function to handle selection
    const handleEditClick = (app) => {
        setSelectedApp(app);
        setFormData({
            companyName: app.companyName || app.company_name,
            position: app.position,
            status: app.status,
            jobType: app.jobType || 'internship',
            jobUrl: app.jobUrl || '',
            notes: app.notes || '',
            cv_url: app.cv_url || null // Preserve the existing link here
        });
        setIsAddDialogOpen(true);
    };
    const [formData, setFormData] = useState({
        companyName: '',
        position: '',
        status: 'saved',
        jobType: 'internship',
        jobUrl: '',
        notes: ''
    });




    const uploadResume = async (file, appId) => {
        if (!file) return null;

        const fileExt = file.name.split('.').pop();
        const fileName = `${appId}-CV.${fileExt}`;
        const filePath = `cvs/${fileName}`; // Changed bucket to 'cvs'

        const { error: uploadError } = await supabase.storage
            .from('cvs') // Ensure this matches your Supabase bucket name
            .upload(filePath, file);

        if (uploadError) {
            console.error("Upload error:", uploadError.message);
            return null;
        }

        const { data } = supabase.storage.from('cvs').getPublicUrl(filePath);
        return data.publicUrl;
    };


    const handleAddApplication = async (e) => {
        e.preventDefault();

        let finalCvUrl = formData.cv_url; // Default to the existing URL
        const appId = selectedApp?.id || `app-${Date.now()}`;

        // Only upload if a NEW file was selected
        if (cvFile) {
            finalCvUrl = await uploadResume(cvFile, appId);
        }

        const appData = {
            id: appId,
            ...formData,
            cv_url: finalCvUrl, // Use the new one OR keep the old one
            dateAdded: selectedApp?.dateAdded || new Date(),
            matchScore: selectedApp?.matchScore || 85
        };

        // Send to your main update function (InternLinkedApp.jsx)
        onUpdateApplications(appData);

        // Reset everything
        setFormData({ companyName: '', position: '', status: 'saved', jobType: 'internship', jobUrl: '', notes: '', cv_url: null });
        setCvFile(null);
        setSelectedApp(null);
        setIsAddDialogOpen(false);
    };

    return (
        <div className="h-full flex flex-col relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-black uppercase italic text-zinc-900">Applications</h1>
                    <p className="text-gray-600 mt-1">Track and manage your internship pipeline</p>
                </div>
                {/* 4. White color button */}
                <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="border-2 border-zinc-900 bg-white text-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                >
                    <Plus className="size-4 mr-2" />
                    Add Application
                </Button>
            </div>

            <div className="mb-4">
                <Tabs value={view} onValueChange={(v) => setView(v)}>
                    <TabsList className="bg-white border-2 border-zinc-900">
                        <TabsTrigger value="kanban"><LayoutGrid className="size-4 mr-2" />Kanban</TabsTrigger>
                        <TabsTrigger value="table"><TableIcon className="size-4 mr-2" />Table</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* 2. Content: The new application will now show up here */}
            <div className="flex-1 overflow-hidden">
                {view === 'kanban' ? (
                    <KanbanBoard
                        applications={applications}
                        onSelectApplication={handleEditClick} // <--- DOUBLE CHECK THIS NAME
                    />
                ) : (
                    <ApplicationTable applications={applications} />
                    )}
            </div>

            {/* Modal */}
            {isAddDialogOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white border-4 border-zinc-900 p-8 w-full max-w-2xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setIsAddDialogOpen(false)} className="absolute top-4 right-4 text-zinc-900">
                            <X size={24} />
                        </button>

                        {/* 1 & 4. Title: Add Application without underline */}
                        <h2 className="text-2xl font-black uppercase mb-6 italic text-zinc-900">Add Application</h2>

                        <form onSubmit={handleAddApplication} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black uppercase mb-1">Company_Name*</label>
                                    <input required className="w-full border-2 border-zinc-900 p-2 outline-none" value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})}/>
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase mb-1">Position*</label>
                                    <input required className="w-full border-2 border-zinc-900 p-2 outline-none" value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})}/>
                                </div>
                                {/* 3. Status and Job Type */}
                                <div>
                                    <label className="block text-xs font-black uppercase mb-1">Status</label>
                                    <select className="w-full border-2 border-zinc-900 p-2 outline-none bg-white" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                                        <option value="saved">Saved</option>
                                        <option value="applied">Applied</option>
                                        <option value="interview">Interview</option>
                                        <option value="offer">Offer</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase mb-1">Upload_CV (Optional)</label>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    className="w-full border-2 border-zinc-900 p-2 outline-none bg-white file:mr-4 file:py-1 file:px-4 file:border-0 file:text-xs file:font-black file:uppercase file:bg-zinc-900 file:text-white hover:file:bg-[#800050] cursor-pointer"
                                    onChange={(e) => setCvFile(e.target.files[0])}
                                />
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black uppercase mb-1">Job_Type</label>
                                    <select className="w-full border-2 border-zinc-900 p-2 outline-none bg-white" value={formData.jobType} onChange={(e) => setFormData({...formData, jobType: e.target.value})}>
                                        <option value="internship">Internship</option>
                                        <option value="full-time">Full-time</option>
                                        <option value="contract">Contract</option>
                                    </select>
                                </div>
                                {/* 3. Job Posting URL */}
                                <div>
                                    <label className="block text-xs font-black uppercase mb-1">Job_Posting_URL (Optional)</label>
                                    <input
                                        type="url"
                                        className="w-full border-2 border-zinc-900 p-2 outline-none focus:bg-yellow-50"
                                        value={formData.jobUrl}
                                        onChange={(e) => setFormData({...formData, jobUrl: e.target.value})}
                                        placeholder="https://... (Leave blank if unknown)"
                                    />
                                </div>
                                {/* 3. Notes section */}
                                <div>
                                    <label className="block text-xs font-black uppercase mb-1">Notes</label>
                                    <textarea className="w-full border-2 border-zinc-900 p-2 outline-none h-20 resize-none" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})}/>
                                </div>
                            </div>

                            {/* 5. Complete button */}
                            <button
                                type="submit"
                                className="md:col-span-2 w-full mt-4 border-2 border-zinc-900 bg-zinc-900 text-white p-3 font-black uppercase hover:bg-[#800050] transition-colors"
                            >
                                Complete
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}