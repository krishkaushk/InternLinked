import { useState, useMemo } from 'react';
import {
    Search,
    SlidersHorizontal,
    Grid3x3,
    List,
    Briefcase,
    TrendingUp,
    Target,
    Clock,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/app/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/app/components/ui/sheet';
import { Skeleton } from '@/app/components/ui/skeleton';
import { JobCard } from '@/app/components/JobCard';
import { JobDetailDrawer } from '@/app/components/JobDetailDrawer';
import { mockJobs } from '@/data/mockData';

// Removed: interface JobMatch
// Removed: interface JobMatchesProps

export function JobMatches({ profile }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [selectedJob, setSelectedJob] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [sortBy, setSortBy] = useState('match');
    const [isLoading, setIsLoading] = useState(false);

    // Filter states
    const [locationFilter, setLocationFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [matchFilter, setMatchFilter] = useState('all');

    const jobs = mockJobs;

    // Filter and sort jobs
    const filteredAndSortedJobs = useMemo(() => {
        let filtered = jobs.filter((job) => {
            // Search filter
            const matchesSearch =
                searchQuery === '' ||
                job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                job.matchedSkills?.some(skill =>
                    skill.toLowerCase().includes(searchQuery.toLowerCase())
                );

            // Location filter
            const matchesLocation =
                locationFilter === 'all' ||
                job.location.toLowerCase().includes(locationFilter.toLowerCase());

            // Type filter
            const matchesType = typeFilter === 'all' || job.type === typeFilter;

            // Match percentage filter
            let matchesMatchPercentage = true;
            if (matchFilter === 'high') {
                matchesMatchPercentage = job.matchPercentage >= 80;
            } else if (matchFilter === 'medium') {
                matchesMatchPercentage = job.matchPercentage >= 60 && job.matchPercentage < 80;
            } else if (matchFilter === 'low') {
                matchesMatchPercentage = job.matchPercentage < 60;
            }

            return matchesSearch && matchesLocation && matchesType && matchesMatchPercentage;
        });

        // Sort
        filtered.sort((a, b) => {
            if (sortBy === 'match') {
                return b.matchPercentage - a.matchPercentage;
            } else if (sortBy === 'date') {
                // Ensure comparison works even if dates are strings
                return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
            } else if (sortBy === 'company') {
                return a.companyName.localeCompare(b.companyName);
            }
            return 0;
        });

        return filtered;
    }, [jobs, searchQuery, locationFilter, typeFilter, matchFilter, sortBy]);

    // Calculate stats
    const stats = useMemo(() => {
        const totalMatches = jobs.length;
        const highMatches = jobs.filter(j => j.matchPercentage >= 80).length;
        const averageMatch = jobs.length > 0
            ? Math.round(jobs.reduce((sum, j) => sum + j.matchPercentage, 0) / jobs.length)
            : 0;
        const newToday = jobs.filter(j => {
            const today = new Date();
            const posted = new Date(j.postedDate);
            return posted.toDateString() === today.toDateString();
        }).length;

        return { totalMatches, highMatches, averageMatch, newToday };
    }, [jobs]);

    const handleSaveJob = (jobId) => {
        console.log('Save job:', jobId);
    };

    const handleViewJob = (job) => {
        setSelectedJob(job);
    };

    const activeFiltersCount = [
        locationFilter !== 'all',
        typeFilter !== 'all',
        matchFilter !== 'all',
    ].filter(Boolean).length;

    return (
        <div className="space-y-6">
            {/* Stats Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Matches</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalMatches}</p>
                        </div>
                        <div className="size-12 bg-blue-50 rounded-lg flex items-center justify-center">
                            <Briefcase className="size-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">High Matches</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">{stats.highMatches}</p>
                        </div>
                        <div className="size-12 bg-green-50 rounded-lg flex items-center justify-center">
                            <Target className="size-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Avg Match</p>
                            <p className="text-2xl font-bold text-purple-600 mt-1">{stats.averageMatch}%</p>
                        </div>
                        <div className="size-12 bg-purple-50 rounded-lg flex items-center justify-center">
                            <TrendingUp className="size-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">New Today</p>
                            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.newToday}</p>
                        </div>
                        <div className="size-12 bg-orange-50 rounded-lg flex items-center justify-center">
                            <Clock className="size-6 text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg border p-4">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search by job title, company, or skills..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsFilterOpen(true)}
                                className="relative"
                            >
                                <SlidersHorizontal className="size-4 mr-2" />
                                Filters
                                {activeFiltersCount > 0 && (
                                    <Badge className="ml-2 size-5 rounded-full p-0 flex items-center justify-center bg-blue-600">
                                        {activeFiltersCount}
                                    </Badge>
                                )}
                            </Button>
                            <div className="hidden sm:flex border rounded-lg overflow-hidden">
                                <Button
                                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('grid')}
                                    className="rounded-none"
                                >
                                    <Grid3x3 className="size-4" />
                                </Button>
                                <Button
                                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('list')}
                                    className="rounded-none"
                                >
                                    <List className="size-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <p className="text-sm text-gray-600">
                            Showing <span className="font-medium text-gray-900">{filteredAndSortedJobs.length}</span> of{' '}
                            <span className="font-medium text-gray-900">{jobs.length}</span> job matches
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Sort by:</span>
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="match">Best Match</SelectItem>
                                    <SelectItem value="date">Most Recent</SelectItem>
                                    <SelectItem value="company">Company Name</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Rendering */}
            {isLoading ? (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'space-y-4'}>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-lg border p-6">
                            <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2 mb-4" />
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                    ))}
                </div>
            ) : filteredAndSortedJobs.length === 0 ? (
                <div className="bg-white rounded-lg border p-12 text-center">
                    <div className="size-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="size-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
                    <p className="text-gray-600 mb-4">
                        Try adjusting your search or filters to find more opportunities
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setSearchQuery('');
                            setLocationFilter('all');
                            setTypeFilter('all');
                            setMatchFilter('all');
                        }}
                    >
                        Clear Filters
                    </Button>
                </div>
            ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'space-y-4'}>
                    {filteredAndSortedJobs.map((job) => (
                        <JobCard
                            key={job.id}
                            job={job}
                            viewMode={viewMode}
                            onSave={handleSaveJob}
                            onView={handleViewJob}
                        />
                    ))}
                </div>
            )}

            {/* Filter Sheet */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Filter Jobs</SheetTitle>
                        <SheetDescription>
                            Refine your job search with these filters
                        </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-6 mt-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Location</label>
                            <Select value={locationFilter} onValueChange={setLocationFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Locations</SelectItem>
                                    <SelectItem value="remote">Remote</SelectItem>
                                    <SelectItem value="new york">New York</SelectItem>
                                    <SelectItem value="san francisco">San Francisco</SelectItem>
                                    <SelectItem value="seattle">Seattle</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Job Type</label>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="internship">Internship</SelectItem>
                                    <SelectItem value="full-time">Full-time</SelectItem>
                                    <SelectItem value="part-time">Part-time</SelectItem>
                                    <SelectItem value="contract">Contract</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Match Percentage</label>
                            <Select value={matchFilter} onValueChange={setMatchFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Matches</SelectItem>
                                    <SelectItem value="high">High Match (80%+)</SelectItem>
                                    <SelectItem value="medium">Medium Match (60-79%)</SelectItem>
                                    <SelectItem value="low">Low Match (&lt;60%)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                    setLocationFilter('all');
                                    setTypeFilter('all');
                                    setMatchFilter('all');
                                }}
                            >
                                Clear All
                            </Button>
                            <Button className="flex-1" onClick={() => setIsFilterOpen(false)}>
                                Apply Filters
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Detail Drawer */}
            {selectedJob && (
                <JobDetailDrawer
                    job={selectedJob}
                    profile={profile}
                    open={!!selectedJob}
                    onClose={() => setSelectedJob(null)}
                    onSave={handleSaveJob}
                />
            )}
        </div>
    );
}