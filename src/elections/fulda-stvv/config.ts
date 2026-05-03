import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'fulda-stvv',
  slug: 'fulda-stvv',
  shareTypeCode: 10,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-15',
  region: { land: 'HE', gemeinde: 'Fulda' },

  totalStimmen: 59,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: false,
  candidateNumbering: 'list-prefix',
  listenkreuzMode: 'cycling',

  themeColor: '#8B0000',
  themeColorLight: '#fce4ec',
  themeColorDark: '#5c0000',

  dataFile: 'fulda-stvv.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.fulda.de/rathaus/wahlen/',
};

export default config;
