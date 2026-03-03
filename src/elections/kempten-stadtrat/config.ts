import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'kempten-stadtrat',
  slug: 'kempten-stadtrat',
  shareTypeCode: 36,

  totalStimmen: 44,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,

  themeColor: '#006847',
  themeColorLight: '#e0f2eb',
  themeColorDark: '#003d2a',

  dataFile: 'kempten-stadtrat.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.kempten.de/40490.html',
};

export default config;
