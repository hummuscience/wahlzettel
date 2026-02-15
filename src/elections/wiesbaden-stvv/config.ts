import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'wiesbaden-stvv',
  slug: 'wiesbaden-stvv',
  shareTypeCode: 2,

  totalStimmen: 81,
  maxPerCandidate: 3,
  allowListVote: true,

  themeColor: '#00594f',
  themeColorLight: '#e0f2f1',
  themeColorDark: '#003d36',

  dataFile: 'wiesbaden-stvv.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.wiesbaden.de/rathaus/wahlen',
};

export default config;
