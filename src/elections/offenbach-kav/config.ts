import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'offenbach-kav',
  slug: 'offenbach-kav',
  shareTypeCode: 29,

  totalStimmen: 25,
  maxPerCandidate: 3,
  allowListVote: true,

  themeColor: '#1a5276',
  themeColorLight: '#e8f4fd',
  themeColorDark: '#0e3047',

  dataFile: 'offenbach-kav.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.offenbach.de/rathaus/wahlen/',
};

export default config;
