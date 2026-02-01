import { Calendar, DollarSign, MapPin, ExternalLink, FileText, Target } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { format } from 'date-fns';

export function ApplicationCard({ application, onDragStart, onDragEnd, onClick }) {
    // Styling constants
    const cardBase = "p-4 cursor-grab active:cursor-grabbing bg-white border-2 border-zinc-900 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all";
    const labelText = "text-[9px] font-black uppercase tracking-tighter text-zinc-400";

    const safeFormat = (date) => {
        if (!date) return '-';
        try { return format(new Date(date), 'MMM d'); } catch (e) { return '-'; }
    };

    const handleDownload = async (fileUrl, fileName) => {
        try {
            const response = await fetch(fileUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName || 'resume-asset.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error("DOWNLOAD_FAILED");
        }
    };
    
    // Use it in your UI like this:
    <button 
        onClick={() => handleDownload(app.cv_url, `${app.companyName}_Resume.pdf`)}
        className="hover:text-[#EBBB49] transition-colors"
    >
        <FileText className="size-4" />
    </button>
    
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
                        <h3 className="font-black text-sm uppercase leading-tight tracking-tight text-zinc-900">
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
                        <span className="uppercase">{application.location || 'Remote'}</span>
                    </div>
                    <Badge className="bg-zinc-900 text-white rounded-none text-[8px] font-black uppercase px-1.5 py-0 h-4">
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
                                </span> {/* FIXED: Was previously closed with a div */}
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Section */}
                <div className="flex items-center justify-between pt-3 border-t-2 border-zinc-100">
                    <div className="flex items-center gap-2">
                        {application.cv_url && (
                            <div className="flex items-center gap-1 text-[9px] font-black uppercase text-zinc-400">
                                <FileText className="size-3" />
                                <span>Asset_Linked</span>
                            </div>
                        )}
                    </div>
                    {application.jobUrl && (
                        <ExternalLink className="size-3.5 text-zinc-900 hover:text-[#EBBB49] transition-colors stroke-[3px]" />
                    )}
                </div>
                    {application.jobUrl && (
                        <ExternalLink className="size-3.5 text-zinc-900 hover:text-[#EBBB49] transition-colors stroke-[3px]" />
                    )}
                </div>
            </Card>
    );
}