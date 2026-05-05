import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'ingolstadt-stadtrat',
  slug: 'ingolstadt-stadtrat',
  shareTypeCode: 16,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-08',
  region: { land: 'BY', gemeinde: 'Ingolstadt' },

  totalStimmen: 50,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,
  listenkreuzMode: 'perCandidateOnce',

  themeColor: '#0072bc',
  themeColorLight: '#e6f2fa',
  themeColorDark: '#004d80',

  dataFile: 'ingolstadt-stadtrat.json',
  resultsFile: 'results-ingolstadt-stadtrat.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.ingolstadt.de/Rathaus_Politik/Wahlen/Kommunalwahlen/',
};

export default config;
