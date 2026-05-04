import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'darmstadt-kav',
  slug: 'darmstadt-kav',
  shareTypeCode: 23,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-15',
  region: { land: 'HE', gemeinde: 'Darmstadt' },

  totalStimmen: 21,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: false,
  candidateNumbering: 'list-prefix',
  listenkreuzMode: 'cycling',

  themeColor: '#004e8a',
  themeColorLight: '#e3f2fd',
  themeColorDark: '#003366',

  dataFile: 'darmstadt-kav.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.darmstadt.de/rathaus/wahlen',
};

export default config;
