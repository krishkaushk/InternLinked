// Canonical company/board lists for every source adapter. Server-side only now — the client no
// longer needs (or should have) this list; it was previously in
// src/internlinked/utils/companySources.js.
export const GREENHOUSE_COMPANIES: string[] = [
  // Actively posting intern/co-op roles
  'airbnb', 'databricks', 'stripe', 'mongodb', 'verkada',
  'rubrik', 'robinhood', 'twilio', 'asana', 'instacart',
  'klaviyo', 'pinterest', 'okta', 'checkr',

  // Working boards, may post intern roles
  'brex', 'airtable', 'intercom', 'discord', 'duolingo',
  'figma', 'lyft', 'gusto', 'pagerduty', 'lattice',

  // Added — verified live during planning
  'drweng', 'astranis', 'neuralink', 'imc', 'cloudflare',
  'spacex', 'figureai', 'appian', 'ginkgobioworks', 'togetherai',
  'scaleai', 'janestreet', 'virtu',
];

// Lever's public postings API is NOT dead — live testing during planning found e.g. 'palantir'
// yields 41 intern postings. companySources.js's LEVER_COMPANIES=[] was wrong; this resurrects it.
export const LEVER_COMPANIES: string[] = [
  'palantir', 'zoox', 'xsolla', 'hermeus', 'magnetforensics',
  'acceldata', 'tri', 'belvederetrading', 'voltus',
];

export const ASHBY_COMPANIES: string[] = [
  'etched', 'skydio', 'openai', 'applied', 'ramp',
  'cohere', 'perplexity', 'notion', '1x', 'super.com', 'exa',
];

// Deliberately small — chosen by pages-per-intern-found during planning, not raw posting volume.
export const SMARTRECRUITERS_COMPANIES: string[] = [
  'NorthwesternMutual', 'LLNL', 'Canva', 'WesternDigital', 'AveryDennison', 'ServiceNow',
];

export interface GithubCuratedRepoConfig {
  key: string;
  owner: string;
  repo: string;
  branch: string;
  path: string;
}

export const GITHUB_CURATED_REPOS: GithubCuratedRepoConfig[] = [
  { key: 'simplify', owner: 'SimplifyJobs', repo: 'Summer2027-Internships', branch: 'dev', path: '.github/scripts/listings.json' },
  { key: 'vansh', owner: 'vanshb03', repo: 'Summer2027-Internships', branch: 'dev', path: '.github/scripts/listings.json' },
];
