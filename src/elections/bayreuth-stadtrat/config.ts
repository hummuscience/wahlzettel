import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'bayreuth-stadtrat',
  slug: 'bayreuth-stadtrat',
  shareTypeCode: 21,

  totalStimmen: 44,
  maxPerCandidate: 3,
  allowListVote: true,

  themeColor: '#c41e3a',
  themeColorLight: '#fce8ec',
  themeColorDark: '#8b1528',

  dataFile: 'bayreuth-stadtrat.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.bayreuth.de/wahlen',
};

export default config;
