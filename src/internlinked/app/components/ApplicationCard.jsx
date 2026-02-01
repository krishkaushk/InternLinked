import { Calendar, DollarSign, MapPin, ExternalLink, FileText, Target } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { format } from 'date-fns';

// Removed: import { Application } from '@/types';
// Removed: interface ApplicationCardProps

export function ApplicationCard({ application, onDragStart, onDragEnd, onClick }) {
    const statusColors = {
        saved: 'bg-gray-100 text-gray-700 border-gray-300',
        applied: 'bg-blue-100 text-blue-700 border-blue-300',
        interview: 'bg-purple-100 text-purple-700 border-purple-300',
        offer: 'bg-green-100 text-green-700 border-green-300',
        rejected: 'bg-red-100 text-red-700 border-red-300',
    };

    return (
        <Card
            className="p-4 cursor-move hover:shadow-md transition-shadow bg-white border-2"
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={onClick}
        >
            <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{application.position}</h3>
                        <p className="text-sm text-gray-600 mt-1">{application.companyName}</p>
                    </div>
                    {application.matchScore && (
                        <div className="flex items-center gap-1 ml-2">
                            <Target className="size-4 text-green-600" />
                            <span className="text-sm font-semibold text-green-600">{application.matchScore}%</span>
                        </div>
                    )}
                </div>

                {/* Location & Type */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="size-4" />
                    <span>{application.location}</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                        {application.jobType}
                    </Badge>
                </div>

                {/* Salary */}
                {application.salary && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="size-4" />
                        <span>{application.salary}</span>
                    </div>
                )}

                {/* Dates */}
                <div className="space-y-1">
                    {application.deadline && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="size-4" />
                            <span className="text-xs">
                Deadline: {format(new Date(application.deadline), 'MMM d, yyyy')}
              </span>
                        </div>
                    )}
                    {application.interviewDate && (
                        <div className="flex items-center gap-2 text-sm text-purple-600 font-medium">
                            <Calendar className="size-4" />
                            <span className="text-xs">
                Interview: {format(new Date(application.interviewDate), 'MMM d, yyyy')}
              </span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                        {application.resumeVersion && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <FileText className="size-3" />
                                <span className="truncate max-w-[120px]">{application.resumeVersion}</span>
                            </div>
                        )}
                    </div>
                    {application.jobUrl && (
                        <ExternalLink className="size-4 text-gray-400 hover:text-gray-600" />
                    )}
                </div>

                {/* Notes Preview */}
                {application.notes && (
                    <p className="text-xs text-gray-500 line-clamp-2 italic">{application.notes}</p>
                )}
            </div>
        </Card>
    );
}