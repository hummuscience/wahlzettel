import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'bamberg-stadtrat',
  slug: 'bamberg-stadtrat',
  shareTypeCode: 20,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-08',
  region: { land: 'BY', gemeinde: 'Bamberg' },

  totalStimmen: 44,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,
  listenkreuzMode: 'perCandidateOnce',

  themeColor: '#8B4513',
  themeColorLight: '#faf0e6',
  themeColorDark: '#5c2d0e',

  dataFile: 'bamberg-stadtrat.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.stadt.bamberg.de/wahlen',
};

export default config;
