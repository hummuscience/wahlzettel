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
  {
    slug: 'darmstadt-stvv',
    shareTypeCode: 4,
    load: () => import('./darmstadt-stvv/config').then(m => m.default),
  },
  {
    slug: 'kassel-stvv',
    shareTypeCode: 5,
    load: () => import('./kassel-stvv/config').then(m => m.default),
  },
  {
    slug: 'hanau-stvv',
    shareTypeCode: 6,
    load: () => import('./hanau-stvv/config').then(m => m.default),
  },
  {
    slug: 'offenbach-stvv',
    shareTypeCode: 7,
    load: () => import('./offenbach-stvv/config').then(m => m.default),
  },
  {
    slug: 'giessen-stvv',
    shareTypeCode: 8,
    load: () => import('./giessen-stvv/config').then(m => m.default),
  },
  {
    slug: 'marburg-stvv',
    shareTypeCode: 9,
    load: () => import('./marburg-stvv/config').then(m => m.default),
  },
  {
    slug: 'fulda-stvv',
    shareTypeCode: 10,
    load: () => import('./fulda-stvv/config').then(m => m.default),
  },
  {
    slug: 'ruesselsheim-stvv',
    shareTypeCode: 11,
    load: () => import('./ruesselsheim-stvv/config').then(m => m.default),
  },
  {
    slug: 'muenchen-stadtrat',
    shareTypeCode: 12,
    load: () => import('./muenchen-stadtrat/config').then(m => m.default),
  },
  {
    slug: 'nuernberg-stadtrat',
    shareTypeCode: 13,
    load: () => import('./nuernberg-stadtrat/config').then(m => m.default),
  },
  {
    slug: 'augsburg-stadtrat',
    shareTypeCode: 14,
    load: () => import('./augsburg-stadtrat/config').then(m => m.default),
  },
  {
    slug: 'regensburg-stadtrat',
    shareTypeCode: 15,
    load: () => import('./regensburg-stadtrat/config').then(m => m.default),
  },
  {
    slug: 'ingolstadt-stadtrat',
    shareTypeCode: 16,
    load: () => import('./ingolstadt-stadtrat/config').then(m => m.default),
  },
  {
    slug: 'wuerzburg-stadtrat',
    shareTypeCode: 17,
    load: () => import('./wuerzburg-stadtrat/config').then(m => m.default),
  },
  {
    slug: 'fuerth-stadtrat',
    shareTypeCode: 18,
    load: () => import('./fuerth-stadtrat/config').then(m => m.default),
  },
  {
    slug: 'erlangen-stadtrat',
    shareTypeCode: 19,
    load: () => import('./erlangen-stadtrat/config').then(m => m.default),
  },
  {
    slug: 'bamberg-stadtrat',
    shareTypeCode: 20,
    load: () => import('./bamberg-stadtrat/config').then(m => m.default),
  },
  {
    slug: 'bayreuth-stadtrat',
    shareTypeCode: 21,
    load: () => import('./bayreuth-stadtrat/config').then(m => m.default),
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
