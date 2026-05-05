import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'wetzlar-stvv',
  slug: 'wetzlar-stvv',
  shareTypeCode: 33,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-15',
  region: { land: 'HE', gemeinde: 'Wetzlar' },

  totalStimmen: 59,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: false,
  candidateNumbering: 'list-prefix',
  listenkreuzMode: 'cycling',

  themeColor: '#8B0000',
  themeColorLight: '#fce8e8',
  themeColorDark: '#520000',

  dataFile: 'wetzlar-stvv.json',
  resultsFile: 'results-wetzlar-stvv.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.wetzlar.de/rathaus/politik/wahlen/kommunalwahl.php',
};

export default config;
