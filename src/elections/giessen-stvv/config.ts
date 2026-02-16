import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'giessen-stvv',
  slug: 'giessen-stvv',
  shareTypeCode: 8,

  totalStimmen: 59,
  maxPerCandidate: 3,
  allowListVote: true,

  themeColor: '#006633',
  themeColorLight: '#e8f5e9',
  themeColorDark: '#004422',

  dataFile: 'giessen-stvv.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.giessen.de/rathaus/wahlen/',
};

export default config;
