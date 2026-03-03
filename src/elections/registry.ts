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
  {
    slug: 'bw-landtagswahl',
    shareTypeCode: 22,
    load: () => import('./bw-landtagswahl/config').then(m => m.default),
  },
  {
    slug: 'darmstadt-kav',
    shareTypeCode: 23,
    load: () => import('./darmstadt-kav/config').then(m => m.default),
  },
  {
    slug: 'fulda-kav',
    shareTypeCode: 24,
    load: () => import('./fulda-kav/config').then(m => m.default),
  },
  {
    slug: 'giessen-kav',
    shareTypeCode: 25,
    load: () => import('./giessen-kav/config').then(m => m.default),
  },
  {
    slug: 'hanau-kav',
    shareTypeCode: 26,
    load: () => import('./hanau-kav/config').then(m => m.default),
  },
  {
    slug: 'kassel-kav',
    shareTypeCode: 27,
    load: () => import('./kassel-kav/config').then(m => m.default),
  },
  {
    slug: 'marburg-kav',
    shareTypeCode: 28,
    load: () => import('./marburg-kav/config').then(m => m.default),
  },
  {
    slug: 'offenbach-kav',
    shareTypeCode: 29,
    load: () => import('./offenbach-kav/config').then(m => m.default),
  },
  {
    slug: 'ruesselsheim-kav',
    shareTypeCode: 30,
    load: () => import('./ruesselsheim-kav/config').then(m => m.default),
  },
  {
    slug: 'dadi-kreistag',
    shareTypeCode: 31,
    load: () => import('./dadi-kreistag/config').then(m => m.default),
  },
  {
    slug: 'bad-homburg-stvv',
    shareTypeCode: 32,
    load: () => import('./bad-homburg-stvv/config').then(m => m.default),
  },
  {
    slug: 'wetzlar-stvv',
    shareTypeCode: 33,
    load: () => import('./wetzlar-stvv/config').then(m => m.default),
  },
  {
    slug: 'amberg-stadtrat',
    shareTypeCode: 34,
    load: () => import('./amberg-stadtrat/config').then(m => m.default),
  },
  {
    slug: 'coburg-stadtrat',
    shareTypeCode: 35,
    load: () => import('./coburg-stadtrat/config').then(m => m.default),
  },
  {
    slug: 'kempten-stadtrat',
    shareTypeCode: 36,
    load: () => import('./kempten-stadtrat/config').then(m => m.default),
  },
  {
    slug: 'schweinfurt-stadtrat',
    shareTypeCode: 37,
    load: () => import('./schweinfurt-stadtrat/config').then(m => m.default),
  },
  {
    slug: 'rosenheim-stadtrat',
    shareTypeCode: 38,
    load: () => import('./rosenheim-stadtrat/config').then(m => m.default),
  },
  {
    slug: 'straubing-stadtrat',
    shareTypeCode: 39,
    load: () => import('./straubing-stadtrat/config').then(m => m.default),
  },
  {
    slug: 'hof-stadtrat',
    shareTypeCode: 40,
    load: () => import('./hof-stadtrat/config').then(m => m.default),
  },
  {
    slug: 'passau-stadtrat',
    shareTypeCode: 41,
    load: () => import('./passau-stadtrat/config').then(m => m.default),
  },
  {
    slug: 'landshut-stadtrat',
    shareTypeCode: 42,
    load: () => import('./landshut-stadtrat/config').then(m => m.default),
  },
  {
    slug: 'weiden-stadtrat',
    shareTypeCode: 43,
    load: () => import('./weiden-stadtrat/config').then(m => m.default),
  },
  {
    slug: 'schwabach-stadtrat',
    shareTypeCode: 44,
    load: () => import('./schwabach-stadtrat/config').then(m => m.default),
  },
  {
    slug: 'aschaffenburg-stadtrat',
    shareTypeCode: 45,
    load: () => import('./aschaffenburg-stadtrat/config').then(m => m.default),
  },
  {
    slug: 'kaufbeuren-stadtrat',
    shareTypeCode: 46,
    load: () => import('./kaufbeuren-stadtrat/config').then(m => m.default),
  },
  {
    slug: 'memmingen-stadtrat',
    shareTypeCode: 47,
    load: () => import('./memmingen-stadtrat/config').then(m => m.default),
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
