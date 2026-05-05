import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'amberg-stadtrat',
  slug: 'amberg-stadtrat',
  shareTypeCode: 34,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-08',
  region: { land: 'BY', gemeinde: 'Amberg' },

  totalStimmen: 40,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,
  listenkreuzMode: 'perCandidateOnce',

  themeColor: '#4a6741',
  themeColorLight: '#e8efe6',
  themeColorDark: '#2d3f28',

  dataFile: 'amberg-stadtrat.json',
  resultsFile: 'results-amberg-stadtrat.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://amberg.de/kommunalwahl',
};

export default config;
