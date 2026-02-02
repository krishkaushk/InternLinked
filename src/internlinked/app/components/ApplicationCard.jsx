import { MapPin, ExternalLink, FileText } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { format } from 'date-fns';

export function ApplicationCard({ 
    application, 
    onDragStart, 
    onDragEnd, 
    onClick, 
    onOpenDrawer 
}) {
    // Styling constants
    const cardBase = "p-4 cursor-grab active:cursor-grabbing bg-white border-2 border-zinc-900 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all";
    const labelText = "text-[9px] font-black uppercase tracking-tighter text-zinc-400";

    const safeFormat = (date) => {
        if (!date) return '-';
        try { return format(new Date(date), 'MMM d'); } catch (e) { return '-'; }
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
                        <h3 className="font-black text-sm uppercase bolden leading-tight tracking-tight text-zinc-900">
                            {application.companyName}
                            
                        </h3>
                        <p className="text-[10px] font-bold text-[#800050] uppercase mt-0.5">
                            {application.position}
                        </p>
                    </div>
                    
                </div>

                {/* Body: Location and Type */}
                <div className="flex flex-wrap gap-2 items-center">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500">
                        <MapPin className="size-3 stroke-[3px]" />
                        <span className="uppercase">{application.location || 'Remote Node'}</span>
                    </div>
                    <Badge className="bg-zinc-900 text-white rounded-none border-none text-[8px] font-black uppercase px-1.5 py-0 h-4 flex items-center">
                        {application.jobType || 'Internship'}
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
                    {/* Trigger for the Asset Drawer */}
                    <button 
                        onClick={(e) => onOpenDrawer(e, application)}
                        className={`flex items-center gap-1 text-[9px] font-black uppercase px-2 py-1 border border-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all ${
                            application.cv_url 
                            ? "bg-[#EBBB49] text-zinc-900" 
                            : "bg-zinc-100 text-zinc-400"
                        }`}
                    >
                        <FileText className="size-3" />
                        <span>{application.cv_url ? "Manage_Assets" : "Add_Assets"}</span>
                    </button>
                    
                    {application.jobUrl && (
                        <a 
                            href={application.jobUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-zinc-900 hover:text-[#EBBB49] transition-colors p-1"
                        >
                            <ExternalLink className="size-4 stroke-[3px]" />
                        </a>
                    )}
                </div>
            </div>
        </Card>
    );
}
