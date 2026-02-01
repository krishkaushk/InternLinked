import { useState } from 'react';
// Removed: import { Company, Job } from '@/types';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
    Building2,
    Plus,
    Search,
    ExternalLink,
    Target,
    MapPin,
    Calendar,
    TrendingUp,
    Star,
    StarOff,
} from 'lucide-react';
import { format } from 'date-fns';

export function CompaniesView({ companies, onUpdateCompanies }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('following');

    const followingCompanies = companies.filter((c) => c.following);
    const discoverCompanies = companies.filter((c) => !c.following);

    const toggleFollow = (companyId) => {
        const updatedCompanies = companies.map((company) =>
            company.id === companyId
                ? { ...company, following: !company.following }
                : company
        );
        onUpdateCompanies(updatedCompanies);
    };

    const filteredCompanies =
        activeTab === 'following'
            ? followingCompanies.filter((c) =>
                c.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            : discoverCompanies.filter((c) =>
                c.name.toLowerCase().includes(searchQuery.toLowerCase())
            );

    const allJobs = companies.flatMap((company) =>
        company.jobs.map((job) => ({ ...job, company }))
    );

    const getMatchColor = (score) => {
        if (!score) return 'text-gray-500';
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
                    <p className="text-gray-600 mt-1">
                        Follow companies and discover matching opportunities
                    </p>
                </div>
                <Button>
                    <Plus className="size-4 mr-2" />
                    Add Company
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                <Input
                    placeholder="Search companies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
                <TabsList>
                    <TabsTrigger value="following">
                        <Star className="size-4 mr-2" />
                        Following ({followingCompanies.length})
                    </TabsTrigger>
                    <TabsTrigger value="discover">
                        <TrendingUp className="size-4 mr-2" />
                        Discover
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="following" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCompanies.map((company) => (
                            <Card key={company.id} className="p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                            <Building2 className="size-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{company.name}</h3>
                                            <p className="text-sm text-gray-500">
                                                {company.jobs.length} open positions
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleFollow(company.id)}
                                        className="h-8 w-8 p-0"
                                    >
                                        {company.following ? (
                                            <Star className="size-4 fill-yellow-500 text-yellow-500" />
                                        ) : (
                                            <StarOff className="size-4 text-gray-400" />
                                        )}
                                    </Button>
                                </div>

                                {company.website && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full mb-4"
                                        onClick={() => window.open(company.website, '_blank')}
                                    >
                                        <ExternalLink className="size-4 mr-2" />
                                        Visit Website
                                    </Button>
                                )}

                                {company.jobs.length > 0 && (
                                    <div className="space-y-2 pt-4 border-t">
                                        <p className="text-sm font-medium text-gray-700">Latest Openings:</p>
                                        {company.jobs.map((job) => (
                                            <div
                                                key={job.id}
                                                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-sm text-gray-900">{job.title}</p>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                                                            <MapPin className="size-3" />
                                                            <span>{job.location}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                            <Calendar className="size-3" />
                                                            <span>Posted {format(new Date(job.postedDate), 'MMM d')}</span>
                                                        </div>
                                                    </div>
                                                    {job.matchScore && (
                                                        <div
                                                            className={`flex items-center gap-1 ${getMatchColor(job.matchScore)}`}
                                                        >
                                                            <Target className="size-3" />
                                                            <span className="text-xs font-semibold">{job.matchScore}%</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>

                    {filteredCompanies.length === 0 && (
                        <Card className="p-12 text-center">
                            <Building2 className="size-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No companies found. Start following companies to see them here.</p>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="discover" className="space-y-6">
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4">Recommended Opportunities</h2>
                        <div className="space-y-4">
                            {allJobs.map((job) => (
                                <div
                                    key={job.id}
                                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold text-gray-900">{job.title}</h3>
                                                {job.matchScore && (
                                                    <div
                                                        className={`flex items-center gap-1 ${getMatchColor(job.matchScore)} bg-green-50 px-2 py-0.5 rounded-full`}
                                                    >
                                                        <Target className="size-3" />
                                                        <span className="text-xs font-semibold">{job.matchScore}% Match</span>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">{job.company.name}</p>
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="size-4" />
                                                    <span>{job.location}</span>
                                                </div>
                                                <Badge variant="outline">{job.type}</Badge>
                                                <div className="flex items-center gap-1 text-xs">
                                                    <Calendar className="size-3" />
                                                    <span>Posted {format(new Date(job.postedDate), 'MMM d, yyyy')}</span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                                                {job.description}
                                            </p>
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {job.requirements.slice(0, 5).map((req) => (
                                                    <Badge key={req} variant="secondary" className="text-xs">
                                                        {req}
                                                    </Badge>
                                                ))}
                                                {job.requirements.length > 5 && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        +{job.requirements.length - 5} more
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <Button size="sm" className="flex-1">
                                            Apply Now
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => toggleFollow(job.companyId)}
                                        >
                                            <Star className="size-4 mr-2" />
                                            Follow Company
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}