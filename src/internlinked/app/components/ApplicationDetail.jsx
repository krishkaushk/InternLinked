import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/app/components/ui/sheet';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Separator } from '@/app/components/ui/separator';
import {
    Calendar,
    DollarSign,
    MapPin,
    ExternalLink,
    FileText,
    Target,
    Clock,
    Edit,
    Trash2,
    Database
} from 'lucide-react';
import { format } from 'date-fns';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/app/components/ui/select';

const statusConfig = {
    saved: { label: 'SAVED', class: 'bg-zinc-100 text-zinc-900 border-zinc-900' },
    applied: { label: 'APPLIED', class: 'bg-[#EBBB49] text-zinc-900 border-zinc-900' },
    interview: { label: 'INTERVIEW', class: 'bg-[#800050] text-white border-zinc-900' },
    offer: { label: 'OFFER', class: 'bg-green-400 text-zinc-900 border-zinc-900' },
    rejected: { label: 'REJECTED', class: 'bg-red-500 text-white border-zinc-900' },
};

export function ApplicationDetail({ application, open, onClose, onUpdateStatus, onDelete }) {
    if (!application) return null;

    const safeFormat = (date, formatStr) => {
        if (!date) return 'N/A';
        return format(new Date(date), formatStr);
    };

    const labelStyle = "text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 block";
    const sectionStyle = "border-2 border-zinc-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white rounded-none";

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-xl bg-[#FDFCF0] border-l-4 border-zinc-900 p-0 overflow-y-auto rounded-none">
                {/* Header Section */}
                <div className="bg-zinc-900 p-8 text-white">
                    <div className="flex justify-between items-start mb-4">
                        <Badge className="bg-[#EBBB49] text-zinc-900 border-none font-black text-[10px] rounded-none px-3">
                            ID_{application.id?.toString().slice(0, 8)}
                        </Badge>
        
                    </div>
                    <SheetTitle className="text-4xl font-black uppercase italic tracking-tighter leading-none text-white">
                        {application.position}
                    </SheetTitle>
                    <p className="text-xl font-bold text-[#EBBB49] mt-2 opacity-90 uppercase tracking-tighter">
                        {application.companyName || application.company_name}
                    </p>
                </div>

                <div className="p-8 space-y-8">
                    {/* Status Select */}
                    <div>
                        <label className={labelStyle}>Deployment_Status</label>
                        <Select
                            value={application.status}
                            onValueChange={(value) => onUpdateStatus(application.id, value)}
                        >
                            <SelectTrigger className="w-full border-2 border-zinc-900 rounded-none bg-white font-black uppercase italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-2 border-zinc-900 rounded-none font-black uppercase italic">
                                <SelectItem value="saved">Saved</SelectItem>
                                <SelectItem value="applied">Applied</SelectItem>
                                <SelectItem value="interview">Interview</SelectItem>
                                <SelectItem value="offer">Offer</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Data Matrix */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className={sectionStyle}>
                            <label className={labelStyle}>Location</label>
                            <div className="flex items-center gap-2 font-black text-sm uppercase">
                                <MapPin size={14} className="text-[#EBBB49]" />
                                {application.location || "Remote_Node"}
                            </div>
                        </div>
                        <div className={sectionStyle}>
                            <label className={labelStyle}>Contract_Type</label>
                            <div className="font-black text-sm uppercase">
                                {application.jobType || "Internship"}
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className={sectionStyle}>
                        <h4 className="font-black uppercase italic text-sm mb-4 border-b-2 border-zinc-100 pb-2 flex items-center gap-2">
                            <Calendar size={16} className="text-[#EBBB49]" /> Event_Log
                        </h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase text-zinc-400">Initialized</span>
                                <span className="text-xs font-bold">{safeFormat(application.dateAdded || application.created_at, 'MMM d, yyyy')}</span>
                            </div>
                            {application.deadline && (
                                <div className="flex justify-between items-center text-red-600">
                                    <span className="text-[10px] font-black uppercase">Cutoff_Date</span>
                                    <span className="text-xs font-black italic underline">{safeFormat(application.deadline, 'MMM d, yyyy')}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notes Field */}
                    {application.notes && (
                        <div>
                            <label className={labelStyle}>Internal_Intelligence</label>
                            <div className="bg-white border-2 border-zinc-900 p-4 shadow-[4px_4px_0px_0px_#EBBB49] font-bold text-sm leading-relaxed italic border-l-8">
                                "{application.notes}"
                            </div>
                        </div>
                    )}

                    {/* Action Panel */}
                    <div className="space-y-3 pt-4">
                        {application.jobUrl && (
                            <Button
                                onClick={() => window.open(application.jobUrl, '_blank')}
                                className="w-full bg-white text-zinc-900 border-2 border-zinc-900 rounded-none font-black uppercase italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                            >
                                <ExternalLink size={16} className="mr-2" /> Open_Asset_Source
                            </Button>
                        )}

                        <div className="flex gap-4">
                            <Button variant="outline" className="flex-1 border-2 border-zinc-900 rounded-none font-black uppercase italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#EBBB49]">
                                <Edit size={16} className="mr-2" /> Modify
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1 bg-red-600 border-2 border-zinc-900 rounded-none font-black uppercase italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-red-700"
                                onClick={() => { onDelete(application.id); onClose(); }}
                            >
                                <Trash2 size={16} className="mr-2" /> Terminate
                            </Button>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}