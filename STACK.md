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
| Supabase (PostgreSQL) | Database — applications, profiles, activities, files (RLS enforced on all four) |
| Supabase Auth | User authentication (email/password) |
| Supabase Storage | File storage — resumes (`resumes` bucket), application CVs (`cvs` bucket). **Both private**; client reads via short-lived `createSignedUrl`, not `getPublicUrl`. |
| Supabase Edge Functions (Deno) | Server-side proxy for Groq scoring (`score-jobs`) and multi-source job fetching (`fetch-jobs`) — see below |

## Database Tables
| Table | Purpose |
|---|---|
| `profiles` | User profile, gamification stats (XP, level, streak), skills, `resume_text`/`resume_text_sha256` (extracted client-side, used for server-side scoring) |
| `applications` | Job application pipeline entries |
| `activities` | Activity log for gamification feed |
| `files` | Files attached to individual applications |
| `job_scores` | Per-user Groq scoring cache, keyed by `(user_id, job_id)` and scoped to `resume_sha256` — avoids re-paying Groq token cost for unchanged jobs/resume |
| `job_listings_cache` | Single-row shared cache of the fetch-jobs pipeline output, 30-min TTL, refreshed via stale-while-revalidate (no cron warmer — refresh only happens as a side effect of a stale request) |
| `api_rate_limits` | Fixed-window request/token counters (per-user and global) backing both Edge Functions, via the `consume_rate_limit` RPC |

`education`/`experience` tables referenced in an earlier version of this doc were unreferenced by any client code — confirm via `supabase db pull` whether they exist; if so they should carry deny-all RLS (see `supabase/migrations/20260817120000_enable_rls_core_tables.sql`).

## Edge Functions
| Function | Purpose |
|---|---|
| `score-jobs` | Proxies Groq (`openai/gpt-oss-20b`) scoring server-side. Batches of 10, resume/description truncated to 2500/500 chars, per-user + global rate limits, exponential-backoff retry on 429/5xx/network errors, a global token-budget gate that degrades to local keyword scoring instead of failing, and a `job_scores` cache. |
| `fetch-jobs` | Fans out to Greenhouse, Lever, Ashby, SmartRecruiters, and two curated GitHub internship-list repos (`SimplifyJobs/Summer2027-Internships`, `vanshb03/Summer2027-Internships`), dedupes across sources, caches the merged result in `job_listings_cache` (30-min TTL, stale-while-revalidate — see `fetch-jobs/index.ts`). |

Both functions share `supabase/functions/_shared/` (auth, CORS, error codes, retry/backoff, rate limiting) and require `GROQ_API_KEY` as a Supabase secret (`supabase secrets set` — never `VITE_`-prefixed).

## AI / External APIs
| Service | Purpose | Cost |
|---|---|---|
| Groq (`openai/gpt-oss-20b`) | Job match scoring — evaluates resume/skills against job descriptions, called only from `score-jobs` | Free tier (rate-limit numbers in `_shared/rateLimit.ts` calibrated to typical free-tier TPM/TPD — verify against your actual Groq console) |
| Greenhouse Boards API | Job listings (Greenhouse-hosted companies) | Free, no key |
| Lever Postings API | Job listings (Lever-hosted companies) | Free, no key |
| Ashby Posting API | Job listings (Ashby-hosted companies) | Free, no key |
| SmartRecruiters Postings API | Job listings (SmartRecruiters-hosted companies) | Free, no key |
| GitHub raw content (curated internship lists) | Community-maintained internship listings, pulled as JSON via `raw.githubusercontent.com` | Free, no auth |
| Photon (OpenStreetMap) | Location autocomplete in application form | Free, no key |
| Nanonets | Resume PDF parsing during onboarding | **Deferred/inactive** — currently unset/broken; `OnboardingFlow.jsx` still calls it directly with a `VITE_`-prefixed key. This is a known landmine (see repo history around 2026-08-17) — do not re-enable without moving it server-side first. |

## Gamification
- XP awarded per application added, interview scheduled, etc.
- Level calculated from total XP (100 XP per level)
- Daily streak tracked via `last_activity` date in profiles
- Activity feed shows last 5 actions

## Key Design Decisions
- **Single Supabase client** — shared via `src/internlinked/utils/supabase.js` to avoid multiple GoTrue instances
- **State persistence** — `userStats` cached in `localStorage`, scored jobs in `sessionStorage` to avoid re-fetching on tab switch
- **Keep-alive views** — all route views stay mounted (CSS display toggle) so state is never lost on navigation
- **Three-tier job fetch** — `job_listings_cache` (shared, 30-min TTL, stale-while-revalidate, no cron warmer) → per-source list fetch (fast) → description hydration only for surviving/intern-filtered results (Greenhouse, SmartRecruiters); Ashby/Lever/curated-GitHub already carry descriptions in their list responses
- **Client-side keyword prefilter before Groq** — `matchScore.js`'s free keyword-overlap scorer narrows the fetch-jobs candidate pool (up to ~150) down to the top ~25 before any job reaches the rate-limited/paid `score-jobs` Groq call
- **Private Storage, signed URLs** — `resumes`/`cvs` buckets are private; DB columns that used to hold a public URL now hold a bare storage path, resolved via `getSignedUrl()` (`src/internlinked/utils/storagePaths.js`) at render/download time
- **Brutalist UI** — hard borders, yellow (#EBBB49) accent, no border radius, offset shadows
