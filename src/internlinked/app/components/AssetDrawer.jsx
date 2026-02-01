import { X, Download, Trash2, FileText, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function AssetDrawer({ application, isOpen, onClose }) {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch files every time the drawer opens for a specific app
    useEffect(() => {
        if (isOpen && application?.id) {
            const fetchAssets = async () => {
                setLoading(true);
                try {
                    const { data, error } = await supabase
                        .from('files')
                        .select('*')
                        .eq('application_id', application.id)
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    setAssets(data || []);
                } catch (err) {
                    console.error("Fetch Error:", err);
                    toast.error("VAULT_ACCESS_DENIED");
                } finally {
                    setLoading(false);
                }
            };
            fetchAssets();
        }
    }, [isOpen, application]);

    // Robust download handler to bypass CORS/browser blocks
    const handleDownload = async (fileUrl, fileName) => {
        const toastId = toast.loading("INITIALIZING_DOWNLOAD...");
        try {
            const res = await fetch(fileUrl);
            if (!res.ok) throw new Error("Network response was not ok");
            
            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName || 'asset_download.pdf';
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            toast.success("DOWNLOAD_COMPLETE", { id: toastId });
        } catch (e) { 
            console.error("Download Error:", e);
            toast.error("DOWNLOAD_FAILED", { id: toastId }); 
        }
    };

    const handleDelete = async (fileId, fileUrl) => {
        const confirm = window.confirm("SYSTEM_WARNING: Permanent asset deletion. Proceed?");
        if (!confirm) return;

        const toastId = toast.loading("PURGING_ASSET...");
        try {
            // 1. Extract storage path from URL
            // Adjust the split string if your bucket name is different from 'cvs'
            const path = fileUrl.split('/storage/v1/object/public/cvs/')[1];
            
            if (path) {
                await supabase.storage.from('cvs').remove([path]);
            }
            
            // 2. Delete database entry
            const { error } = await supabase.from('files').delete().eq('id', fileId);

            if (error) throw error;

            setAssets(prev => prev.filter(a => a.id !== fileId));
            toast.success("ASSET_PURGED", { id: toastId });
        } catch (err) {
            console.error("Delete Error:", err);
            toast.error("PURGE_FAILED", { id: toastId });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#FDFCF0] border-l-4 border-zinc-900 z-[200] shadow-[-20px_0px_60px_rgba(0,0,0,0.2)] animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="bg-zinc-900 text-white p-6 flex justify-between items-center">
                <div>
                    <h2 className="font-black uppercase italic tracking-tighter text-xl">Asset_Vault</h2>
                    <p className="text-[10px] text-[#EBBB49] font-bold uppercase tracking-widest">
                        {application?.companyName || 'Unknown_Entity'} // Entry_Assets
                    </p>
                </div>
                <button 
                    onClick={onClose} 
                    className="hover:text-[#EBBB49] transition-colors p-1"
                >
                    <X size={24} strokeWidth={3} />
                </button>
            </div>

            {/* Content Area */}
            <div className="p-6 space-y-4 overflow-y-auto h-[calc(100vh-100px)]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="animate-spin text-zinc-900 size-8" />
                        <span className="text-[10px] font-black uppercase text-zinc-400">Syncing_Vault...</span>
                    </div>
                ) : assets.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-zinc-200 bg-zinc-50/50">
                        <p className="text-[10px] font-black uppercase text-zinc-400 italic">No_Assets_Deployed_To_Stack</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {assets.map((asset) => (
                            <div 
                                key={asset.id} 
                                className="bg-white border-2 border-zinc-900 p-4 flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="bg-zinc-100 p-2 border border-zinc-900 shrink-0">
                                        <FileText className="text-zinc-900" size={18} />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-[10px] font-black uppercase truncate">{asset.file_name}</p>
                                        <p className="text-[8px] font-bold text-zinc-400 uppercase">
                                            Size: {asset.mime_type || 'PDF_DOC'}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex gap-2 shrink-0">
                                    <button 
                                        onClick={() => handleDownload(asset.file_url, asset.file_name)} 
                                        title="Download Asset"
                                        className="p-2 bg-white hover:bg-[#EBBB49] border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                                    >
                                        <Download size={14} strokeWidth={3} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(asset.id, asset.file_url)} 
                                        title="Purge Asset"
                                        className="p-2 bg-white hover:bg-red-500 hover:text-white border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                                    >
                                        <Trash2 size={14} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Status */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t-2 border-zinc-900 bg-white">
                <p className="text-[8px] font-black uppercase text-center text-zinc-400">
                    Vault_Encrypted // <span className="text-black-600">Intern</span><span className="text-[#EBBB49]">Linked</span>_Asset_Management
                </p>
            </div>
        </div>
    );
}