import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'aschaffenburg-stadtrat',
  slug: 'aschaffenburg-stadtrat',
  shareTypeCode: 45,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-08',
  region: { land: 'BY', gemeinde: 'Aschaffenburg' },

  totalStimmen: 44,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,
  listenkreuzMode: 'perCandidateOnce',

  themeColor: '#d32f2f',
  themeColorLight: '#ef5350',
  themeColorDark: '#c62828',

  dataFile: 'aschaffenburg-stadtrat.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.aschaffenburg.de/Politik-Verwaltung/Wahlen/',
};

export default config;
