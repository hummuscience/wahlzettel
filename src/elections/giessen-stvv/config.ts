import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'giessen-stvv',
  slug: 'giessen-stvv',
  shareTypeCode: 8,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-15',
  region: { land: 'HE', gemeinde: 'Gießen' },

  totalStimmen: 59,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: false,
  candidateNumbering: 'list-prefix',
  listenkreuzMode: 'cycling',

  themeColor: '#006633',
  themeColorLight: '#e8f5e9',
  themeColorDark: '#004422',

  dataFile: 'giessen-stvv.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.giessen.de/rathaus/wahlen/',
};

export default config;
