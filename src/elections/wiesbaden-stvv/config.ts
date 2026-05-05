import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'wiesbaden-stvv',
  slug: 'wiesbaden-stvv',
  shareTypeCode: 2,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-15',
  region: { land: 'HE', gemeinde: 'Wiesbaden' },

  totalStimmen: 81,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: false,
  candidateNumbering: 'list-prefix',
  listenkreuzMode: 'cycling',

  themeColor: '#00594f',
  themeColorLight: '#e0f2f1',
  themeColorDark: '#003d36',

  dataFile: 'wiesbaden-stvv.json',
  resultsFile: 'results-wiesbaden-stvv.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.wiesbaden.de/rathaus/wahlen',
};

export default config;
