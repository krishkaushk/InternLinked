// Generic, platform-agnostic recovery of job descriptions for curated-list entries whose ATS
// isn't one we integrate with directly. Many job-posting pages — regardless of platform —
// embed a schema.org `JobPosting` block in a <script type="application/ld+json"> tag for
// Google-for-Jobs SEO. Confirmed empirically against real curated-list URLs (2026-08-19):
// present and populated on Workday and Eightfold-hosted postings; absent on the Oracle Cloud
// HCM, iCIMS, Rippling, and Workable pages sampled, and on custom sites that render content
// client-side (this only sees server-rendered HTML). Those stay unscoreable — an accepted gap,
// same as before this existed.
import { stripHtml, truncate } from './normalize.ts';

const LD_JSON_SCRIPT_RE = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

function findJobPosting(node: unknown): Record<string, unknown> | null {
  if (!node || typeof node !== 'object') return null;
  const obj = node as Record<string, unknown>;

  if (obj['@type'] === 'JobPosting') return obj;

  const graph = obj['@graph'];
  if (Array.isArray(graph)) {
    for (const entry of graph) {
      const found = findJobPosting(entry);
      if (found) return found;
    }
  }

  return null;
}

// Never throws — a malformed/missing block is just treated as "nothing to recover here".
export function extractJobPostingDescription(html: string): string {
  if (!html) return '';

  let match: RegExpExecArray | null;
  LD_JSON_SCRIPT_RE.lastIndex = 0;
  while ((match = LD_JSON_SCRIPT_RE.exec(html)) !== null) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(match[1]);
    } catch {
      continue; // one malformed block must not block checking the rest
    }

    const candidates = Array.isArray(parsed) ? parsed : [parsed];
    for (const candidate of candidates) {
      const jobPosting = findJobPosting(candidate);
      if (jobPosting && typeof jobPosting.description === 'string' && jobPosting.description.trim()) {
        return truncate(stripHtml(jobPosting.description), 2000);
      }
    }
  }

  return '';
}
