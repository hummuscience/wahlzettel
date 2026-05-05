import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'hof-stadtrat',
  slug: 'hof-stadtrat',
  shareTypeCode: 40,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-08',
  region: { land: 'BY', gemeinde: 'Hof' },

  totalStimmen: 40,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,
  listenkreuzMode: 'perCandidateOnce',

  themeColor: '#8B0000',
  themeColorLight: '#fce8e8',
  themeColorDark: '#520000',

  dataFile: 'hof-stadtrat.json',
  resultsFile: 'results-hof-stadtrat.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.hof.de/rathaus-service/buergerservice/wahlen/kommunalwahl-2026',
};

export default config;
