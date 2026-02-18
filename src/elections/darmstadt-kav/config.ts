import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'darmstadt-kav',
  slug: 'darmstadt-kav',
  shareTypeCode: 23,

  totalStimmen: 21,
  maxPerCandidate: 3,
  allowListVote: true,

  themeColor: '#004e8a',
  themeColorLight: '#e3f2fd',
  themeColorDark: '#003366',

  dataFile: 'darmstadt-kav.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.darmstadt.de/rathaus/wahlen',
};

export default config;
