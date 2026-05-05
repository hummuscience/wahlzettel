import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'offenbach-kav',
  slug: 'offenbach-kav',
  shareTypeCode: 29,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-15',
  region: { land: 'HE', gemeinde: 'Offenbach am Main' },

  totalStimmen: 25,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: false,
  candidateNumbering: 'list-prefix',
  listenkreuzMode: 'cycling',

  themeColor: '#1a5276',
  themeColorLight: '#e8f4fd',
  themeColorDark: '#0e3047',

  dataFile: 'offenbach-kav.json',
  resultsFile: 'results-offenbach-kav.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.offenbach.de/rathaus/wahlen/',
};

export default config;
