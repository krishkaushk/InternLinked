import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Grid3x3, List, Briefcase, TrendingUp, Target, Clock, X, RotateCcw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { JobCard } from '@/app/components/JobCard';
import { JobDetailDrawer } from '@/app/components/JobDetailDrawer';

export function JobMatches({ profile, jobs = [], isLoading = false, onRefresh }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [selectedJob, setSelectedJob] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [sortBy, setSortBy] = useState('match');
    const [locationFilter, setLocationFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [matchFilter, setMatchFilter] = useState('all');

    const filteredAndSortedJobs = useMemo(() => {
        let filtered = jobs.filter((job) => {
            const matchesSearch = searchQuery === '' ||
                job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                job.matchedSkills?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesLocation = locationFilter === 'all' || job.location.toLowerCase().includes(locationFilter.toLowerCase());
            const matchesType = typeFilter === 'all' || job.type === typeFilter;
            // Unscored jobs (ok === false — a failed batch) never match a specific %-range
            // filter; they only show up under "All Matches" so a scoring failure doesn't get
            // silently bucketed as "Low".
            let matchesPct = true;
            if (matchFilter !== 'all') {
                if (job.ok === false) matchesPct = false;
                else if (matchFilter === 'high') matchesPct = job.matchPercentage >= 80;
                else if (matchFilter === 'medium') matchesPct = job.matchPercentage >= 60 && job.matchPercentage < 80;
                else if (matchFilter === 'low') matchesPct = job.matchPercentage < 60;
            }
            return matchesSearch && matchesLocation && matchesType && matchesPct;
        });

        filtered.sort((a, b) => {
            if (sortBy === 'match') {
                const av = a.ok === false ? -1 : (a.matchPercentage ?? 0);
                const bv = b.ok === false ? -1 : (b.matchPercentage ?? 0);
                return bv - av;
            }
            if (sortBy === 'date') return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
            if (sortBy === 'company') return a.companyName.localeCompare(b.companyName);
            return 0;
        });

        return filtered;
    }, [jobs, searchQuery, locationFilter, typeFilter, matchFilter, sortBy]);

    const stats = useMemo(() => {
        // Unscored jobs shouldn't drag down the average or hide from "Total Matches" — they're
        // still real postings, just not yet (or not successfully) scored.
        const scored = jobs.filter(j => j.ok !== false);
        return {
            total: jobs.length,
            high: scored.filter(j => j.matchPercentage >= 80).length,
            avg: scored.length > 0 ? Math.round(scored.reduce((s, j) => s + j.matchPercentage, 0) / scored.length) : 0,
            today: jobs.filter(j => new Date(j.postedDate).toDateString() === new Date().toDateString()).length,
        };
    }, [jobs]);

    const activeFilters = [locationFilter !== 'all', typeFilter !== 'all', matchFilter !== 'all'].filter(Boolean).length;

    const inputStyle = "w-full border-2 border-zinc-900 p-2 outline-none focus:bg-yellow-50 focus:ring-2 ring-[#EBBB49] transition-all rounded-none font-bold text-sm bg-white";
    const labelStyle = "text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1";

    return (
        <div className="h-full flex flex-col space-y-6">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-zinc-900">Job Matches</h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] italic text-zinc-400">Matched to your resume</p>
                </div>
                <button
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="flex items-center gap-2 border-2 border-zinc-900 px-4 py-2 text-[10px] font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#EBBB49] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <RotateCcw className={`size-3 ${isLoading ? 'animate-spin' : ''}`} />
                    Reload
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Matches', value: stats.total, icon: Briefcase },
                    { label: 'High Matches', value: stats.high, icon: Target },
                    { label: 'Avg Match', value: `${stats.avg}%`, icon: TrendingUp },
                    { label: 'New Today', value: stats.today, icon: Clock },
                ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="bg-white border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{label}</p>
                            <p className="text-2xl font-black italic text-zinc-900 mt-1">{value}</p>
                        </div>
                        <div className="size-10 bg-[#EBBB49] border-2 border-zinc-900 flex items-center justify-center">
                            <Icon className="size-5 text-zinc-900" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Search + Controls */}
            <div className="bg-white border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 space-y-3">
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Search by title, company, or skill..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`${inputStyle} pl-10`}
                        />
                    </div>
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="relative border-2 border-zinc-900 px-4 py-2 text-[10px] font-black uppercase hover:bg-zinc-100 transition-all flex items-center gap-2"
                    >
                        <SlidersHorizontal className="size-4" />
                        Filters
                        {activeFilters > 0 && (
                            <span className="bg-[#EBBB49] border border-zinc-900 text-[9px] font-black px-1.5 py-0.5">{activeFilters}</span>
                        )}
                    </button>
                    <div className="flex border-2 border-zinc-900 overflow-hidden">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-3 py-2 transition-all ${viewMode === 'grid' ? 'bg-[#EBBB49]' : 'hover:bg-zinc-100'}`}
                        >
                            <Grid3x3 className="size-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-2 border-l-2 border-zinc-900 transition-all ${viewMode === 'list' ? 'bg-[#EBBB49]' : 'hover:bg-zinc-100'}`}
                        >
                            <List className="size-4" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase text-zinc-400">
                        Showing <span className="text-zinc-900">{filteredAndSortedJobs.length}</span> of <span className="text-zinc-900">{jobs.length}</span> matches
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-zinc-400">Sort:</span>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-36 border-2 border-zinc-900 rounded-none text-[10px] font-black uppercase h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-2 border-zinc-900 rounded-none">
                                <SelectItem value="match">Best Match</SelectItem>
                                <SelectItem value="date">Most Recent</SelectItem>
                                <SelectItem value="company">Company</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Inline filter panel */}
                {isFilterOpen && (
                    <div className="border-t-2 border-zinc-900 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className={labelStyle}>Location</label>
                            <Select value={locationFilter} onValueChange={setLocationFilter}>
                                <SelectTrigger className="border-2 border-zinc-900 rounded-none text-[10px] font-black uppercase h-9"><SelectValue /></SelectTrigger>
                                <SelectContent className="border-2 border-zinc-900 rounded-none">
                                    <SelectItem value="all">All Locations</SelectItem>
                                    <SelectItem value="remote">Remote</SelectItem>
                                    <SelectItem value="new york">New York</SelectItem>
                                    <SelectItem value="san francisco">San Francisco</SelectItem>
                                    <SelectItem value="seattle">Seattle</SelectItem>
                                    <SelectItem value="toronto">Toronto</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className={labelStyle}>Job Type</label>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="border-2 border-zinc-900 rounded-none text-[10px] font-black uppercase h-9"><SelectValue /></SelectTrigger>
                                <SelectContent className="border-2 border-zinc-900 rounded-none">
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="internship">Internship</SelectItem>
                                    <SelectItem value="full-time">Full-time</SelectItem>
                                    <SelectItem value="contract">Contract</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className={labelStyle}>Match %</label>
                            <Select value={matchFilter} onValueChange={setMatchFilter}>
                                <SelectTrigger className="border-2 border-zinc-900 rounded-none text-[10px] font-black uppercase h-9"><SelectValue /></SelectTrigger>
                                <SelectContent className="border-2 border-zinc-900 rounded-none">
                                    <SelectItem value="all">All Matches</SelectItem>
                                    <SelectItem value="high">High (80%+)</SelectItem>
                                    <SelectItem value="medium">Medium (60–79%)</SelectItem>
                                    <SelectItem value="low">Low (&lt;60%)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <button
                            onClick={() => { setLocationFilter('all'); setTypeFilter('all'); setMatchFilter('all'); }}
                            className="sm:col-span-3 border-2 border-zinc-400 text-[10px] font-black uppercase py-1.5 text-zinc-400 hover:border-zinc-900 hover:text-zinc-900 transition-all flex items-center justify-center gap-2"
                        >
                            <X className="size-3" /> Clear Filters
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            {isLoading ? (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'space-y-4'}>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white border-2 border-zinc-900 p-5 space-y-3 animate-pulse">
                            <div className="flex gap-3">
                                <div className="size-11 bg-zinc-200 border-2 border-zinc-300" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-zinc-200 w-3/4" />
                                    <div className="h-3 bg-zinc-100 w-1/2" />
                                </div>
                            </div>
                            <div className="h-3 bg-zinc-100 w-full" />
                            <div className="h-3 bg-zinc-100 w-2/3" />
                            <div className="h-2 bg-zinc-200 w-full" />
                        </div>
                    ))}
                </div>
            ) : !profile?.skills?.length ? (
                <div className="bg-white border-2 border-zinc-900 p-12 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="size-16 bg-[#EBBB49] border-2 border-zinc-900 flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="size-8 text-zinc-900" />
                    </div>
                    <h3 className="text-lg font-black uppercase italic text-zinc-900 mb-2">No skills on your profile</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Add skills to your profile to see matched job listings</p>
                </div>
            ) : filteredAndSortedJobs.length === 0 ? (
                <div className="bg-white border-2 border-zinc-900 p-12 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="size-16 bg-zinc-100 border-2 border-zinc-900 flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="size-8 text-zinc-400" />
                    </div>
                    <h3 className="text-lg font-black uppercase italic text-zinc-900 mb-2">No jobs found</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">Try adjusting your search or filters</p>
                    <button
                        onClick={() => { setSearchQuery(''); setLocationFilter('all'); setTypeFilter('all'); setMatchFilter('all'); }}
                        className="border-2 border-zinc-900 px-6 py-2 text-[10px] font-black uppercase hover:bg-zinc-100 transition-all"
                    >
                        Clear Filters
                    </button>
                </div>
            ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'space-y-4'}>
                    {filteredAndSortedJobs.map((job) => (
                        <JobCard key={job.id} job={job} viewMode={viewMode} onSave={() => {}} onView={setSelectedJob} />
                    ))}
                </div>
            )}

            {selectedJob && (
                <JobDetailDrawer job={selectedJob} profile={profile} open={!!selectedJob} onClose={() => setSelectedJob(null)} onSave={() => {}} />
            )}
        </div>
    );
}
