import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'fulda-stvv',
  slug: 'fulda-stvv',
  shareTypeCode: 10,

  totalStimmen: 59,
  maxPerCandidate: 3,
  allowListVote: true,

  themeColor: '#8B0000',
  themeColorLight: '#fce4ec',
  themeColorDark: '#5c0000',

  dataFile: 'fulda-stvv.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.fulda.de/rathaus/wahlen/',
};

export default config;
