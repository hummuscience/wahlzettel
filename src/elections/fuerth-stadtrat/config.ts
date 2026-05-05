import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'fuerth-stadtrat',
  slug: 'fuerth-stadtrat',
  shareTypeCode: 18,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-08',
  region: { land: 'BY', gemeinde: 'Fürth' },

  totalStimmen: 50,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,
  listenkreuzMode: 'perCandidateOnce',

  themeColor: '#006633',
  themeColorLight: '#e5f5ee',
  themeColorDark: '#004422',

  dataFile: 'fuerth-stadtrat.json',
  resultsFile: 'results-fuerth-stadtrat.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.fuerth.de/wahlen',
};

export default config;
