import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'rosenheim-stadtrat',
  slug: 'rosenheim-stadtrat',
  shareTypeCode: 38,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-08',
  region: { land: 'BY', gemeinde: 'Rosenheim' },

  totalStimmen: 44,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,
  listenkreuzMode: 'perCandidateOnce',

  themeColor: '#1a5276',
  themeColorLight: '#e8f0f7',
  themeColorDark: '#0f3047',

  dataFile: 'rosenheim-stadtrat.json',
  resultsFile: 'results-rosenheim-stadtrat.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.rosenheim.de/politik-verwaltung/wahlen-buergerbeteiligung/kommunalwahlen-2026/',
};

export default config;
