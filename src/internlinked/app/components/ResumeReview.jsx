import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Progress } from '@/app/components/ui/progress';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
    FileText,
    Upload,
    Target,
    AlertCircle,
    CheckCircle,
    XCircle,
    TrendingUp,
    Lightbulb,
} from 'lucide-react';

// Removed: interface ResumeAnalysis

export function ResumeReview() {
    const [activeTab, setActiveTab] = useState('upload');
    const [resumeText, setResumeText] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const mockAnalyze = () => {
        setIsAnalyzing(true);

        // Simulate API call
        setTimeout(() => {
            const mockAnalysis = {
                score: 78,
                matchedKeywords: [
                    'JavaScript',
                    'React',
                    'Node.js',
                    'Git',
                    'Agile',
                    'Team Collaboration',
                    'Problem Solving',
                ],
                missingKeywords: [
                    'TypeScript',
                    'CI/CD',
                    'Docker',
                    'Testing',
                    'System Design',
                    'AWS',
                ],
                strengths: [
                    'Strong technical skills section with relevant technologies',
                    'Quantified achievements (e.g., "Improved performance by 40%")',
                    'Clear project descriptions with measurable impact',
                    'Relevant work experience in software development',
                    'Clean, professional formatting',
                ],
                improvements: [
                    'Add TypeScript to your skills - it\'s mentioned 3 times in the job description',
                    'Include experience with CI/CD pipelines and deployment',
                    'Mention any testing frameworks or methodologies you\'ve used',
                    'Highlight system design experience or coursework',
                    'Add cloud platform experience (AWS, GCP, or Azure)',
                    'Use more action verbs: "Architected," "Engineered," "Optimized"',
                    'Quantify more achievements with specific metrics',
                ],
                formatting: [
                    {
                        issue: 'Resume length exceeds 1 page for internship position',
                        severity: 'medium',
                    },
                    {
                        issue: 'Use bullet points consistently throughout all sections',
                        severity: 'low',
                    },
                ],
            };

            setAnalysis(mockAnalysis);
            setIsAnalyzing(false);
            setActiveTab('analyze');
        }, 1500);
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBgColor = (score) => {
        if (score >= 80) return 'bg-green-100';
        if (score >= 60) return 'bg-yellow-100';
        return 'bg-red-100';
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">ATS Resume Reviewer</h1>
                <p className="text-gray-600 mt-1">
                    Optimize your resume for Applicant Tracking Systems and improve your match score
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="upload">
                        <Upload className="size-4 mr-2" />
                        Upload & Input
                    </TabsTrigger>
                    <TabsTrigger value="analyze" disabled={!analysis}>
                        <Target className="size-4 mr-2" />
                        Analysis
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Resume Input */}
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <FileText className="size-5 text-blue-600" />
                                <h2 className="text-xl font-semibold">Your Resume</h2>
                            </div>

                            <div className="space-y-4">
                                <Button variant="outline" className="w-full">
                                    <Upload className="size-4 mr-2" />
                                    Upload Resume (PDF/DOCX)
                                </Button>

                                <div className="relative">
                                    <div className="absolute inset-x-0 top-1/2 h-px bg-gray-200" />
                                    <div className="relative flex justify-center">
                                        <span className="bg-white px-2 text-sm text-gray-500">or paste text</span>
                                    </div>
                                </div>

                                <Textarea
                                    placeholder="Paste your resume text here..."
                                    value={resumeText}
                                    onChange={(e) => setResumeText(e.target.value)}
                                    rows={12}
                                    className="font-mono text-sm"
                                />
                            </div>
                        </Card>

                        {/* Job Description Input */}
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Target className="size-5 text-purple-600" />
                                <h2 className="text-xl font-semibold">Job Description</h2>
                            </div>

                            <Textarea
                                placeholder="Paste the job description here to compare your resume..."
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                rows={16}
                                className="font-mono text-sm"
                            />
                        </Card>
                    </div>

                    <div className="flex justify-center">
                        <Button
                            size="lg"
                            onClick={mockAnalyze}
                            disabled={!resumeText || !jobDescription || isAnalyzing}
                            className="min-w-[200px]"
                        >
                            {isAnalyzing ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Target className="size-4 mr-2" />
                                    Analyze Resume
                                </>
                            )}
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="analyze" className="space-y-6">
                    {analysis && (
                        <>
                            {/* Score Card */}
                            <Card className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-semibold mb-2">ATS Match Score</h2>
                                        <p className="text-gray-600">
                                            How well your resume matches the job description
                                        </p>
                                    </div>
                                    <div
                                        className={`text-6xl font-bold ${getScoreColor(analysis.score)} ${getScoreBgColor(analysis.score)} size-32 rounded-full flex items-center justify-center`}
                                    >
                                        {analysis.score}%
                                    </div>
                                </div>
                                <Progress value={analysis.score} className="mt-4" />
                            </Card>

                            {/* Keywords Analysis */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card className="p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <CheckCircle className="size-5 text-green-600" />
                                        <h3 className="text-lg font-semibold">Matched Keywords</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.matchedKeywords.map((keyword) => (
                                            <Badge
                                                key={keyword}
                                                variant="default"
                                                className="bg-green-100 text-green-700 border-green-300"
                                            >
                                                <CheckCircle className="size-3 mr-1" />
                                                {keyword}
                                            </Badge>
                                        ))}
                                    </div>
                                </Card>

                                <Card className="p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <XCircle className="size-5 text-red-600" />
                                        <h3 className="text-lg font-semibold">Missing Keywords</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.missingKeywords.map((keyword) => (
                                            <Badge
                                                key={keyword}
                                                variant="default"
                                                className="bg-red-100 text-red-700 border-red-300"
                                            >
                                                <XCircle className="size-3 mr-1" />
                                                {keyword}
                                            </Badge>
                                        ))}
                                    </div>
                                </Card>
                            </div>

                            {/* Strengths */}
                            <Card className="p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <TrendingUp className="size-5 text-blue-600" />
                                    <h3 className="text-lg font-semibold">Strengths</h3>
                                </div>
                                <ul className="space-y-2">
                                    {analysis.strengths.map((strength, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <CheckCircle className="size-5 text-green-600 mt-0.5 flex-shrink-0" />
                                            <span className="text-gray-700">{strength}</span>
                                        </li>
                                    ))}
                                </ul>
                            </Card>

                            {/* Improvements */}
                            <Card className="p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Lightbulb className="size-5 text-yellow-600" />
                                    <h3 className="text-lg font-semibold">Suggested Improvements</h3>
                                </div>
                                <ul className="space-y-3">
                                    {analysis.improvements.map((improvement, index) => (
                                        <li key={index} className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                            <Lightbulb className="size-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                            <span className="text-gray-700">{improvement}</span>
                                        </li>
                                    ))}
                                </ul>
                            </Card>

                            {/* Formatting Issues */}
                            {analysis.formatting.length > 0 && (
                                <Card className="p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <AlertCircle className="size-5 text-orange-600" />
                                        <h3 className="text-lg font-semibold">Formatting Issues</h3>
                                    </div>
                                    <ul className="space-y-2">
                                        {analysis.formatting.map((format, index) => (
                                            <li key={index} className="flex items-start gap-2">
                                                <AlertCircle
                                                    className={`size-5 mt-0.5 flex-shrink-0 ${
                                                        format.severity === 'high'
                                                            ? 'text-red-600'
                                                            : format.severity === 'medium'
                                                                ? 'text-orange-600'
                                                                : 'text-yellow-600'
                                                    }`}
                                                />
                                                <div>
                                                    <span className="text-gray-700">{format.issue}</span>
                                                    <Badge
                                                        variant="outline"
                                                        className={`ml-2 text-xs ${
                                                            format.severity === 'high'
                                                                ? 'border-red-300 text-red-700'
                                                                : format.severity === 'medium'
                                                                    ? 'border-orange-300 text-orange-700'
                                                                    : 'border-yellow-300 text-yellow-700'
                                                        }`}
                                                    >
                                                        {format.severity}
                                                    </Badge>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </Card>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                <Button variant="outline" onClick={() => setActiveTab('upload')}>
                                    Revise Resume
                                </Button>
                                <Button>Download Optimized Resume</Button>
                            </div>
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}