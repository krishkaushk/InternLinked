import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Separator } from '@/app/components/ui/separator';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    GraduationCap,
    FileText,
    Plus,
    Edit,
    Upload,
    CheckCircle,
    X,
} from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

// Removed: interface ProfileViewProps

export function ProfileView({ profile, onUpdateProfile }) {
    const [isEditingBasic, setIsEditingBasic] = useState(false);
    const [editedProfile, setEditedProfile] = useState(profile);
    const [newSkill, setNewSkill] = useState('');

    const handleSaveBasicInfo = () => {
        onUpdateProfile(editedProfile);
        setIsEditingBasic(false);
    };

    const handleAddSkill = () => {
        if (newSkill.trim()) {
            setEditedProfile({
                ...editedProfile,
                skills: [...editedProfile.skills, newSkill.trim()],
            });
            setNewSkill('');
        }
    };

    const handleRemoveSkill = (skill) => {
        setEditedProfile({
            ...editedProfile,
            skills: editedProfile.skills.filter((s) => s !== skill),
        });
    };

    // Helper for safe date formatting in JSX environment
    const safeFormat = (date, formatStr) => {
        if (!date) return '';
        try {
            return format(new Date(date), formatStr);
        } catch (e) {
            return '';
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
                <p className="text-gray-600 mt-1">Manage your personal information and career details</p>
            </div>

            {/* Basic Information */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <User className="size-5" />
                        Basic Information
                    </h2>
                    {!isEditingBasic ? (
                        <Button variant="outline" size="sm" onClick={() => setIsEditingBasic(true)}>
                            <Edit className="size-4 mr-2" />
                            Edit
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setEditedProfile(profile);
                                    setIsEditingBasic(false);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button size="sm" onClick={handleSaveBasicInfo}>
                                Save Changes
                            </Button>
                        </div>
                    )}
                </div>

                {isEditingBasic ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={editedProfile.name}
                                onChange={(e) =>
                                    setEditedProfile({ ...editedProfile, name: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={editedProfile.email}
                                onChange={(e) =>
                                    setEditedProfile({ ...editedProfile, email: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={editedProfile.phone || ''}
                                onChange={(e) =>
                                    setEditedProfile({ ...editedProfile, phone: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                value={editedProfile.location || ''}
                                onChange={(e) =>
                                    setEditedProfile({ ...editedProfile, location: e.target.value })
                                }
                            />
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-gray-700">
                            <User className="size-4 text-gray-400" />
                            <span>{profile.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                            <Mail className="size-4 text-gray-400" />
                            <span>{profile.email}</span>
                        </div>
                        {profile.phone && (
                            <div className="flex items-center gap-2 text-gray-700">
                                <Phone className="size-4 text-gray-400" />
                                <span>{profile.phone}</span>
                            </div>
                        )}
                        {profile.location && (
                            <div className="flex items-center gap-2 text-gray-700">
                                <MapPin className="size-4 text-gray-400" />
                                <span>{profile.location}</span>
                            </div>
                        )}
                    </div>
                )}
            </Card>

            {/* Skills */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                    <Briefcase className="size-5" />
                    Skills
                </h2>

                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {editedProfile.skills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-sm py-1 px-3">
                                {skill}
                                {isEditingBasic && (
                                    <button
                                        onClick={() => handleRemoveSkill(skill)}
                                        className="ml-2 hover:text-red-600"
                                    >
                                        <X className="size-3" />
                                    </button>
                                )}
                            </Badge>
                        ))}
                    </div>

                    {isEditingBasic && (
                        <div className="flex gap-2">
                            <Input
                                placeholder="Add a skill (e.g., Python, React, etc.)"
                                value={newSkill}
                                onChange={(e) => setNewSkill(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                            />
                            <Button onClick={handleAddSkill}>
                                <Plus className="size-4 mr-2" />
                                Add
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            {/* Education */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <GraduationCap className="size-5" />
                        Education
                    </h2>
                    <Button variant="outline" size="sm">
                        <Plus className="size-4 mr-2" />
                        Add Education
                    </Button>
                </div>

                <div className="space-y-4">
                    {profile.education.map((edu) => (
                        <div key={edu.id} className="border-l-4 border-purple-500 pl-4 py-2">
                            <h3 className="font-semibold text-gray-900">{edu.institution}</h3>
                            <p className="text-gray-700">
                                {edu.degree} in {edu.field}
                            </p>
                            <p className="text-sm text-gray-500">
                                {safeFormat(edu.startDate, 'MMM yyyy')} -{' '}
                                {edu.endDate ? safeFormat(edu.endDate, 'MMM yyyy') : 'Present'}
                            </p>
                            {edu.gpa && <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>}
                        </div>
                    ))}
                </div>
            </Card>

            {/* Experience */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Briefcase className="size-5" />
                        Experience
                    </h2>
                    <Button variant="outline" size="sm">
                        <Plus className="size-4 mr-2" />
                        Add Experience
                    </Button>
                </div>

                <div className="space-y-4">
                    {profile.experience.map((exp) => (
                        <div key={exp.id} className="border-l-4 border-blue-500 pl-4 py-2">
                            <h3 className="font-semibold text-gray-900">{exp.position}</h3>
                            <p className="text-gray-700">{exp.company}</p>
                            <p className="text-sm text-gray-500 mb-2">
                                {safeFormat(exp.startDate, 'MMM yyyy')} -{' '}
                                {exp.endDate ? safeFormat(exp.endDate, 'MMM yyyy') : 'Present'}
                            </p>
                            <p className="text-sm text-gray-600">{exp.description}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {exp.skills.map((skill) => (
                                    <Badge key={skill} variant="outline" className="text-xs">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Resumes */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <FileText className="size-5" />
                        Resumes
                    </h2>
                    <Button variant="outline" size="sm">
                        <Upload className="size-4 mr-2" />
                        Upload Resume
                    </Button>
                </div>

                <div className="space-y-3">
                    {profile.resumes.map((resume) => (
                        <div
                            key={resume.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded">
                                    <FileText className="size-5 text-blue-600" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-gray-900">{resume.name}</p>
                                        {resume.isPrimary && (
                                            <Badge variant="default" className="text-xs">
                                                <CheckCircle className="size-3 mr-1" />
                                                Primary
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        Uploaded {safeFormat(resume.uploadDate, 'MMM d, yyyy')}
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {resume.skills.slice(0, 4).map((skill, index) => (
                                            <span key={skill} className="text-xs text-gray-500">
                        {skill}
                                                {index < Math.min(resume.skills.length, 4) - 1 && ','}
                      </span>
                                        ))}
                                        {resume.skills.length > 4 && (
                                            <span className="text-xs text-gray-500">
                        &nbsp;+{resume.skills.length - 4} more
                      </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm">
                                    View
                                </Button>
                                <Button variant="ghost" size="sm">
                                    <Edit className="size-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}