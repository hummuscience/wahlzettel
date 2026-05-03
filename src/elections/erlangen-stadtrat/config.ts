import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'erlangen-stadtrat',
  slug: 'erlangen-stadtrat',
  shareTypeCode: 19,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-08',
  region: { land: 'BY', gemeinde: 'Erlangen' },

  totalStimmen: 50,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,
  listenkreuzMode: 'perCandidateOnce',

  themeColor: '#003366',
  themeColorLight: '#e6ecf2',
  themeColorDark: '#001f3f',

  dataFile: 'erlangen-stadtrat.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.erlangen.de/wahlen',
};

export default config;
