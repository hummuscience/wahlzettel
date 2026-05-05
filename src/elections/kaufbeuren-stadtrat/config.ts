import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'kaufbeuren-stadtrat',
  slug: 'kaufbeuren-stadtrat',
  shareTypeCode: 46,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-08',
  region: { land: 'BY', gemeinde: 'Kaufbeuren' },

  totalStimmen: 40,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,
  listenkreuzMode: 'perCandidateOnce',

  themeColor: '#2e7d32',
  themeColorLight: '#4caf50',
  themeColorDark: '#1b5e20',

  dataFile: 'kaufbeuren-stadtrat.json',
  resultsFile: 'results-kaufbeuren-stadtrat.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.kaufbeuren.de/nav/stadtrat-verwaltung/wahlen.aspx',
};

export default config;
