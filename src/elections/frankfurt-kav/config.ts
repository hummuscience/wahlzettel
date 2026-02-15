import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'frankfurt-kav',
  slug: 'frankfurt-kav',
  shareTypeCode: 1,

  totalStimmen: 37,
  maxPerCandidate: 3,
  allowListVote: true,

  themeColor: '#003870',
  themeColorLight: '#e8f0f8',
  themeColorDark: '#002650',

  dataFile: 'frankfurt-kav.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://frankfurt.de/wahlen',
};

export default config;
