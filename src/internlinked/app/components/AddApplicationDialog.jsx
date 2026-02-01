import { useState } from 'react';
// Removed: import { Application, ApplicationStatus } from '@/types';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/app/components/ui/select';

export function AddApplicationDialog({
                                         open,
                                         onClose,
                                         onAdd,
                                         initialStatus = 'saved'
                                     }) {
    const [formData, setFormData] = useState({
        companyName: '',
        position: '',
        status: initialStatus,
        location: '',
        jobType: 'internship',
        salary: '',
        deadline: '',
        interviewDate: '',
        jobUrl: '',
        notes: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        const newApplication = {
            companyName: formData.companyName,
            position: formData.position,
            status: formData.status,
            dateAdded: new Date(),
            location: formData.location,
            jobType: formData.jobType,
            salary: formData.salary || undefined,
            deadline: formData.deadline ? new Date(formData.deadline) : undefined,
            interviewDate: formData.interviewDate ? new Date(formData.interviewDate) : undefined,
            jobUrl: formData.jobUrl || undefined,
            notes: formData.notes || undefined,
        };

        onAdd(newApplication);
        onClose();

        // Reset form
        setFormData({
            companyName: '',
            position: '',
            status: initialStatus,
            location: '',
            jobType: 'internship',
            salary: '',
            deadline: '',
            interviewDate: '',
            jobUrl: '',
            notes: '',
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Application</DialogTitle>
                    <DialogDescription>
                        Track a new job application in your pipeline
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="company">Company Name *</Label>
                            <Input
                                id="company"
                                required
                                value={formData.companyName}
                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                placeholder="e.g., Google"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="position">Position *</Label>
                            <Input
                                id="position"
                                required
                                value={formData.position}
                                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                placeholder="e.g., Software Engineering Intern"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">Status *</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="saved">Saved</SelectItem>
                                    <SelectItem value="applied">Applied</SelectItem>
                                    <SelectItem value="interview">Interview</SelectItem>
                                    <SelectItem value="offer">Offer</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="jobType">Job Type *</Label>
                            <Select
                                value={formData.jobType}
                                onValueChange={(value) => setFormData({ ...formData, jobType: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="internship">Internship</SelectItem>
                                    <SelectItem value="full-time">Full-Time</SelectItem>
                                    <SelectItem value="part-time">Part-Time</SelectItem>
                                    <SelectItem value="contract">Contract</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="location">Location *</Label>
                            <Input
                                id="location"
                                required
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="e.g., San Francisco, CA"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="salary">Salary</Label>
                            <Input
                                id="salary"
                                value={formData.salary}
                                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                placeholder="e.g., $8,000/month"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="deadline">Application Deadline</Label>
                            <Input
                                id="deadline"
                                type="date"
                                value={formData.deadline}
                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="interviewDate">Interview Date</Label>
                            <Input
                                id="interviewDate"
                                type="date"
                                value={formData.interviewDate}
                                onChange={(e) => setFormData({ ...formData, interviewDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="jobUrl">Job Posting URL</Label>
                        <Input
                            id="jobUrl"
                            type="url"
                            value={formData.jobUrl}
                            onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                            placeholder="https://..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Add any relevant notes, interview prep, or reminders..."
                            rows={4}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">Add Application</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}