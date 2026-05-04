import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'landshut-stadtrat',
  slug: 'landshut-stadtrat',
  shareTypeCode: 42,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-08',
  region: { land: 'BY', gemeinde: 'Landshut' },

  totalStimmen: 44,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,
  listenkreuzMode: 'perCandidateOnce',

  themeColor: '#c62828',
  themeColorLight: '#ef5350',
  themeColorDark: '#b71c1c',

  dataFile: 'landshut-stadtrat.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.landshut.de/rathaus-politik/wahlen',
};

export default config;
