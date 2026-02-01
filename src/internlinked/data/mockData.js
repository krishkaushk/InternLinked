// Removed: import { Application, UserProfile, ... } from '@/types';

export const mockApplications = [
    {
        id: '1',
        companyName: 'Google',
        position: 'Software Engineering Intern',
        status: 'interview',
        dateAdded: new Date('2026-01-15'),
        deadline: new Date('2026-02-28'),
        interviewDate: new Date('2026-02-10'),
        location: 'Mountain View, CA',
        jobType: 'internship',
        salary: '$8,000/month',
        notes: 'Technical interview scheduled. Focus on algorithms and system design.',
        resumeVersion: 'Software_Engineer_Resume_v3.pdf',
        jobUrl: 'https://careers.google.com',
        matchScore: 92,
    },
    {
        id: '2',
        companyName: 'Meta',
        position: 'Product Design Intern',
        status: 'applied',
        dateAdded: new Date('2026-01-20'),
        deadline: new Date('2026-03-15'),
        location: 'Menlo Park, CA',
        jobType: 'internship',
        salary: '$7,500/month',
        notes: 'Portfolio submitted. Waiting for response.',
        resumeVersion: 'Design_Resume_v2.pdf',
        jobUrl: 'https://www.metacareers.com',
        matchScore: 85,
    },
    {
        id: '3',
        companyName: 'Microsoft',
        position: 'Data Science Intern',
        status: 'saved',
        dateAdded: new Date('2026-01-25'),
        deadline: new Date('2026-03-01'),
        location: 'Redmond, WA',
        jobType: 'internship',
        salary: '$7,800/month',
        notes: 'Need to tailor resume for ML/AI experience.',
        matchScore: 78,
    },
    {
        id: '4',
        companyName: 'Stripe',
        position: 'Backend Engineering Intern',
        status: 'applied',
        dateAdded: new Date('2026-01-18'),
        location: 'San Francisco, CA',
        jobType: 'internship',
        salary: '$8,500/month',
        notes: 'Applied through employee referral.',
        resumeVersion: 'Software_Engineer_Resume_v3.pdf',
        jobUrl: 'https://stripe.com/jobs',
        matchScore: 88,
    },
    {
        id: '5',
        companyName: 'Figma',
        position: 'Frontend Engineering Intern',
        status: 'interview',
        dateAdded: new Date('2026-01-10'),
        interviewDate: new Date('2026-02-05'),
        location: 'San Francisco, CA',
        jobType: 'internship',
        salary: '$8,200/month',
        notes: 'Second round interview. Prepare take-home assignment discussion.',
        resumeVersion: 'Software_Engineer_Resume_v3.pdf',
        matchScore: 95,
    }
];

export const mockProfile = {
    id: 'user-1',
    name: 'Alex Chen',
    email: 'alex.chen@university.edu',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    skills: [
        'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'SQL',
        'Git', 'AWS', 'System Design', 'Algorithms', 'Data Structures'
    ],
    education: [
        {
            id: 'edu-1',
            institution: 'Stanford University',
            degree: 'Bachelor of Science',
            field: 'Computer Science',
            startDate: new Date('2023-09-01'),
            endDate: new Date('2027-06-01'),
            gpa: '3.85',
        },
    ],
    experience: [
        {
            id: 'exp-1',
            company: 'Tech Startup Inc.',
            position: 'Software Engineering Intern',
            startDate: new Date('2025-06-01'),
            endDate: new Date('2025-08-31'),
            description: 'Built full-stack web applications using React and Node.js. Improved API performance by 40%.',
            skills: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
        }
    ],
    resumes: [
        {
            id: 'resume-1',
            name: 'Software_Engineer_Resume_v3.pdf',
            uploadDate: new Date('2026-01-15'),
            skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'Git'],
            isPrimary: true,
        }
    ],
};

export const mockActivities = [
    { id: 'act-1', type: 'application', date: new Date('2026-01-31'), description: 'Applied to Microsoft Data Science Intern', xpEarned: 50 },
    { id: 'act-2', type: 'interview', date: new Date('2026-01-30'), description: 'Completed interview with Figma', xpEarned: 100 },
    { id: 'act-3', type: 'resume_update', date: new Date('2026-01-29'), description: 'Updated resume with new projects', xpEarned: 25 }
];

export const mockBadges = [
    { id: 'badge-1', name: 'First Application', description: 'Submit your first job application', icon: '🎯', earnedDate: new Date('2026-01-05') },
    { id: 'badge-2', name: 'Interview Pro', description: 'Complete 5 interviews', icon: '💼', earnedDate: new Date('2026-01-20') },
    { id: 'badge-3', name: 'Weekly Warrior', description: 'Maintain a 4-week streak', icon: '🔥', earnedDate: new Date('2026-01-25') }
];

export const mockUserStats = {
    level: 8,
    xp: 1450,
    xpToNextLevel: 1800,
    currentStreak: 12,
    longestStreak: 18,
    totalApplications: 23,
    interviewsScheduled: 5,
    offersReceived: 1,
    badges: mockBadges.filter((b) => b.earnedDate),
};

// Generate activity calendar data (Plain JS Object version)
export function generateActivityCalendar() {
    const calendar = {};
    const today = new Date('2026-01-31');

    for (let i = 0; i < 365; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const recencyWeight = i < 90 ? 1 : 0.3;
        const activity = Math.random() < 0.4 * recencyWeight ? Math.floor(Math.random() * 5) : 0;
        calendar[dateStr] = activity;
    }

    return calendar;
}

export const mockJobs = [
    {
        id: 'job-match-1',
        companyName: 'Google',
        title: 'Software Engineering Intern - Frontend',
        location: 'Mountain View, CA',
        type: 'internship',
        postedDate: new Date('2026-01-31'),
        salary: '$8,500/month',
        description: "Join Google's engineering team to work on products that impact billions of users worldwide...",
        requirements: ['React', 'TypeScript', 'Algorithms'],
        matchPercentage: 95,
        matchedSkills: ['JavaScript', 'TypeScript', 'React'],
        missingSkills: [],
        jobUrl: 'https://careers.google.com',
        saved: false,
    }
];