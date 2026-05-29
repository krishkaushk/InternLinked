# InternLinked — Tech Stack

## Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 7 | Build tool + dev server |
| TailwindCSS | 4 | Styling |
| React Router DOM | 7 | Client-side routing |
| Radix UI | Various | Headless UI primitives (Dialog, Select, Tabs, etc.) |
| Lucide React | Latest | Icons |
| date-fns | 4 | Date formatting |
| Sonner | 2 | Toast notifications |

## Backend / Database
| Technology | Purpose |
|---|---|
| Supabase (PostgreSQL) | Database — applications, profiles, activities, files, education, experience |
| Supabase Auth | User authentication (email/password) |
| Supabase Storage | File storage — resumes (`resumes` bucket), application CVs (`cvs` bucket) |

## Database Tables
| Table | Purpose |
|---|---|
| `profiles` | User profile, gamification stats (XP, level, streak), skills, education fields |
| `applications` | Job application pipeline entries |
| `activities` | Activity log for gamification feed |
| `files` | Files attached to individual applications |
| `education` | Education history |
| `experience` | Work experience history |

## AI / External APIs
| Service | Purpose | Cost |
|---|---|---|
| Google Gemini 1.5 Flash | Job match scoring — evaluates resume/skills against job descriptions | Free (1,500 req/day) |
| Nanonets | Resume PDF parsing during onboarding — extracts name, skills, education | Paid API |
| Greenhouse Boards API | Job listings from tech companies (Airbnb, Stripe, Databricks, etc.) | Free, no key |
| Photon (OpenStreetMap) | Location autocomplete in application form | Free, no key |

## Gamification
- XP awarded per application added, interview scheduled, etc.
- Level calculated from total XP (100 XP per level)
- Daily streak tracked via `last_activity` date in profiles
- Activity feed shows last 5 actions

## Key Design Decisions
- **Single Supabase client** — shared via `src/internlinked/utils/supabase.js` to avoid multiple GoTrue instances
- **State persistence** — `userStats` cached in `localStorage`, scored jobs in `sessionStorage` to avoid re-fetching on tab switch
- **Keep-alive views** — all route views stay mounted (CSS display toggle) so state is never lost on navigation
- **Two-step job fetch** — metadata fetched first (fast), descriptions fetched only for intern-filtered results
- **Brutalist UI** — hard borders, yellow (#EBBB49) accent, no border radius, offset shadows
