import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'memmingen-stadtrat',
  slug: 'memmingen-stadtrat',
  shareTypeCode: 47,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-08',
  region: { land: 'BY', gemeinde: 'Memmingen' },

  totalStimmen: 40,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,
  listenkreuzMode: 'perCandidateOnce',

  themeColor: '#1976d2',
  themeColorLight: '#42a5f5',
  themeColorDark: '#0d47a1',

  dataFile: 'memmingen-stadtrat.json',
  resultsFile: 'results-memmingen-stadtrat.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.memmingen.de/politik-verwaltung/wahlen.html',
};

export default config;
