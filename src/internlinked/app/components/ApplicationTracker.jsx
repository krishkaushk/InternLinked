import { useState } from 'react';
import { KanbanBoard } from './KanbanBoard';
import { ApplicationTable } from './ApplicationTable';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Plus, LayoutGrid, Table as TableIcon, X, FileUp, Link as LinkIcon, Trash2 } from 'lucide-react';
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function ApplicationTracker({ applications, onUpdateApplications }) {
    const [view, setView] = useState('kanban');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [cvFile, setCvFile] = useState(null);
    const [selectedApp, setSelectedApp] = useState(null);

    const [formData, setFormData] = useState({
        companyName: '',
        position: '',
        status: 'saved',
        jobType: 'internship',
        jobUrl: '',
        notes: '',
        cv_url: null
    });

    const inputStyle = "w-full border-2 border-zinc-900 p-2 outline-none focus:bg-yellow-50 focus:ring-2 ring-[#EBBB49] transition-all rounded-none font-bold text-sm";
    const labelStyle = "block text-[10px] font-black uppercase mb-1 tracking-widest text-zinc-500";

    const handleEditClick = (app) => {
        setSelectedApp(app);
        setFormData({
            companyName: app.companyName || app.company,
            position: app.position || app.role,
            status: app.status,
            jobType: app.jobType || 'internship',
            jobUrl: app.jobUrl || '',
            notes: app.notes || '',
            cv_url: app.cv_url || app.resume_url 
        });
        setIsAddDialogOpen(true);
    };

    const closeModal = () => {
        setFormData({ companyName: '', position: '', status: 'saved', jobType: 'internship', jobUrl: '', notes: '', cv_url: null });
        setCvFile(null);
        setSelectedApp(null);
        setIsAddDialogOpen(false);
    };

    // --- DELETE LOGIC ---
    const handleDeleteApplication = async () => {
        if (!selectedApp) return;
        
        const confirmed = window.confirm("SYSTEM_WARNING: Permanent deletion of record. Proceed?");
        if (!confirmed) return;

        const { error } = await supabase
            .from('applications')
            .delete()
            .eq('id', selectedApp.id);

        if (error) {
            toast.error(`DELETE_ERROR: ${error.message}`);
        } else {
            // Signal parent to remove by passing null for the app and the ID for removal
            onUpdateApplications(null, selectedApp.id);
            toast.success("ENTRY_PURGED_SUCCESSFULLY");
            closeModal();
        }
    };

    const handleAddApplication = async (e) => {
        e.preventDefault();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return toast.error("Log in required");
    
        // 1. First, save/update the application to get an ID
        const appPayload = {
            user_id: user.id,
            companyName: formData.companyName,
            position: formData.position,
            status: formData.status,
            jobUrl: formData.jobUrl,
            jobType: formData.jobType,
        };
    
        if (selectedApp?.id) appPayload.id = selectedApp.id;
    
        const { data: appData, error: appError } = await supabase
            .from('applications')
            .upsert([appPayload])
            .select()
            .single();
    
        if (appError) return toast.error(appError.message);
    
        // 2. Handle File Upload if a new file is selected
        if (cvFile) {
            const fileExt = cvFile.name.split('.').pop();
            const fileName = `${user.id}/${appData.id}-${Date.now()}.${fileExt}`;
            
            // Upload to Storage
            const { error: storageError } = await supabase.storage
                .from('cvs')
                .upload(fileName, cvFile);
    
            if (!storageError) {
                const { data: urlData } = supabase.storage.from('cvs').getPublicUrl(fileName);
                
                // Create entry in 'files' table
                await supabase.from('files').insert([{
                    user_id: user.id,
                    application_id: appData.id,
                    file_name: cvFile.name,
                    file_url: urlData.publicUrl,
                    type: 'resume',
                    mime_type: cvFile.type
                }]);
    
                // Update application with the new link
                await supabase.from('applications')
                    .update({ cv_url: urlData.publicUrl, resume_url: urlData.publicUrl })
                    .eq('id', appData.id);
            }
        }
    
        onUpdateApplications(appData);
        toast.success("SYSTEM_SYNCHRONIZED");
        closeModal();
    };

    return (
        <div className="h-full flex flex-col relative pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter text-zinc-900">Pipeline_Management</h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] italic text-zinc-400">
                        Active_Internship_Tracking // System_02
                    </p>
                </div>
                <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="bg-[#EBBB49] text-zinc-900 border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded-none font-black uppercase italic px-6 py-6"
                >
                    <Plus className="size-5 mr-2 stroke-[3px]" />
                    Deploy_New_Entry
                </Button>
            </div>

            {/* View Switcher */}
            <div className="mb-6 flex justify-between items-center">
                <Tabs value={view} onValueChange={setView} className="w-fit">
                    <TabsList className="bg-zinc-100 border-2 border-zinc-900 p-1 rounded-none h-auto">
                        <TabsTrigger value="kanban" className="rounded-none data-[state=active]:bg-[#EBBB49] font-black uppercase text-[10px] px-4 py-2">
                            <LayoutGrid className="size-3 mr-2" />Visual_Grid
                        </TabsTrigger>
                        <TabsTrigger value="table" className="rounded-none data-[state=active]:bg-[#EBBB49] font-black uppercase text-[10px] px-4 py-2">
                            <TableIcon className="size-3 mr-2" />Data_Table
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden p-4 bg-zinc-50 border-2 border-zinc-900">
                {view === 'kanban' ? (
                    <KanbanBoard applications={applications} onSelectApplication={handleEditClick} />
                ) : (
                    <ApplicationTable applications={applications} onSelectApplication={handleEditClick} />
                )}
            </div>

            {/* Deployment/Edit Modal */}
            {isAddDialogOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4">
                    <div className="bg-[#FDFCF0] border-4 border-zinc-900 p-0 w-full max-w-2xl shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative flex flex-col">
                        <div className="bg-zinc-900 text-white p-4 flex justify-between items-center">
                            <h2 className="font-black uppercase italic tracking-tighter text-lg">
                                {selectedApp ? 'Modify_Application_Data' : 'Initialize_New_Entry'}
                            </h2>
                            <button onClick={closeModal} className="hover:text-[#EBBB49] transition-colors">
                                <X size={24} strokeWidth={3} />
                            </button>
                        </div>

                        <form onSubmit={handleAddApplication} className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className={labelStyle}>Corp_Entity</label>
                                        <input required className={inputStyle} value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} placeholder="e.g. NVIDIA" />
                                    </div>
                                    <div>
                                        <label className={labelStyle}>Target_Role</label>
                                        <input required className={inputStyle} value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} placeholder="e.g. Software Intern" />
                                    </div>
                                    <div>
                                        <label className={labelStyle}>Current_Status</label>
                                        <select className={`${inputStyle} bg-white font-bold uppercase`} value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                                            <option value="saved">SAVED</option>
                                            <option value="applied">APPLIED</option>
                                            <option value="interview">INTERVIEW</option>
                                            <option value="offer">OFFER</option>
                                            <option value="rejected">REJECTED</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className={labelStyle}>Asset_Upload</label>
                                        <div className="relative border-2 border-dashed border-zinc-400 p-4 text-center hover:bg-zinc-50 cursor-pointer">
                                            <input type="file" accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setCvFile(e.target.files[0])} />
                                            <FileUp className="size-6 mx-auto mb-2 text-zinc-400" />
                                            <span className="text-[10px] font-black uppercase text-zinc-500">{cvFile ? cvFile.name : 'Update_Resume'}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelStyle}>Portal_Link</label>
                                        <input type="url" className={inputStyle} value={formData.jobUrl} onChange={(e) => setFormData({...formData, jobUrl: e.target.value})} placeholder="https://..." />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className={labelStyle}>Internal_Notes</label>
                                    <textarea className={`${inputStyle} h-20 resize-none`} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="flex gap-4 mt-8">
                                {selectedApp && (
                                    <button
                                        type="button"
                                        onClick={handleDeleteApplication}
                                        className="flex-1 border-2 border-zinc-900 bg-white text-red-600 py-4 font-black uppercase italic tracking-widest hover:bg-red-50 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                                    >
                                        <Trash2 className="size-4 inline mr-2" /> Delete_Record
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="flex-[2] border-2 border-zinc-900 bg-zinc-900 text-[#EBBB49] py-4 font-black uppercase italic tracking-widest hover:bg-zinc-800 transition-all shadow-[4px_4px_0px_0px_#EBBB49] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                                >
                                    {selectedApp ? 'Update_Data_Field' : 'Initialize_Deployment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}