import {
    MapPin,
    Clock,
    Bookmark,
    BookmarkCheck,
    ExternalLink,
    Sparkles,
    Building2,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

// Removed: import type { JobMatch } from '@/app/components/JobMatches';
// Removed: interface JobCardProps

export function JobCard({ job, viewMode, onSave, onView }) {
    const getMatchColor = (percentage) => {
        if (percentage >= 80) return 'text-green-600';
        if (percentage >= 60) return 'text-yellow-600';
        return 'text-gray-600';
    };

    const getMatchBgColor = (percentage) => {
        if (percentage >= 80) return 'bg-green-50';
        if (percentage >= 60) return 'bg-yellow-50';
        return 'bg-gray-50';
    };

    const getMatchProgressColor = (percentage) => {
        if (percentage >= 80) return 'bg-green-600';
        if (percentage >= 60) return 'bg-yellow-600';
        return 'bg-gray-600';
    };

    const formatJobType = (type) => {
        if (!type) return '';
        return type
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Helper for safe date distance formatting in JSX
    const safeDistanceToNow = (date) => {
        if (!date) return '';
        try {
            return formatDistanceToNow(new Date(date), { addSuffix: true });
        } catch (e) {
            return '';
        }
    };

    if (viewMode === 'list') {
        return (
            <div className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Left: Logo and Basic Info */}
                    <div className="flex gap-4 flex-1">
                        {/* Company Logo */}
                        <div className="size-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            {job.companyLogo ? (
                                <img src={job.companyLogo} alt={job.companyName} className="size-full object-cover rounded-lg" />
                            ) : (
                                <Building2 className="size-8 text-white" />
                            )}
                        </div>

                        {/* Job Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg text-gray-900 mb-1">{job.title}</h3>
                                    <p className="text-gray-600 mb-2">{job.companyName}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                                <div className="flex items-center gap-1">
                                    <MapPin className="size-4" />
                                    <span>{job.location}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="size-4" />
                                    <span>{safeDistanceToNow(job.postedDate)}</span>
                                </div>
                                <Badge variant="secondary">{formatJobType(job.type)}</Badge>
                                {job.salary && <Badge variant="outline">{job.salary}</Badge>}
                            </div>

                            {/* Skills */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                {job.matchedSkills?.slice(0, 5).map((skill, index) => (
                                    <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                        {skill}
                                    </Badge>
                                ))}
                                {job.matchedSkills?.length > 5 && (
                                    <Badge variant="outline" className="text-gray-600">
                                        +{job.matchedSkills.length - 5} more
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Match Score and Actions */}
                    <div className="flex flex-col items-end gap-3 lg:w-48">
                        <div className={`${getMatchBgColor(job.matchPercentage)} rounded-lg p-4 w-full`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Match</span>
                                <span className={`text-2xl font-bold ${getMatchColor(job.matchPercentage)}`}>
                  {job.matchPercentage}%
                </span>
                            </div>
                            <div className="relative h-2 bg-white rounded-full overflow-hidden">
                                <div
                                    className={`absolute inset-y-0 left-0 ${getMatchProgressColor(job.matchPercentage)} transition-all`}
                                    style={{ width: `${job.matchPercentage}%` }}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 w-full">
                            <Button
                                onClick={() => onView(job)}
                                className="w-full"
                                size="sm"
                            >
                                View Details
                            </Button>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => onSave(job.id)}
                                >
                                    {job.saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
                                </Button>
                                {job.jobUrl && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => window.open(job.jobUrl, '_blank')}
                                    >
                                        <ExternalLink className="size-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Grid view
    return (
        <div className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow flex flex-col h-full">
            <div className="flex items-start gap-4 mb-4">
                <div className="size-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    {job.companyLogo ? (
                        <img src={job.companyLogo} alt={job.companyName} className="size-full object-cover rounded-lg" />
                    ) : (
                        <Building2 className="size-6 text-white" />
                    )}
                </div>

                <div className={`ml-auto ${getMatchBgColor(job.matchPercentage)} rounded-lg px-3 py-1.5`}>
                    <div className="flex items-center gap-1.5">
                        <Sparkles className={`size-4 ${getMatchColor(job.matchPercentage)}`} />
                        <span className={`font-bold ${getMatchColor(job.matchPercentage)}`}>
              {job.matchPercentage}%
            </span>
                    </div>
                </div>
            </div>

            <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-2">{job.title}</h3>
            <p className="text-gray-600 mb-3">{job.companyName}</p>

            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                    <MapPin className="size-4" />
                    <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Clock className="size-4" />
                    <span>{safeDistanceToNow(job.postedDate)}</span>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary">{formatJobType(job.type)}</Badge>
                {job.salary && <Badge variant="outline">{job.salary}</Badge>}
            </div>

            <div className="flex flex-wrap gap-2 mb-4 flex-1">
                {job.matchedSkills?.slice(0, 4).map((skill, index) => (
                    <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {skill}
                    </Badge>
                ))}
                {job.matchedSkills?.length > 4 && (
                    <Badge variant="outline" className="text-gray-600">
                        +{job.matchedSkills.length - 4}
                    </Badge>
                )}
            </div>

            <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
                    <span>Profile Match</span>
                    <span className="font-medium">{job.matchPercentage}%</span>
                </div>
                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={`absolute inset-y-0 left-0 ${getMatchProgressColor(job.matchPercentage)} transition-all`}
                        style={{ width: `${job.matchPercentage}%` }}
                    />
                </div>
            </div>

            <div className="flex gap-2 mt-auto">
                <Button
                    onClick={() => onView(job)}
                    className="flex-1"
                    size="sm"
                >
                    View Details
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSave(job.id)}
                >
                    {job.saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
                </Button>
                {job.jobUrl && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(job.jobUrl, '_blank')}
                    >
                        <ExternalLink className="size-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}