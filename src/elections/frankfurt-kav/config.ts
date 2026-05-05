import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'frankfurt-kav',
  slug: 'frankfurt-kav',
  shareTypeCode: 1,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-15',
  region: { land: 'HE', gemeinde: 'Frankfurt am Main' },

  totalStimmen: 37,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: false,
  candidateNumbering: 'list-prefix',
  listenkreuzMode: 'cycling',

  themeColor: '#003870',
  themeColorLight: '#e8f0f8',
  themeColorDark: '#002650',

  dataFile: 'frankfurt-kav.json',
  resultsFile: 'results-frankfurt-kav.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://frankfurt.de/wahlen',
};

export default config;
