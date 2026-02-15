import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'wiesbaden-kav',
  slug: 'wiesbaden-kav',
  shareTypeCode: 3,

  totalStimmen: 31,
  maxPerCandidate: 3,
  allowListVote: true,

  themeColor: '#00594f',
  themeColorLight: '#e0f2f1',
  themeColorDark: '#003d36',

  dataFile: 'wiesbaden-kav.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.wiesbaden.de/rathaus/wahlen',
};

export default config;
