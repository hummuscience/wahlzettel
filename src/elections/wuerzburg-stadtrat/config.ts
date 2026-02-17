import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'wuerzburg-stadtrat',
  slug: 'wuerzburg-stadtrat',
  shareTypeCode: 17,

  totalStimmen: 50,
  maxPerCandidate: 3,
  allowListVote: true,

  themeColor: '#8B0000',
  themeColorLight: '#fce8e8',
  themeColorDark: '#5c0000',

  dataFile: 'wuerzburg-stadtrat.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.wuerzburg.de/wahlen',
};

export default config;
