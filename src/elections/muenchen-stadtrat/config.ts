import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'muenchen-stadtrat',
  slug: 'muenchen-stadtrat',
  shareTypeCode: 12,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-08',
  region: { land: 'BY', gemeinde: 'München' },

  totalStimmen: 80,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,
  listenkreuzMode: 'perCandidateOnce',

  themeColor: '#1a4d8f',
  themeColorLight: '#e8f0fa',
  themeColorDark: '#0e2f5a',

  dataFile: 'muenchen-stadtrat.json',
  resultsFile: 'results-muenchen-stadtrat.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://stadt.muenchen.de/infos/kommunalwahlen.html',
};

export default config;
