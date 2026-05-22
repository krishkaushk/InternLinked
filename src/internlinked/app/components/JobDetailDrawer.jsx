import { X, MapPin, Clock, Building2, ExternalLink, Bookmark, BookmarkCheck, CheckCircle2, AlertCircle, Sparkles, FileText, TrendingUp, Lightbulb } from 'lucide-react';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

export function JobDetailDrawer({ job, profile, open, onClose, onSave }) {
    if (!open || !job) return null;

    const getMatchStyle = (pct) => {
        if (pct >= 80) return { bar: 'bg-[#EBBB49]', text: 'text-zinc-900', bg: 'bg-[#EBBB49]' };
        if (pct >= 60) return { bar: 'bg-zinc-600', text: 'text-zinc-900', bg: 'bg-zinc-200' };
        return { bar: 'bg-zinc-300', text: 'text-zinc-500', bg: 'bg-zinc-100' };
    };

    const formatType = (type) => type?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || '';

    const generateSuggestions = () => {
        const missing = job.missingSkills || [];
        const suggestions = [];
        if (missing.length > 0) suggestions.push({ icon: Lightbulb, title: 'Highlight transferable skills', description: `Emphasize how your experience relates to ${missing.slice(0, 3).join(', ')}` });
        if (job.matchPercentage < 80) suggestions.push({ icon: FileText, title: 'Tailor your resume', description: "Customize your resume to emphasize the skills they're looking for" });
        suggestions.push({ icon: TrendingUp, title: 'Quantify achievements', description: 'Add measurable results to your experience (e.g., "Increased efficiency by 30%")' });
        if (missing.length > 2) suggestions.push({ icon: Sparkles, title: 'Add relevant projects', description: 'Include personal or academic projects that demonstrate the required skills' });
        return suggestions;
    };

    const match = getMatchStyle(job.matchPercentage);
    const suggestions = generateSuggestions();

    return (
        <div className="fixed inset-0 z-50 lg:left-64">
            <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="absolute inset-y-0 right-0 w-full sm:w-[580px] bg-[#FDFCF0] border-l-4 border-zinc-900 flex flex-col">

                {/* Header */}
                <div className="bg-zinc-900 text-white p-6 flex-shrink-0">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1">
                            <div className="size-14 bg-[#EBBB49] border-2 border-[#EBBB49] flex items-center justify-center flex-shrink-0">
                                <Building2 className="size-7 text-zinc-900" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-xl font-black uppercase italic tracking-tighter text-white leading-tight mb-1">{job.title}</h2>
                                <p className="text-[#EBBB49] font-black uppercase text-xs tracking-wider">{job.companyName}</p>
                                <div className="flex flex-wrap gap-3 mt-2 text-[10px] font-bold uppercase text-zinc-400">
                                    <span className="flex items-center gap-1"><MapPin className="size-3" />{job.location}</span>
                                    <span className="flex items-center gap-1"><Clock className="size-3" />
                                        {job.postedDate ? formatDistanceToNow(new Date(job.postedDate), { addSuffix: true }) : 'Recently'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="hover:text-[#EBBB49] transition-colors p-1 flex-shrink-0">
                            <X className="size-5" strokeWidth={3} />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                        <span className="border border-zinc-600 text-[9px] font-black uppercase px-2 py-1 text-zinc-300">{formatType(job.type)}</span>
                        {job.salary && <span className="border border-zinc-600 text-[9px] font-black uppercase px-2 py-1 text-zinc-300">{job.salary}</span>}
                    </div>

                    {/* Match Score */}
                    <div className={`${match.bg} border-2 border-zinc-700 p-3`}>
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <Sparkles className="size-4 text-zinc-900" />
                                <span className="text-[10px] font-black uppercase text-zinc-900">Profile Match</span>
                            </div>
                            <span className="text-2xl font-black italic text-zinc-900">{job.matchPercentage}%</span>
                        </div>
                        <div className="h-2.5 border border-zinc-900 bg-white/50">
                            <div className="h-full bg-zinc-900" style={{ width: `${job.matchPercentage}%` }} />
                        </div>
                        {job.reason && <p className="text-[10px] font-bold text-zinc-800 mt-2 italic">"{job.reason}"</p>}
                    </div>
                </div>

                {/* Content */}
                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-6">

                        {/* Matched Skills */}
                        <div className="border-2 border-zinc-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                            <div className="flex items-center gap-2 mb-3 border-b-2 border-zinc-100 pb-2">
                                <CheckCircle2 className="size-4 text-[#EBBB49]" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest">Your Matching Skills ({job.matchedSkills?.length || 0})</h3>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {job.matchedSkills?.map((skill, i) => (
                                    <span key={i} className="bg-[#EBBB49] border border-zinc-900 text-[9px] font-black uppercase px-2 py-1">{skill}</span>
                                ))}
                                {!job.matchedSkills?.length && <p className="text-[10px] text-zinc-400 font-bold uppercase italic">No direct skill matches</p>}
                            </div>
                        </div>

                        {/* Missing Skills */}
                        {job.missingSkills?.length > 0 && (
                            <div className="border-2 border-zinc-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                                <div className="flex items-center gap-2 mb-3 border-b-2 border-zinc-100 pb-2">
                                    <AlertCircle className="size-4 text-zinc-500" />
                                    <h3 className="text-[10px] font-black uppercase tracking-widest">Skills to Develop ({job.missingSkills.length})</h3>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {job.missingSkills.map((skill, i) => (
                                        <span key={i} className="border-2 border-zinc-400 text-[9px] font-black uppercase px-2 py-1 text-zinc-500">{skill}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Requirements */}
                        {job.requirements?.length > 0 && (
                            <div className="border-2 border-zinc-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                                <h3 className="text-[10px] font-black uppercase tracking-widest border-b-2 border-zinc-100 pb-2 mb-3">Requirements</h3>
                                <ul className="space-y-2">
                                    {job.requirements.map((req, i) => (
                                        <li key={i} className="flex items-start gap-2 text-xs font-bold text-zinc-700">
                                            <span className="text-[#EBBB49] font-black mt-0.5">—</span>
                                            <span dangerouslySetInnerHTML={{ __html: req }} />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Description */}
                        <div className="border-2 border-zinc-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                            <h3 className="text-[10px] font-black uppercase tracking-widest border-b-2 border-zinc-100 pb-2 mb-3">Job Description</h3>
                            <p className="text-xs text-zinc-700 leading-relaxed whitespace-pre-line font-medium">{job.description?.slice(0, 1200)}</p>
                        </div>

                        {/* Resume Tips */}
                        <div className="border-2 border-zinc-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                            <h3 className="text-[10px] font-black uppercase tracking-widest border-b-2 border-zinc-100 pb-2 mb-3">Resume Tips</h3>
                            <div className="space-y-3">
                                {suggestions.map((s, i) => {
                                    const Icon = s.icon;
                                    return (
                                        <div key={i} className="flex gap-3 bg-zinc-50 border border-zinc-200 p-3">
                                            <div className="size-8 bg-[#EBBB49] border border-zinc-900 flex items-center justify-center flex-shrink-0">
                                                <Icon className="size-4 text-zinc-900" />
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase text-zinc-900 mb-0.5">{s.title}</h4>
                                                <p className="text-[10px] font-bold text-zinc-500">{s.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                {/* Footer */}
                <div className="flex-shrink-0 border-t-4 border-zinc-900 p-4 bg-white">
                    <div className="flex gap-3">
                        <button onClick={() => onSave(job.id)} className="flex-1 border-2 border-zinc-900 py-3 text-[10px] font-black uppercase italic hover:bg-zinc-100 transition-all flex items-center justify-center gap-2">
                            {job.saved ? <><BookmarkCheck className="size-4" /> Saved</> : <><Bookmark className="size-4" /> Save Job</>}
                        </button>
                        {job.jobUrl && (
                            <button onClick={() => window.open(job.jobUrl, '_blank')} className="flex-1 border-2 border-zinc-900 bg-[#EBBB49] py-3 text-[10px] font-black uppercase italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#d4a942] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2">
                                <ExternalLink className="size-4" /> Apply Now
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
