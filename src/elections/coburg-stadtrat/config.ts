import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'coburg-stadtrat',
  slug: 'coburg-stadtrat',
  shareTypeCode: 35,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-08',
  region: { land: 'BY', gemeinde: 'Coburg' },

  totalStimmen: 40,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,
  listenkreuzMode: 'perCandidateOnce',

  themeColor: '#1a3c6e',
  themeColorLight: '#e6ecf5',
  themeColorDark: '#0f2440',

  dataFile: 'coburg-stadtrat.json',
  resultsFile: 'results-coburg-stadtrat.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.coburg.de/stadtpolitik/wahlen-und-abstimmungen/',
};

export default config;
