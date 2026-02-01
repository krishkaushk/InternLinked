import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Progress } from '@/app/components/ui/progress';
import { Badge } from '@/app/components/ui/badge';
import { Upload, User, Briefcase, FileText, CheckCircle, X, Loader2, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Mock resume parser - simulates extracting data from PDF
const parseResumePDF = (file) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const mockData = {
                skills: [
                    'JavaScript',
                    'TypeScript',
                    'React',
                    'Node.js',
                    'Python',
                    'SQL',
                    'Git',
                    'AWS'
                ],
                education: [
                    {
                        id: crypto.randomUUID(),
                        institution: 'University of California, Berkeley',
                        degree: 'Bachelor of Science',
                        field: 'Computer Science',
                        startDate: new Date('2021-09-01'),
                        endDate: new Date('2025-05-15'),
                        gpa: '3.8',
                    }
                ],
                experience: [
                    {
                        id: crypto.randomUUID(),
                        company: 'Tech Startup Inc.',
                        position: 'Software Engineering Intern',
                        startDate: new Date('2024-06-01'),
                        endDate: new Date('2024-08-31'),
                        description: 'Developed full-stack web applications using React and Node.js. Collaborated with cross-functional teams to deliver features.',
                        skills: ['React', 'Node.js', 'MongoDB', 'REST APIs'],
                    }
                ],
                resumes: [
                    {
                        id: crypto.randomUUID(),
                        name: file.name,
                        uploadDate: new Date(),
                        skills: ['JavaScript', 'React', 'Python', 'SQL'],
                        isPrimary: true,
                    }
                ],
            };
            resolve(mockData);
        }, 1500);
    });
};

