import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'bayreuth-stadtrat',
  slug: 'bayreuth-stadtrat',
  shareTypeCode: 21,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-08',
  region: { land: 'BY', gemeinde: 'Bayreuth' },

  totalStimmen: 44,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,
  listenkreuzMode: 'perCandidateOnce',

  themeColor: '#c41e3a',
  themeColorLight: '#fce8ec',
  themeColorDark: '#8b1528',

  dataFile: 'bayreuth-stadtrat.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.bayreuth.de/wahlen',
};

export default config;
