import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'giessen-kav',
  slug: 'giessen-kav',
  shareTypeCode: 25,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-15',
  region: { land: 'HE', gemeinde: 'Gießen' },

  totalStimmen: 31,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: false,
  candidateNumbering: 'list-prefix',
  listenkreuzMode: 'cycling',

  themeColor: '#006633',
  themeColorLight: '#e8f5e9',
  themeColorDark: '#004422',

  dataFile: 'giessen-kav.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.giessen.de/rathaus/wahlen/',
};

export default config;
