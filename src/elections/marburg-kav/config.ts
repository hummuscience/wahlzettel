import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'marburg-kav',
  slug: 'marburg-kav',
  shareTypeCode: 28,

  totalStimmen: 15,
  maxPerCandidate: 3,
  allowListVote: true,

  themeColor: '#163455',
  themeColorLight: '#e8eef5',
  themeColorDark: '#0d1f33',

  dataFile: 'marburg-kav.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.marburg.de/rathaus/wahlen',
};

export default config;
