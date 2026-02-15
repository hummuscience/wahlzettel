import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'frankfurt-stvv',
  slug: 'frankfurt-stvv',
  shareTypeCode: 0,

  totalStimmen: 93,
  maxPerCandidate: 3,
  allowListVote: true,

  themeColor: '#003870',
  themeColorLight: '#e8f0f8',
  themeColorDark: '#002650',

  dataFile: 'frankfurt-stvv.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://frankfurt.de/wahlen',
};

export default config;
