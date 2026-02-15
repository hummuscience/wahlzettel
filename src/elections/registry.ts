import type { ElectionConfig } from './types';

interface ElectionEntry {
  slug: string;
  shareTypeCode: number;
  load: () => Promise<ElectionConfig>;
}

const ELECTIONS: ElectionEntry[] = [
  {
    slug: 'frankfurt-stvv',
    shareTypeCode: 0,
    load: () => import('./frankfurt-stvv/config').then(m => m.default),
  },
  {
    slug: 'frankfurt-kav',
    shareTypeCode: 1,
    load: () => import('./frankfurt-kav/config').then(m => m.default),
  },
  {
    slug: 'wiesbaden-stvv',
    shareTypeCode: 2,
    load: () => import('./wiesbaden-stvv/config').then(m => m.default),
  },
  {
    slug: 'wiesbaden-kav',
    shareTypeCode: 3,
    load: () => import('./wiesbaden-kav/config').then(m => m.default),
  },
];

export function getAllElections(): ElectionEntry[] {
  return ELECTIONS;
}

export function getElectionBySlug(slug: string): ElectionEntry | undefined {
  return ELECTIONS.find(e => e.slug === slug);
}

export function getElectionByShareCode(code: number): ElectionEntry | undefined {
  return ELECTIONS.find(e => e.shareTypeCode === code);
}
