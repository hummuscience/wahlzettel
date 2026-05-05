import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'weiden-stadtrat',
  slug: 'weiden-stadtrat',
  shareTypeCode: 43,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-08',
  region: { land: 'BY', gemeinde: 'Weiden in der Oberpfalz' },

  totalStimmen: 40,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,
  listenkreuzMode: 'perCandidateOnce',

  themeColor: '#1565c0',
  themeColorLight: '#42a5f5',
  themeColorDark: '#0d47a1',

  dataFile: 'weiden-stadtrat.json',
  resultsFile: 'results-weiden-stadtrat.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.weiden.de/stadt/rathaus/wahlen',
};

export default config;
