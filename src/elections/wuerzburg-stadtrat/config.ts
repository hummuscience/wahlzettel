import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'wuerzburg-stadtrat',
  slug: 'wuerzburg-stadtrat',
  shareTypeCode: 17,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-08',
  region: { land: 'BY', gemeinde: 'Würzburg' },

  totalStimmen: 50,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,
  listenkreuzMode: 'perCandidateOnce',

  themeColor: '#8B0000',
  themeColorLight: '#fce8e8',
  themeColorDark: '#5c0000',

  dataFile: 'wuerzburg-stadtrat.json',
  resultsFile: 'results-wuerzburg-stadtrat.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.wuerzburg.de/wahlen',
};

export default config;
