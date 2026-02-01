import {
    X,
    MapPin,
    Clock,
    Building2,
    ExternalLink,
    Bookmark,
    BookmarkCheck,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    FileText,
    TrendingUp,
    Lightbulb,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { Separator } from '@/app/components/ui/separator';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

// Removed: import type { JobMatch } from '@/app/components/JobMatches';
// Removed: import type { UserProfile } from '@/types';
// Removed: interface JobDetailDrawerProps

export function JobDetailDrawer({ job, profile, open, onClose, onSave }) {
    if (!open || !job) return null;

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

    // Generate improvement suggestions based on missing skills
    const generateSuggestions = () => {
        const suggestions = [];
        const missingSkills = job.missingSkills || [];

        if (missingSkills.length > 0) {
            const topMissingSkills = missingSkills.slice(0, 3);
            suggestions.push({
                icon: Lightbulb,
                title: 'Highlight transferable skills',
                description: `Emphasize how your experience relates to ${topMissingSkills.join(', ')}`,
            });
        }

        if (job.matchPercentage < 80) {
            suggestions.push({
                icon: FileText,
                title: 'Tailor your resume',
                description: "Customize your resume to emphasize the skills they're looking for",
            });
        }

        suggestions.push({
            icon: TrendingUp,
            title: 'Quantify achievements',
            description: 'Add measurable results to your experience section (e.g., "Increased efficiency by 30%")',
        });

        if (missingSkills.length > 2) {
            suggestions.push({
                icon: Sparkles,
                title: 'Add relevant projects',
                description: 'Include personal or academic projects that demonstrate the required skills',
            });
        }

        return suggestions;
    };

    const suggestions = generateSuggestions();

    return (
        <div className="fixed inset-0 z-50 lg:left-64">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Drawer */}
            <div className="absolute inset-y-0 right-0 w-full sm:w-[600px] bg-white shadow-2xl">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex-shrink-0 border-b">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-start gap-4 flex-1">
                                    {/* Company Logo */}
                                    <div className="size-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                        {job.companyLogo ? (
                                            <img
                                                src={job.companyLogo}
                                                alt={job.companyName}
                                                className="size-full object-cover rounded-lg"
                                            />
                                        ) : (
                                            <Building2 className="size-8 text-white" />
                                        )}
                                    </div>

                                    {/* Job Info */}
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-1">{job.title}</h2>
                                        <p className="text-lg text-gray-600 mb-3">{job.companyName}</p>
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="size-4" />
                                                <span>{job.location}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="size-4" />
                                                <span>
                          {job.postedDate
                              ? formatDistanceToNow(new Date(job.postedDate), { addSuffix: true })
                              : 'Recently'}
                        </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Close Button */}
                                <Button variant="ghost" size="sm" onClick={onClose}>
                                    <X className="size-5" />
                                </Button>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                <Badge variant="secondary">{formatJobType(job.type)}</Badge>
                                {job.salary && <Badge variant="outline">{job.salary}</Badge>}
                            </div>

                            {/* Match Score */}
                            <div className={`${getMatchBgColor(job.matchPercentage)} rounded-lg p-4`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className={`size-5 ${getMatchColor(job.matchPercentage)}`} />
                                        <span className="font-semibold text-gray-900">Profile Match</span>
                                    </div>
                                    <span className={`text-2xl font-bold ${getMatchColor(job.matchPercentage)}`}>
                    {job.matchPercentage}%
                  </span>
                                </div>
                                <div className="relative h-3 bg-white rounded-full overflow-hidden">
                                    <div
                                        className={`absolute inset-y-0 left-0 ${getMatchProgressColor(
                                            job.matchPercentage
                                        )} transition-all`}
                                        style={{ width: `${job.matchPercentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <ScrollArea className="flex-1">
                        <div className="p-6 space-y-6">
                            {/* Description */}
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900 mb-3">Job Description</h3>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{job.description}</p>
                            </div>

                            <Separator />

                            {/* Requirements */}
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900 mb-3">Requirements</h3>
                                <ul className="space-y-2">
                                    {job.requirements?.map((req, index) => (
                                        <li key={index} className="flex items-start gap-2 text-gray-700">
                                            <CheckCircle2 className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                            <span>{req}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <Separator />

                            {/* Matched Skills */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle2 className="size-5 text-green-600" />
                                    <h3 className="font-semibold text-lg text-gray-900">
                                        Your Matching Skills ({job.matchedSkills?.length || 0})
                                    </h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {job.matchedSkills?.map((skill, index) => (
                                        <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Missing Skills */}
                            {job.missingSkills?.length > 0 && (
                                <>
                                    <Separator />
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <AlertCircle className="size-5 text-orange-600" />
                                            <h3 className="font-semibold text-lg text-gray-900">
                                                Skills to Highlight ({job.missingSkills.length})
                                            </h3>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">
                                            These skills are required but not prominently featured in your profile. Consider
                                            highlighting related experience or projects.
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {job.missingSkills.map((skill, index) => (
                                                <Badge key={index} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            <Separator />

                            {/* Resume Improvement Suggestions */}
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900 mb-3">Resume Improvement Tips</h3>
                                <div className="space-y-3">
                                    {suggestions.map((suggestion, index) => {
                                        const Icon = suggestion.icon;
                                        return (
                                            <div key={index} className="flex gap-3 p-4 bg-blue-50 rounded-lg">
                                                <div className="size-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <Icon className="size-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900 mb-1">{suggestion.title}</h4>
                                                    <p className="text-sm text-gray-600">{suggestion.description}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    {/* Footer Actions */}
                    <div className="flex-shrink-0 border-t p-6">
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => onSave(job.id)}
                            >
                                {job.saved ? (
                                    <>
                                        <BookmarkCheck className="size-4 mr-2" />
                                        Saved
                                    </>
                                ) : (
                                    <>
                                        <Bookmark className="size-4 mr-2" />
                                        Save Job
                                    </>
                                )}
                            </Button>
                            <Button className="flex-1">
                                <FileText className="size-4 mr-2" />
                                Tailor Resume
                            </Button>
                            {job.jobUrl && (
                                <Button variant="outline" onClick={() => window.open(job.jobUrl, '_blank')}>
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