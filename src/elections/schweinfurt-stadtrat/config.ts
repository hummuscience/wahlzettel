import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'schweinfurt-stadtrat',
  slug: 'schweinfurt-stadtrat',
  shareTypeCode: 37,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-08',
  region: { land: 'BY', gemeinde: 'Schweinfurt' },

  totalStimmen: 44,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,
  listenkreuzMode: 'perCandidateOnce',

  themeColor: '#003f72',
  themeColorLight: '#e6eef5',
  themeColorDark: '#002544',

  dataFile: 'schweinfurt-stadtrat.json',
  resultsFile: 'results-schweinfurt-stadtrat.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.schweinfurt.de/rathaus-politik/stadt/wahlen/kommunalwahlen-2026/',
};

export default config;
