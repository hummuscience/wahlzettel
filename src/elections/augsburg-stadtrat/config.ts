import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'augsburg-stadtrat',
  slug: 'augsburg-stadtrat',
  shareTypeCode: 14,

  totalStimmen: 60,
  maxPerCandidate: 3,
  allowListVote: true,

  themeColor: '#006847',
  themeColorLight: '#e5f5ee',
  themeColorDark: '#004a32',

  dataFile: 'augsburg-stadtrat.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.augsburg.de/buergerservice/wahlen',
};

export default config;
