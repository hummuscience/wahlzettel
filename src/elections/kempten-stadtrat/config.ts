import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'kempten-stadtrat',
  slug: 'kempten-stadtrat',
  shareTypeCode: 36,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-08',
  region: { land: 'BY', gemeinde: 'Kempten' },

  totalStimmen: 44,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,
  listenkreuzMode: 'perCandidateOnce',

  themeColor: '#006847',
  themeColorLight: '#e0f2eb',
  themeColorDark: '#003d2a',

  dataFile: 'kempten-stadtrat.json',
  resultsFile: 'results-kempten-stadtrat.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.kempten.de/40490.html',
};

export default config;
