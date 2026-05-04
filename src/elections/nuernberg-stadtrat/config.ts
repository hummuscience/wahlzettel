import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'nuernberg-stadtrat',
  slug: 'nuernberg-stadtrat',
  shareTypeCode: 13,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-08',
  region: { land: 'BY', gemeinde: 'Nürnberg' },

  totalStimmen: 70,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,
  listenkreuzMode: 'perCandidateOnce',

  themeColor: '#c41e3a',
  themeColorLight: '#fce8ec',
  themeColorDark: '#8b1528',

  dataFile: 'nuernberg-stadtrat.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.nuernberg.de/internet/wahlen/',
};

export default config;
