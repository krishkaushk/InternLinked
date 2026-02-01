export type ApplicationStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';

export interface Application {
  id: string;
  companyName: string;
  position: string;
  status: ApplicationStatus;
  dateAdded: Date;
  deadline?: Date;
  interviewDate?: Date;
  location: string;
  jobType: 'internship' | 'full-time' | 'part-time' | 'contract';
  salary?: string;
  notes?: string;
  resumeVersion?: string;
  jobUrl?: string;
  matchScore?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  skills: string[];
  education: Education[];
  experience: Experience[];
  resumes: Resume[];
}

export interface Resume {
  id: string;
  name: string;
  uploadDate: Date;
  fileUrl?: string;
  skills: string[];
  isPrimary: boolean;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: Date;
  endDate?: Date;
  gpa?: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: Date;
  endDate?: Date;
  description: string;
  skills: string[];
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  website?: string;
  following: boolean;
  jobs: Job[];
}

export interface Job {
  id: string;
  title: string;
  companyId: string;
  description: string;
  requirements: string[];
  location: string;
  type: 'internship' | 'full-time' | 'part-time' | 'contract';
  postedDate: Date;
  matchScore?: number;
}

export interface Activity {
  id: string;
  type: 'application' | 'resume_update' | 'profile_update' | 'interview' | 'company_follow';
  date: Date;
  description: string;
  xpEarned: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedDate?: Date;
}

export interface UserStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  totalApplications: number;
  interviewsScheduled: number;
  offersReceived: number;
  badges: Badge[];
}
