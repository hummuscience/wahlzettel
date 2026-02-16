import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'offenbach-stvv',
  slug: 'offenbach-stvv',
  shareTypeCode: 7,

  totalStimmen: 71,
  maxPerCandidate: 3,
  allowListVote: true,

  themeColor: '#1a5276',
  themeColorLight: '#e8f4fd',
  themeColorDark: '#0e3047',

  dataFile: 'offenbach-stvv.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.offenbach.de/rathaus/wahlen/',
};

export default config;
