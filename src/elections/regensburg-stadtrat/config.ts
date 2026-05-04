import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'regensburg-stadtrat',
  slug: 'regensburg-stadtrat',
  shareTypeCode: 15,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-08',
  region: { land: 'BY', gemeinde: 'Regensburg' },

  totalStimmen: 50,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,
  listenkreuzMode: 'perCandidateOnce',

  themeColor: '#004f9f',
  themeColorLight: '#e8f0fa',
  themeColorDark: '#003370',

  dataFile: 'regensburg-stadtrat.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.regensburg.de/rathaus/wahlen',
};

export default config;
