import { useState, useRef } from 'react';
import { KanbanBoard } from './KanbanBoard';
import { ApplicationTable } from './ApplicationTable';
import { AssetDrawer } from './AssetDrawer'; // Ensure this file exists
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Plus, LayoutGrid, Table as TableIcon, X, FileUp, Link as LinkIcon, Trash2, FileText } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { toast } from "sonner";


export function ApplicationTracker({ applications, onUpdateApplications }) {
    // View & Modal State
    const [view, setView] = useState('kanban');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    
    // Asset Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [activeDrawerApp, setActiveDrawerApp] = useState(null);

    // Form & Upload State
    const [files, setFiles] = useState([]); 
    const [selectedApp, setSelectedApp] = useState(null);
    const [formData, setFormData] = useState({
        companyName: '',
        position: '',
        status: 'saved',
        jobType: 'internship',
        jobUrl: '',
        notes: '',
        location: '',
        cv_url: null
    });

    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const locationDebounce = useRef(null);

    const handleLocationInput = (value) => {
        setFormData(f => ({ ...f, location: value }));
        clearTimeout(locationDebounce.current);
        if (value.length < 1) { setLocationSuggestions([]); setShowSuggestions(false); return; }
        locationDebounce.current = setTimeout(async () => {
            try {
                const res = await fetch(
                    `https://photon.komoot.io/api/?q=${encodeURIComponent(value)}&limit=5&lang=en`
                );
                const data = await res.json();
                setLocationSuggestions(data.features || []);
                setShowSuggestions((data.features || []).length > 0);
            } catch { /* silently fail */ }
        }, 150);
    };

    const formatLocation = (item) => {
        const p = item.properties;
        const city = p.city || p.name;
        const state = p.state;
        const country = p.country;
        if (city && state) return `${city}, ${state}`;
        if (city && country) return `${city}, ${country}`;
        return city || p.name || '';
    };

    const inputStyle = "w-full border-2 border-zinc-900 p-2 outline-none focus:bg-yellow-50 focus:ring-2 ring-[#EBBB49] transition-all rounded-none font-bold text-sm";
    const labelStyle = "block text-[10px] font-black uppercase mb-1 tracking-widest text-zinc-500";

    // OPEN ASSET VAULT (Called from Table or Kanban)
    const handleOpenDrawer = (e, app) => {
        e.stopPropagation();
        setActiveDrawerApp(app);
        setIsDrawerOpen(true);
    };

    const handleEditClick = (app) => {
        console.log("Editing App ID:", app.id);
        setSelectedApp(app);
        setFormData({
            companyName: app.companyName,
            position: app.position,
            status: app.status,
            jobType: app.jobType || 'internship',
            jobUrl: app.jobUrl || '',
            notes: app.notes || '',
            location: app.location || '',
            cv_url: app.cv_url || null
        });
        setIsAddDialogOpen(true);
    };

    const closeModal = () => {
        setFormData({ companyName: '', position: '', status: 'saved', jobType: 'internship', jobUrl: '', notes: '', location: '', cv_url: null });
        setFiles([]);
        setSelectedApp(null);
        setIsAddDialogOpen(false);
    };

    const handleDeleteApplication = async () => {
        if (!selectedApp) return;
        const confirmed = window.confirm("Delete this application? This can't be undone.");
        if (!confirmed) return;

        const { error } = await supabase
            .from('applications')
            .delete()
            .eq('id', selectedApp.id);

        if (error) {
            toast.error(`DELETE_ERROR: ${error.message}`);
        } else {
            onUpdateApplications(null, selectedApp.id);
            toast.success("Deleted");
            closeModal();
        }
    };

    const handleAddApplication = async (e) => {
        e.preventDefault();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return toast.error("Log in required");
    
        try {
            // 1. PREP PAYLOAD
            const appPayload = {
                user_id: user.id,
                companyName: formData.companyName,
                position: formData.position,
                status: formData.status,
                jobUrl: formData.jobUrl,
                jobType: formData.jobType,
                notes: formData.notes,
                location: formData.location,
                ...(selectedApp?.id && { id: selectedApp.id })
            };
    
            // 2. INITIAL DB DEPLOYMENT
            const { data: appData, error: appError } = await supabase
                .from('applications')
                .upsert([appPayload], { onConflict: 'id' })
                .select()
                .single();
    
            if (appError) throw appError;
    
            // 3. ASSET UPLOAD STACK
            let finalAppData = { ...appData };
            
            if (files.length > 0) {
                const uploadPromises = files.map(async (file) => {
                    const fileName = `${user.id}/${appData.id}/${Date.now()}_${file.name}`;
                    const { error: storageError } = await supabase.storage
                        .from('cvs')
                        .upload(fileName, file);
    
                    if (storageError) throw storageError;
    
                    const { data: urlData } = supabase.storage.from('cvs').getPublicUrl(fileName);
                    
                    await supabase.from('files').insert([{
                        user_id: user.id,
                        application_id: appData.id,
                        file_name: file.name,
                        file_url: urlData.publicUrl,
                        type: 'document'
                    }]);
    
                    return urlData.publicUrl;
                });
    
                const urls = await Promise.all(uploadPromises);
                
                // Update the record with the first file URL and get the REFRESHED object
                const { data: refreshedApp } = await supabase
                    .from('applications')
                    .update({ cv_url: urls[0] })
                    .eq('id', appData.id)
                    .select()
                    .single();
                
                finalAppData = refreshedApp;
            }
    
            // 4. SINGLE STATE UPDATE
            onUpdateApplications(finalAppData);
            
            toast.success("Uploaded");
            closeModal();
        } catch (error) {
            console.error("Critical Failure:", error);
            toast.error(`SYSTEM_FAILURE: ${error.message}`);
        }
    };

    return (
        <div className="h-full flex flex-col relative pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-zinc-900">Application Management</h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] italic text-zinc-400">
                    </p>
                </div>
                <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="bg-[#EBBB49] text-zinc-900 border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded-none font-black uppercase italic px-6 py-6"
                >
                    <Plus className="size-5 mr-2 stroke-[3px]" /> Add Application
                </Button>
            </div>

            {/* View Switcher */}
            <div className="mb-6">
                <Tabs value={view} onValueChange={setView} className="w-fit">
                    <TabsList className="bg-zinc-100 border-2 border-zinc-900 p-1 rounded-none h-auto">
                        <TabsTrigger value="kanban" className="rounded-none data-[state=active]:bg-[#EBBB49] font-black uppercase text-[10px] px-4 py-2">
                            <LayoutGrid className="size-3 mr-2" />Pipeline
                        </TabsTrigger>
                        <TabsTrigger value="table" className="rounded-none data-[state=active]:bg-[#EBBB49] font-black uppercase text-[10px] px-4 py-2">
                            <TableIcon className="size-3 mr-2" />Table
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden p-4 bg-zinc-50 border-2 border-zinc-900 shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.05)]">
                {view === 'kanban' ? (
                    <KanbanBoard 
                        applications={applications} 
                        onSelectApplication={handleEditClick} 
                        onOpenDrawer={handleOpenDrawer}
                    />
                ) : (
                    <ApplicationTable 
                        applications={applications} 
                        onSelectApplication={handleEditClick} 
                        onOpenDrawer={handleOpenDrawer}
                    />
                )}
            </div>

            {/* Asset Drawer */}
            <AssetDrawer 
                isOpen={isDrawerOpen} 
                application={activeDrawerApp} 
                onClose={() => setIsDrawerOpen(false)} 
            />

            {/* Entry Modal */}
            {isAddDialogOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4">
                    <div className="bg-[#FDFCF0] border-4 border-zinc-900 w-full max-w-2xl shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative animate-in fade-in zoom-in duration-200">
                        <div className="bg-zinc-900 text-white p-4 flex justify-between items-center">
                            <h2 className="font-black uppercase italic tracking-tighter text-lg">
                                {selectedApp ? 'Edit Application' : 'Add Application'}
                            </h2>
                            <button onClick={closeModal} className="hover:text-[#EBBB49] transition-colors"><X size={24} strokeWidth={3} /></button>
                        </div>

                        <form onSubmit={handleAddApplication} className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className={labelStyle}>Company</label>
                                        <input required className={inputStyle} value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} placeholder="e.g. NVIDIA" />
                                    </div>
                                    <div>
                                        <label className={labelStyle}>Role</label>
                                        <input required className={inputStyle} value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} placeholder="e.g. Software Intern" />
                                    </div>
                                    <div className="relative">
                                        <label className={labelStyle}>Location</label>
                                        <input
                                            className={inputStyle}
                                            value={formData.location}
                                            onChange={(e) => handleLocationInput(e.target.value)}
                                            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                            placeholder="e.g. San Francisco, CA"
                                            autoComplete="off"
                                        />
                                        {showSuggestions && (
                                            <div className="absolute z-50 w-full bg-white border-2 border-t-0 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-h-48 overflow-y-auto">
                                                {locationSuggestions.map((s, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-[#EBBB49] border-b border-zinc-100 last:border-0 uppercase"
                                                        onMouseDown={() => {
                                                            setFormData(f => ({ ...f, location: formatLocation(s) }));
                                                            setShowSuggestions(false);
                                                        }}
                                                    >
                                                        {formatLocation(s)}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className={labelStyle}>Current Status</label>
                                        <select className={`${inputStyle} bg-white cursor-pointer`} value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
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
                                        <label className={labelStyle}>Upload Asset (.PDF)</label>
                                        <div className="relative border-2 border-dashed border-zinc-400 p-4 text-center hover:bg-zinc-50 cursor-pointer transition-colors group">
                                            <input type="file" multiple accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={(e) => setFiles(Array.from(e.target.files))} />
                                            <FileUp className="size-6 mx-auto mb-2 text-zinc-400 group-hover:text-zinc-900" />
                                            <span className="text-[10px] font-black uppercase text-zinc-500">
                                                {files.length > 0 ? `${files.length} files selected` : 'Select files'}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelStyle}>Link</label>
                                        <div className="relative">
                                            <LinkIcon className="absolute left-3 top-3 size-4 text-zinc-400" />
                                            <input type="url" className={`${inputStyle} pl-10`} value={formData.jobUrl} onChange={(e) => setFormData({...formData, jobUrl: e.target.value})} placeholder="https://..." />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                {selectedApp && (
                                    <button type="button" onClick={handleDeleteApplication} className="flex-1 border-2 border-zinc-900 bg-white text-red-600 py-4 font-black uppercase italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-red-50 transition-all">
                                        <Trash2 className="size-4 inline mr-2" /> Delete
                                    </button>
                                )}
                                <button type="submit" className="flex-[2] border-2 border-zinc-900 bg-zinc-900 text-[#EBBB49] py-4 font-black uppercase italic shadow-[4px_4px_0px_0px_#EBBB49] hover:bg-zinc-800 transition-all">
                                    {selectedApp ? 'Update' : 'Add Application'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}