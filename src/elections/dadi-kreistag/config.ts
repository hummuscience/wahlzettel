import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'dadi-kreistag',
  slug: 'dadi-kreistag',
  shareTypeCode: 31,

  totalStimmen: 81,
  maxPerCandidate: 3,
  allowListVote: true,

  themeColor: '#2e5e3f',
  themeColorLight: '#e8f5ec',
  themeColorDark: '#1a3d28',

  dataFile: 'dadi-kreistag.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.ladadi.de/kommunalwahl',
};

export default config;
