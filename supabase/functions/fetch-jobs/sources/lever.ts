import { NormalizedJob, SourceResult, SourceStat } from '../types.ts';
import { fetchJsonWithStatus } from '../lib/http.ts';
import { extractListItems, isInternRole, toIsoDate, truncate } from '../lib/normalize.ts';

interface LeverListItem {
  id: string;
  text: string;
  company?: string;
  categories?: {
    commitment?: string;
    location?: string;
    allLocations?: string[];
  };
  createdAt?: number;
  descriptionPlain?: string;
  hostedUrl?: string;
  absoluteUrl?: string;
  lists?: Array<{ text?: string; content?: string }>;
}

export async function fetchLeverCompany(company: string): Promise<SourceResult> {
  const url = `https://api.lever.co/v0/postings/${company}?mode=json`;
  const { data, status } = await fetchJsonWithStatus(url);

  if (data === null) {
    const stat: SourceStat = status === 404 ? 'http_404' : status === null ? 'timeout' : 'error';
    return { jobs: [], stat };
  }

  if (!Array.isArray(data)) {
    return { jobs: [], stat: 'error' };
  }

  const intern = (data as LeverListItem[]).filter(
    (j) => j.categories?.commitment === 'Internship' || isInternRole(j.text)
  );

  if (intern.length === 0) {
    return { jobs: [], stat: 'zero_intern' };
  }

  const jobs: NormalizedJob[] = intern.map((j) => {
    const requirementsList = (j.lists ?? []).find((l) => {
      const t = (l.text ?? '').toLowerCase();
      return t.includes('require') || t.includes('qualif');
    });
    const requirements = requirementsList?.content ? extractListItems(requirementsList.content) : [];

    return {
      id: `lv-${j.id}`,
      companyName: j.company || company,
      title: j.text,
      location: j.categories?.location || j.categories?.allLocations?.[0] || 'Remote',
      type: 'internship',
      postedDate: toIsoDate(j.createdAt ?? null),
      description: truncate(j.descriptionPlain ?? '', 2000),
      requirements,
      jobUrl: j.hostedUrl ?? j.absoluteUrl ?? '',
      source: 'lever',
      saved: false,
      salary: null,
      _sources: ['lever'],
    };
  });

  return { jobs, stat: 'ok' };
}
