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
import { ExternalLink, Eye, FileText } from 'lucide-react';
import { toast } from "sonner";

const statusConfig = {
    saved: { label: 'SAVED', className: 'bg-zinc-100 text-zinc-900 border-2 border-zinc-900' },
    applied: { label: 'APPLIED', className: 'bg-[#EBBB49] text-zinc-900 border-2 border-zinc-900' },
    interview: { label: 'INTERVIEW', className: 'bg-[#800050] text-white border-2 border-zinc-900' },
    offer: { label: 'OFFER', className: 'bg-green-400 text-zinc-900 border-2 border-zinc-900' },
    rejected: { label: 'REJECTED', className: 'bg-red-500 text-white border-2 border-zinc-900' },
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

    // Asset download handler
    const handleDownloadAsset = async (e, fileUrl, companyName) => {
        e.stopPropagation(); // Don't open the modal
        if (!fileUrl) return toast.error("NO_ASSET_FOUND");

        try {
            const response = await fetch(fileUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${companyName}_Resume_Asset.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("ASSET_DOWNLOAD_INITIATED");
        } catch (error) {
            toast.error("DOWNLOAD_PROTOCOL_FAILED");
        }
    };

    const tableHeaderStyle = "bg-transparent text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 border-b-2 border-zinc-900 py-4";
    const cellStyle = "border-b border-zinc-200 font-bold text-sm text-zinc-900 py-5 bg-transparent";

    return (
        <div className="w-full overflow-hidden rounded-none bg-transparent">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-none">
                        <TableHead className={tableHeaderStyle}>Company</TableHead>
                        <TableHead className={tableHeaderStyle}>Position</TableHead>
                        <TableHead className={tableHeaderStyle}>Status</TableHead>
                        <TableHead className={tableHeaderStyle}>Date Added</TableHead>
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
                                        {app.companyName || app.company}
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
                                <Badge className={`rounded-none font-black text-[8px] px-2 py-0 shadow-none ${statusConfig[app.status]?.className || 'bg-white'}`}>
                                    {statusConfig[app.status]?.label || app.status?.toUpperCase()}
                                </Badge>
                            </TableCell>

                          

                            <TableCell className={cellStyle}>
                                <span className="text-[10px] uppercase font-bold text-zinc-400">
                                    {safeFormat(app.created_at || app.dateAdded)}
                                </span>
                            </TableCell>

                            <TableCell className={`${cellStyle} text-right`}>
                                <div className="flex justify-end gap-3">
                                    {/* Asset Download Button */}
                                    {app.cv_url && (
                                        <button
                                            title="Download Asset"
                                            className="text-zinc-400 hover:text-[#EBBB49] transition-colors"
                                            onClick={(e) => handleDownloadAsset(e, app.cv_url, app.companyName)}
                                        >
                                            <FileText className="size-4" />
                                        </button>
                                    )}

                                    <button
                                        title="View Details"
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
                                            title="External Link"
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