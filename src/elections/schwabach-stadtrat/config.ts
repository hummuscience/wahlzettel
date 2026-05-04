import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'schwabach-stadtrat',
  slug: 'schwabach-stadtrat',
  shareTypeCode: 44,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-08',
  region: { land: 'BY', gemeinde: 'Schwabach' },

  totalStimmen: 40,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,
  listenkreuzMode: 'perCandidateOnce',

  themeColor: '#f9a825',
  themeColorLight: '#fdd835',
  themeColorDark: '#f57f17',

  dataFile: 'schwabach-stadtrat.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.schwabach.de/de/wahlamt',
};

export default config;
