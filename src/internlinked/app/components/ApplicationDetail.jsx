import {
    Sheet,
    SheetContent,
    SheetDescription,
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
} from 'lucide-react';
import { format } from 'date-fns';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/app/components/ui/select';

// Removed: import { Application, ApplicationStatus } from '@/types';
// Removed: interface ApplicationDetailProps

const statusConfig = {
    saved: { label: 'Saved', color: 'bg-gray-100 text-gray-700' },
    applied: { label: 'Applied', color: 'bg-blue-100 text-blue-700' },
    interview: { label: 'Interview', color: 'bg-purple-100 text-purple-700' },
    offer: { label: 'Offer', color: 'bg-green-100 text-green-700' },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
};

export function ApplicationDetail({
                                      application,
                                      open,
                                      onClose,
                                      onUpdateStatus,
                                      onDelete,
                                  }) {
    if (!application) return null;

    // Helper to ensure dates are valid objects for date-fns
    const safeFormat = (date, formatStr) => {
        if (!date) return '';
        return format(new Date(date), formatStr);
    };

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                <SheetHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <SheetTitle className="text-2xl">{application.position}</SheetTitle>
                            <SheetDescription className="text-lg mt-1">
                                {application.companyName}
                            </SheetDescription>
                        </div>
                        {application.matchScore && (
                            <div className="flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full">
                                <Target className="size-4 text-green-600" />
                                <span className="text-sm font-semibold text-green-600">
                  {application.matchScore}% Match
                </span>
                            </div>
                        )}
                    </div>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Status Update */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Status</label>
                        <Select
                            value={application.status}
                            onValueChange={(value) => onUpdateStatus(application.id, value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="saved">Saved</SelectItem>
                                <SelectItem value="applied">Applied</SelectItem>
                                <SelectItem value="interview">Interview</SelectItem>
                                <SelectItem value="offer">Offer</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    {/* Basic Info */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-gray-700">
                            <MapPin className="size-5 text-gray-400" />
                            <span>{application.location}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-700">
                            <Badge variant="outline">{application.jobType}</Badge>
                        </div>

                        {application.salary && (
                            <div className="flex items-center gap-2 text-gray-700">
                                <DollarSign className="size-5 text-gray-400" />
                                <span>{application.salary}</span>
                            </div>
                        )}

                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <Clock className="size-4" />
                            <span>Added {safeFormat(application.dateAdded, 'MMM d, yyyy')}</span>
                        </div>
                    </div>

                    <Separator />

                    {/* Dates */}
                    <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Important Dates</h4>

                        {application.deadline && (
                            <div className="flex items-center gap-2">
                                <Calendar className="size-5 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium">Application Deadline</p>
                                    <p className="text-sm text-gray-600">
                                        {safeFormat(application.deadline, 'EEEE, MMMM d, yyyy')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {application.interviewDate && (
                            <div className="flex items-center gap-2">
                                <Calendar className="size-5 text-purple-500" />
                                <div>
                                    <p className="text-sm font-medium text-purple-700">Interview Scheduled</p>
                                    <p className="text-sm text-purple-600">
                                        {safeFormat(application.interviewDate, 'EEEE, MMMM d, yyyy')}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {application.resumeVersion && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <h4 className="font-medium text-gray-900">Resume</h4>
                                <div className="flex items-center gap-2 text-gray-700 bg-gray-50 p-3 rounded-lg">
                                    <FileText className="size-5 text-gray-400" />
                                    <span className="text-sm">{application.resumeVersion}</span>
                                </div>
                            </div>
                        </>
                    )}

                    {application.notes && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <h4 className="font-medium text-gray-900">Notes</h4>
                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                        {application.notes}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {application.jobUrl && (
                        <>
                            <Separator />
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => window.open(application.jobUrl, '_blank')}
                            >
                                <ExternalLink className="size-4 mr-2" />
                                View Job Posting
                            </Button>
                        </>
                    )}

                    <Separator />

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1">
                            <Edit className="size-4 mr-2" />
                            Edit
                        </Button>
                        <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={() => {
                                onDelete(application.id);
                                onClose();
                            }}
                        >
                            <Trash2 className="size-4 mr-2" />
                            Delete
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}