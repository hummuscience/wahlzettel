import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'wetzlar-stvv',
  slug: 'wetzlar-stvv',
  shareTypeCode: 33,

  totalStimmen: 59,
  maxPerCandidate: 3,
  allowListVote: true,

  themeColor: '#8B0000',
  themeColorLight: '#fce8e8',
  themeColorDark: '#520000',

  dataFile: 'wetzlar-stvv.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.wetzlar.de/rathaus/politik/wahlen/kommunalwahl.php',
};

export default config;
