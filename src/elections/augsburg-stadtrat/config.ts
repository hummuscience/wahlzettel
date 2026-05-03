import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'augsburg-stadtrat',
  slug: 'augsburg-stadtrat',
  shareTypeCode: 14,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-08',
  region: { land: 'BY', gemeinde: 'Augsburg' },

  totalStimmen: 60,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,
  listenkreuzMode: 'perCandidateOnce',

  themeColor: '#006847',
  themeColorLight: '#e5f5ee',
  themeColorDark: '#004a32',

  dataFile: 'augsburg-stadtrat.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.augsburg.de/buergerservice/wahlen',
};

export default config;
