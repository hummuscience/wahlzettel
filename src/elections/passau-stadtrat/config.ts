import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'passau-stadtrat',
  slug: 'passau-stadtrat',
  shareTypeCode: 41,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-08',
  region: { land: 'BY', gemeinde: 'Passau' },

  totalStimmen: 44,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,
  listenkreuzMode: 'perCandidateOnce',

  themeColor: '#c41e3a',
  themeColorLight: '#fce8ec',
  themeColorDark: '#8b1528',

  dataFile: 'passau-stadtrat.json',
  resultsFile: 'results-passau-stadtrat.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.passau.de/rathaus-buergerservice/dienstleistungen/a-z/kommunalwahl-2026/',
};

export default config;
