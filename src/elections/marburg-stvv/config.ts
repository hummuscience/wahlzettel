import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'marburg-stvv',
  slug: 'marburg-stvv',
  shareTypeCode: 9,

  totalStimmen: 59,
  maxPerCandidate: 3,
  allowListVote: true,

  themeColor: '#163455',
  themeColorLight: '#e8eef5',
  themeColorDark: '#0d1f33',

  dataFile: 'marburg-stvv.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.marburg.de/rathaus/wahlen',
};

export default config;
