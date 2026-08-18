import { MapPin, Clock, Bookmark, BookmarkCheck, ExternalLink, Sparkles, Building2 } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export function JobCard({ job, viewMode, onSave, onView }) {
    const getMatchStyle = (pct) => {
        if (pct >= 80) return { bar: 'bg-[#EBBB49]', text: 'text-zinc-900', bg: 'bg-[#EBBB49]' };
        if (pct >= 60) return { bar: 'bg-zinc-600', text: 'text-zinc-900', bg: 'bg-zinc-200' };
        return { bar: 'bg-zinc-300', text: 'text-zinc-500', bg: 'bg-zinc-100' };
    };

    const safeDistance = (date) => {
        if (!date) return '';
        try { return formatDistanceToNow(new Date(date), { addSuffix: true }); } catch { return ''; }
    };

    const formatType = (type) => type?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || '';

    const isScored = job.ok !== false;
    const match = getMatchStyle(job.matchPercentage);

    if (viewMode === 'list') {
        return (
            <div className="bg-white border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all p-5 flex flex-col lg:flex-row gap-4">
                <div className="flex gap-4 flex-1">
                    <div className="size-14 bg-zinc-900 border-2 border-zinc-900 flex items-center justify-center flex-shrink-0">
                        <Building2 className="size-7 text-[#EBBB49]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-black uppercase italic tracking-tight text-zinc-900 text-base leading-tight mb-0.5">{job.title}</h3>
                        <p className="text-[11px] font-black uppercase text-zinc-500 mb-2">{job.companyName}</p>
                        <div className="flex flex-wrap gap-3 text-[10px] font-bold uppercase text-zinc-500 mb-3">
                            <span className="flex items-center gap-1"><MapPin className="size-3" />{job.location}</span>
                            <span className="flex items-center gap-1"><Clock className="size-3" />{safeDistance(job.postedDate)}</span>
                            <span className="border border-zinc-900 px-1.5 py-0.5">{formatType(job.type)}</span>
                            {job.salary && <span className="border border-zinc-900 px-1.5 py-0.5">{job.salary}</span>}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {job.matchedSkills?.slice(0, 5).map((skill, i) => (
                                <span key={i} className="bg-[#EBBB49] border border-zinc-900 text-[9px] font-black uppercase px-2 py-0.5">{skill}</span>
                            ))}
                            {job.matchedSkills?.length > 5 && (
                                <span className="border border-zinc-400 text-[9px] font-black uppercase px-2 py-0.5 text-zinc-400">+{job.matchedSkills.length - 5}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 lg:w-44">
                    {isScored ? (
                        <div className={`${match.bg} border-2 border-zinc-900 p-3`}>
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[9px] font-black uppercase text-zinc-600">Match</span>
                                <span className="text-xl font-black italic text-zinc-900">{job.matchPercentage}%</span>
                            </div>
                            <div className="h-2 border border-zinc-900 bg-white">
                                <div className={`h-full ${match.bar}`} style={{ width: `${job.matchPercentage}%` }} />
                            </div>
                        </div>
                    ) : (
                        <div className="bg-zinc-100 border-2 border-zinc-300 p-3 flex items-center justify-center">
                            <span className="text-[9px] font-black uppercase text-zinc-400">Not Scored</span>
                        </div>
                    )}
                    <button onClick={() => onView(job)} className="w-full border-2 border-zinc-900 bg-zinc-900 text-[#EBBB49] py-2 text-[10px] font-black uppercase italic shadow-[2px_2px_0px_0px_#EBBB49] hover:bg-zinc-700 transition-all">View Details</button>
                    <div className="flex gap-2">
                        <button onClick={() => onSave(job.id)} className="flex-1 border-2 border-zinc-900 py-2 hover:bg-zinc-100 transition-all flex items-center justify-center">
                            {job.saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
                        </button>
                        {job.jobUrl && (
                            <button onClick={() => window.open(job.jobUrl, '_blank')} className="flex-1 border-2 border-zinc-900 py-2 hover:bg-[#EBBB49] transition-all flex items-center justify-center">
                                <ExternalLink className="size-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Grid view
    return (
        <div className="bg-white border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all p-5 flex flex-col h-full">
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="size-11 bg-zinc-900 border-2 border-zinc-900 flex items-center justify-center flex-shrink-0">
                    <Building2 className="size-5 text-[#EBBB49]" />
                </div>
                {isScored ? (
                    <div className={`${match.bg} border-2 border-zinc-900 px-2.5 py-1 flex items-center gap-1.5`}>
                        <Sparkles className="size-3 text-zinc-900" />
                        <span className="text-sm font-black text-zinc-900">{job.matchPercentage}%</span>
                    </div>
                ) : (
                    <div className="bg-zinc-100 border-2 border-zinc-300 px-2.5 py-1">
                        <span className="text-[9px] font-black uppercase text-zinc-400">Not Scored</span>
                    </div>
                )}
            </div>

            <h3 className="font-black uppercase italic tracking-tight text-zinc-900 text-sm leading-tight mb-0.5 line-clamp-2">{job.title}</h3>
            <p className="text-[10px] font-black uppercase text-zinc-500 mb-3">{job.companyName}</p>

            <div className="flex flex-wrap gap-2 text-[9px] font-bold uppercase text-zinc-500 mb-3">
                <span className="flex items-center gap-1"><MapPin className="size-3" />{job.location}</span>
                <span className="flex items-center gap-1"><Clock className="size-3" />{safeDistance(job.postedDate)}</span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="border border-zinc-900 text-[9px] font-black uppercase px-1.5 py-0.5">{formatType(job.type)}</span>
                {job.salary && <span className="border border-zinc-900 text-[9px] font-black uppercase px-1.5 py-0.5">{job.salary}</span>}
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4 flex-1">
                {job.matchedSkills?.slice(0, 4).map((skill, i) => (
                    <span key={i} className="bg-[#EBBB49] border border-zinc-900 text-[9px] font-black uppercase px-2 py-0.5">{skill}</span>
                ))}
                {job.matchedSkills?.length > 4 && (
                    <span className="border border-zinc-400 text-[9px] font-black uppercase px-2 py-0.5 text-zinc-400">+{job.matchedSkills.length - 4}</span>
                )}
            </div>

            <div className="mb-4">
                <div className="flex justify-between text-[9px] font-black uppercase mb-1">
                    <span className="text-zinc-500">Profile Match</span>
                    <span className="text-zinc-900">{job.matchPercentage}%</span>
                </div>
                <div className="h-2 border border-zinc-900 bg-zinc-100">
                    <div className={`h-full ${match.bar}`} style={{ width: `${job.matchPercentage}%` }} />
                </div>
            </div>

            <div className="flex gap-2 mt-auto">
                <button onClick={() => onView(job)} className="flex-1 border-2 border-zinc-900 bg-zinc-900 text-[#EBBB49] py-2.5 text-[10px] font-black uppercase italic shadow-[2px_2px_0px_0px_#EBBB49] hover:bg-zinc-700 transition-all">View Details</button>
                <button onClick={() => onSave(job.id)} className="border-2 border-zinc-900 px-3 hover:bg-zinc-100 transition-all">
                    {job.saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
                </button>
                {job.jobUrl && (
                    <button onClick={() => window.open(job.jobUrl, '_blank')} className="border-2 border-zinc-900 px-3 hover:bg-[#EBBB49] transition-all">
                        <ExternalLink className="size-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
