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
import { ExternalLink, Target } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

// Removed: import { Application } from '@/types';
// Removed: interface ApplicationTableProps

const statusConfig = {
    saved: { label: 'Saved', variant: 'secondary' },
    applied: { label: 'Applied', variant: 'default' },
    interview: { label: 'Interview', variant: 'default' },
    offer: { label: 'Offer', variant: 'default' },
    rejected: { label: 'Rejected', variant: 'destructive' },
};

export function ApplicationTable({ applications, onSelectApplication }) {
    // Helper for safe date formatting in JSX
    const safeFormat = (date) => {
        if (!date) return '-';
        try {
            return format(new Date(date), 'MMM d, yyyy');
        } catch (e) {
            return '-';
        }
    };

    return (
        <div className="border rounded-lg bg-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Match</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Interview</TableHead>
                        <TableHead>Salary</TableHead>
                        <TableHead></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {applications.map((app) => (
                        <TableRow
                            key={app.id}
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => onSelectApplication(app)}
                        >
                            <TableCell className="font-medium">{app.companyName}</TableCell>
                            <TableCell>{app.position}</TableCell>
                            <TableCell>
                                <Badge variant={statusConfig[app.status]?.variant || 'secondary'}>
                                    {statusConfig[app.status]?.label || app.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">{app.location}</TableCell>
                            <TableCell>
                                {app.matchScore && (
                                    <div className="flex items-center gap-1">
                                        <Target className="size-4 text-green-600" />
                                        <span className="text-sm font-semibold text-green-600">
                      {app.matchScore}%
                    </span>
                                    </div>
                                )}
                            </TableCell>
                            <TableCell className="text-sm">
                                {safeFormat(app.deadline)}
                            </TableCell>
                            <TableCell className="text-sm">
                                {app.interviewDate ? (
                                    <span className="text-purple-600 font-medium">
                    {safeFormat(app.interviewDate)}
                  </span>
                                ) : (
                                    '-'
                                )}
                            </TableCell>
                            <TableCell className="text-sm">{app.salary || '-'}</TableCell>
                            <TableCell>
                                {app.jobUrl && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(app.jobUrl, '_blank');
                                        }}
                                    >
                                        <ExternalLink className="size-4" />
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}