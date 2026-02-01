import { Calendar, MapPin, ExternalLink, FileText } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function ApplicationCard({ application, onDragStart, onDragEnd, onClick }) {
    // Styling constants
    const cardBase = "p-4 cursor-grab active:cursor-grabbing bg-white border-2 border-zinc-900 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all";
    const labelText = "text-[9px] font-black uppercase tracking-tighter text-zinc-400";

    const safeFormat = (date) => {
        if (!date) return '-';
        try { return format(new Date(date), 'MMM d'); } catch (e) { return '-'; }
    };

    // Corrected Download logic
    const handleDownloadAsset = async (e, fileUrl, companyName) => {
        e.stopPropagation(); // Prevents opening the edit modal
        if (!fileUrl) return toast.error("NO_ASSET_FOUND");

        try {
            const response = await fetch(fileUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${companyName || 'Company'}_Resume.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("DOWNLOAD_STARTED");
        } catch (error) {
            console.error(error);
            toast.error("DOWNLOAD_FAILED");
        }
    };
    
    return (
        <Card
            className={cardBase}
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={onClick}
        >
            <div className="space-y-4">
                {/* Header: Position and Match Score */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                        <h3 className="font-black text-sm uppercase leading-tight tracking-tight text-zinc-900 italic">
                            {application.position}
                        </h3>
                        <p className="text-[10px] font-bold text-[#800050] uppercase mt-0.5">
                            {application.companyName || application.company_name}
                        </p>
                    </div>
                    {application.matchScore && (
                        <div className="bg-[#EBBB49] border-2 border-zinc-900 px-1.5 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <span className="text-[10px] font-black italic">{application.matchScore}%</span>
                        </div>
                    )}
                </div>

                {/* Body: Location and Type */}
                <div className="flex flex-wrap gap-2 items-center">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500">
                        <MapPin className="size-3 stroke-[3px]" />
                        <span className="uppercase">{application.location || 'Remote_Node'}</span>
                    </div>
                    <Badge className="bg-zinc-900 text-white rounded-none border-none text-[8px] font-black uppercase px-1.5 py-0 h-4">
                        {application.jobType || 'Intern'}
                    </Badge>
                </div>

               {/* Dates Section */}
               {(application.deadline || application.interviewDate) && (
                    <div className="bg-zinc-50 border-l-4 border-zinc-900 p-2 space-y-1">
                        {application.deadline && (
                            <div className="flex items-center gap-2">
                                <span className={labelText}>Cutoff:</span>
                                <span className="text-[10px] font-black italic">{safeFormat(application.deadline)}</span>
                            </div>
                        )}
                        {application.interviewDate && (
                            <div className="flex items-center gap-2 text-[#800050]">
                                <span className="text-[10px] font-black uppercase tracking-tighter">Event:</span>
                                <span className="text-[10px] font-black italic animate-pulse">
                                    {safeFormat(application.interviewDate)}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Section: Assets and Links */}
                <div className="flex items-center justify-between pt-3 border-t-2 border-zinc-900 mt-3">
                    {application.cv_url ? (
                        <button 
                            onClick={(e) => handleDownloadAsset(e, application.cv_url, application.companyName)}
                            className="flex items-center gap-1 text-[9px] font-black uppercase text-zinc-900 bg-[#EBBB49] px-2 py-0.5 border border-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                        >
                            <FileText className="size-3" />
                            <span>Asset_Ready</span>
                        </button>
                    ) : (
                        <span className="text-[9px] font-black uppercase text-zinc-300 italic">No_Asset_Linked</span>
                    )}
                    
                    {application.jobUrl && (
                        <a 
                            href={application.jobUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-zinc-900 hover:text-[#EBBB49] transition-colors"
                        >
                            <ExternalLink className="size-3.5 stroke-[3px]" />
                        </a>
                    )}
                </div>
            </div>
        </Card>
    );
}