import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'fulda-kav',
  slug: 'fulda-kav',
  shareTypeCode: 24,

  totalStimmen: 11,
  maxPerCandidate: 3,
  allowListVote: true,

  themeColor: '#8B0000',
  themeColorLight: '#fce4ec',
  themeColorDark: '#5c0000',

  dataFile: 'fulda-kav.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.fulda.de/rathaus/wahlen/',
};

export default config;
