import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'marburg-kav',
  slug: 'marburg-kav',
  shareTypeCode: 28,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-15',
  region: { land: 'HE', gemeinde: 'Marburg' },

  totalStimmen: 15,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: false,
  candidateNumbering: 'list-prefix',
  listenkreuzMode: 'cycling',

  themeColor: '#163455',
  themeColorLight: '#e8eef5',
  themeColorDark: '#0d1f33',

  dataFile: 'marburg-kav.json',
  resultsFile: 'results-marburg-kav.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.marburg.de/rathaus/wahlen',
};

export default config;
