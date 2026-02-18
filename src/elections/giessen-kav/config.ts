import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'giessen-kav',
  slug: 'giessen-kav',
  shareTypeCode: 25,

  totalStimmen: 31,
  maxPerCandidate: 3,
  allowListVote: true,

  themeColor: '#006633',
  themeColorLight: '#e8f5e9',
  themeColorDark: '#004422',

  dataFile: 'giessen-kav.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.giessen.de/rathaus/wahlen/',
};

export default config;