export function OnboardingFlow({ onComplete }) {
    const [step, setStep] = useState(1);
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        location: '',
        skills: [],
        education: [],
        experience: [],
        resumes: [],
    });
    const [isParsing, setIsParsing] = useState(false);
    const [hasUploadedResume, setHasUploadedResume] = useState(false);
    const [uploadedApplications, setUploadedApplications] = useState([]);

    const totalSteps = 4;
    const progress = (step / totalSteps) * 100;

    const handleResumeUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        toast.info('Parsing your resume...');

        try {
            const parsedData = await parseResumePDF(file);

            setProfile({
                ...profile,
                skills: parsedData.skills || [],
                education: parsedData.education || [],
                experience: parsedData.experience || [],
                resumes: parsedData.resumes || [],
            });

            setHasUploadedResume(true);
            toast.success('Resume parsed successfully! Review and edit your information below.');
        } catch (error) {
            toast.error('Failed to parse resume. Please try again.');
        } finally {
            setIsParsing(false);
        }
    };

    const handleRemoveSkill = (skillToRemove) => {
        setProfile({
            ...profile,
            skills: profile.skills?.filter(skill => skill !== skillToRemove),
        });
    };

    const handleAddSkill = (newSkill) => {
        if (newSkill.trim() && profile.skills) {
            setProfile({
                ...profile,
                skills: [...profile.skills, newSkill.trim()],
            });
        }
    };

    const handleFileUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const mockApplications = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileName = file.name.replace('.pdf', '');
            const parts = fileName.split('_');

            mockApplications.push({
                companyName: parts[0] || 'Unknown Company',
                position: parts[1] || 'Software Engineer Intern',
                status: 'applied',
                jobType: 'internship',
                notes: `Uploaded from ${file.name}`,
            });
        }

        setUploadedApplications([...uploadedApplications, ...mockApplications]);
        toast.success(`Parsed ${files.length} application(s) from PDF`);
    };

    const handleRemoveApplication = (index) => {
        setUploadedApplications(uploadedApplications.filter((_, i) => i !== index));
    };

    const handleEditApplication = (index, field, value) => {
        const updated = [...uploadedApplications];
        updated[index] = { ...updated[index], [field]: value };
        setUploadedApplications(updated);
    };

    const handleComplete = () => {
        const finalProfile = {
            id: crypto.randomUUID(),
            name: profile.name || 'User',
            email: profile.email || '',
            phone: profile.phone,
            location: profile.location,
            skills: profile.skills || [],
            education: profile.education || [],
            experience: profile.experience || [],
            resumes: profile.resumes || [],
        };

        const applications = uploadedApplications.map((app) => ({
            id: crypto.randomUUID(),
            companyName: app.companyName,
            position: app.position,
            status: app.status,
            dateAdded: new Date(),
            location: profile.location || 'Remote',
            jobType: app.jobType,
            notes: app.notes,
        }));

        onComplete(finalProfile, applications);
        toast.success('Welcome to InternLinked! 🎉');
    };

    const canProceedStep1 = profile.name && profile.email;
    const canProceedStep2 = hasUploadedResume;
    const canComplete = uploadedApplications.length > 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Welcome to <strong>InternLinked</strong>
                    </h1>
                    <p className="text-gray-600">Let's get you set up in just a few steps</p>
                </div>

                <div className="mb-6">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-gray-600 mt-2 text-center">
                        Step {step} of {totalSteps}
                    </p>
                </div>

                <Card className="p-8">
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <User className="size-6 text-purple-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Basic Information</h2>
                                    <p className="text-gray-600">Let's start with the basics</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input
                                        id="name"
                                        placeholder="John Doe"
                                        value={profile.name}
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        value={profile.email}
                                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        placeholder="+1 (555) 123-4567"
                                        value={profile.phone}
                                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location">Location</Label>
                                    <Input
                                        id="location"
                                        placeholder="San Francisco, CA"
                                        value={profile.location}
                                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button onClick={() => setStep(2)} disabled={!canProceedStep1} size="lg">Continue</Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <FileText className="size-6 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Upload Your Resume</h2>
                                    <p className="text-gray-600">We'll auto-fill your profile from your resume</p>
                                </div>
                            </div>

                            {!hasUploadedResume ? (
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleResumeUpload}
                                        className="hidden"
                                        id="resume-upload"
                                        disabled={isParsing}
                                    />
                                    <label htmlFor="resume-upload" className="cursor-pointer">
                                        {isParsing ? (
                                            <>
                                                <Loader2 className="size-12 text-blue-500 mx-auto mb-4 animate-spin" />
                                                <p className="text-lg font-medium text-gray-700">Parsing your resume...</p>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="size-12 text-gray-400 mx-auto mb-4" />
                                                <p className="text-lg font-medium text-gray-700">Click to upload your resume</p>
                                            </>
                                        )}
                                    </label>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <div className="flex items-center gap-2 text-green-700 mb-2">
                                            <CheckCircle className="size-5" />
                                            <p className="font-medium">Resume parsed successfully!</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-base font-semibold">Skills</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.skills?.map((skill, index) => (
                                                <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                                                    {skill}
                                                    <button onClick={() => handleRemoveSkill(skill)} className="ml-2 hover:text-red-600">
                                                        <X className="size-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                        <Input
                                            placeholder="Add a skill"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleAddSkill(e.currentTarget.value);
                                                    e.currentTarget.value = '';
                                                }
                                            }}
                                        />
                                    </div>

                                    {profile.education?.length > 0 && (
                                        <div className="space-y-3">
                                            <Label className="text-base font-semibold flex items-center gap-2">
                                                <GraduationCap className="size-5" /> Education
                                            </Label>
                                            {profile.education.map((edu) => (
                                                <div key={edu.id} className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded">
                                                    <h3 className="font-semibold text-gray-900">{edu.institution}</h3>
                                                    <p className="text-gray-700">{edu.degree} in {edu.field}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {format(new Date(edu.startDate), 'MMM yyyy')} -{' '}
                                                        {edu.endDate ? format(new Date(edu.endDate), 'MMM yyyy') : 'Present'}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-between pt-4">
                                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                                <Button onClick={() => setStep(3)} disabled={!canProceedStep2} size="lg">Continue</Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 text-center">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <Briefcase className="size-6 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold">Track Your Applications</h2>
                            </div>
                            <p className="text-gray-700">Upload PDFs of your job applications for automatic tracking.</p>
                            <div className="flex justify-between pt-4">
                                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                                <Button onClick={() => setStep(4)} size="lg">Continue</Button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
                                <input type="file" accept=".pdf" multiple onChange={handleFileUpload} className="hidden" id="pdf-upload" />
                                <label htmlFor="pdf-upload" className="cursor-pointer">
                                    <Upload className="size-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-lg font-medium text-gray-700">Click to upload PDFs</p>
                                </label>
                            </div>

                            {uploadedApplications.length > 0 && (
                                <div className="max-h-96 overflow-y-auto space-y-3">
                                    {uploadedApplications.map((app, index) => (
                                        <Card key={index} className="p-4 space-y-3">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <Input value={app.companyName} onChange={(e) => handleEditApplication(index, 'companyName', e.target.value)} placeholder="Company" />
                                                <Input value={app.position} onChange={(e) => handleEditApplication(index, 'position', e.target.value)} placeholder="Position" />
                                                <Select value={app.status} onValueChange={(v) => handleEditApplication(index, 'status', v)}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="saved">Saved</SelectItem>
                                                        <SelectItem value="applied">Applied</SelectItem>
                                                        <SelectItem value="interview">Interview</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => handleRemoveApplication(index)}>Remove</Button>
                                        </Card>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-between pt-4">
                                <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
                                <Button onClick={handleComplete} disabled={!canComplete} size="lg">Complete Setup</Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}