import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { format } from 'date-fns';
import { ExternalLink, Eye } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

const statusConfig = {
    saved: { label: 'SAVED', className: 'bg-zinc-100 text-zinc-900 border-zinc-900' },
    applied: { label: 'APPLIED', className: 'bg-[#EBBB49] text-zinc-900 border-zinc-900' },
    interview: { label: 'INTERVIEW', className: 'bg-[#800050] text-white border-zinc-900' },
    offer: { label: 'OFFER', className: 'bg-green-400 text-zinc-900 border-zinc-900' },
    rejected: { label: 'REJECTED', className: 'bg-red-500 text-white border-zinc-900' },
};

export function ApplicationTable({ applications, onSelectApplication }) {
    const safeFormat = (date) => {
        if (!date) return '-';
        try {
            return format(new Date(date), 'MMM d, yyyy');
        } catch (e) {
            return '-';
        }
    };

    // Updated Styling: Transparent background, no outer shadow
    const tableHeaderStyle = "bg-transparent text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 border-b-2 border-zinc-900 py-4";
    const cellStyle = "border-b border-zinc-200 font-bold text-sm text-zinc-900 py-5 bg-transparent";

    return (
        <div className="w-full overflow-hidden rounded-none bg-transparent">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-none">
                        <TableHead className={tableHeaderStyle}>Corp_Entity</TableHead>
                        <TableHead className={tableHeaderStyle}>Position_Title</TableHead>
                        <TableHead className={tableHeaderStyle}>Status_Flag</TableHead>
                        <TableHead className={tableHeaderStyle}>Match_Rating</TableHead>
                        <TableHead className={tableHeaderStyle}>Timeline_Log</TableHead>
                        <TableHead className={`${tableHeaderStyle} text-right`}>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {applications.map((app) => (
                        <TableRow
                            key={app.id}
                            className="group cursor-pointer hover:bg-[#EBBB49]/5 transition-colors border-none"
                            onClick={() => onSelectApplication(app)}
                        >
                            <TableCell className={cellStyle}>
                                <div className="flex flex-col">
                                    <span className="uppercase italic font-black text-zinc-900">
                                        {app.companyName || app.company_name}
                                    </span>
                                    <span className="text-[9px] text-zinc-400 uppercase tracking-tighter">
                                        {app.location || 'Remote_Node'}
                                    </span>
                                </div>
                            </TableCell>
                            
                            <TableCell className={cellStyle}>
                                <span className="text-zinc-600 font-medium italic">{app.position}</span>
                            </TableCell>

                            <TableCell className={cellStyle}>
                                <Badge className={`rounded-none border-2 font-black text-[8px] px-2 py-0 shadow-none ${statusConfig[app.status]?.className || 'bg-white'}`}>
                                    {statusConfig[app.status]?.label || app.status?.toUpperCase()}
                                </Badge>
                            </TableCell>

                            <TableCell className={cellStyle}>
                                <div className="flex items-center gap-2">
                                    <div className="w-16 h-1 bg-zinc-100 overflow-hidden">
                                        <div 
                                            className="h-full bg-zinc-900" 
                                            style={{ width: `${app.matchScore || 50}%` }}
                                        />
                                    </div>
                                    <span className="text-[9px] font-black italic">{app.matchScore || 50}%</span>
                                </div>
                            </TableCell>

                            <TableCell className={cellStyle}>
                                <span className="text-[10px] uppercase font-bold text-zinc-400">
                                    {safeFormat(app.created_at || app.dateAdded)}
                                </span>
                            </TableCell>

                            <TableCell className={`${cellStyle} text-right`}>
                                <div className="flex justify-end gap-3">
                                    <button
                                        className="text-zinc-400 hover:text-zinc-900 transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectApplication(app);
                                        }}
                                    >
                                        <Eye className="size-4" />
                                    </button>
                                    {app.jobUrl && (
                                        <button
                                            className="text-zinc-400 hover:text-[#EBBB49] transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(app.jobUrl, '_blank');
                                            }}
                                        >
                                            <ExternalLink className="size-4" />
                                        </button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            
            {applications.length === 0 && (
                <div className="py-20 text-center border-b border-zinc-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 italic">
                        No_Records_In_Database
                    </p>
                </div>
            )}
        </div>
    );
}