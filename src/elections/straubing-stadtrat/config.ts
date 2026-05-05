import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'straubing-stadtrat',
  slug: 'straubing-stadtrat',
  shareTypeCode: 39,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-08',
  region: { land: 'BY', gemeinde: 'Straubing' },

  totalStimmen: 40,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,
  listenkreuzMode: 'perCandidateOnce',

  themeColor: '#004e8a',
  themeColorLight: '#e6f0f8',
  themeColorDark: '#002e52',

  dataFile: 'straubing-stadtrat.json',
  resultsFile: 'results-straubing-stadtrat.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.straubing.de/rathaus-verwaltung/politik/kommunalwahl-2026/',
};

export default config;
