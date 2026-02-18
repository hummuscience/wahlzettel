import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'ruesselsheim-kav',
  slug: 'ruesselsheim-kav',
  shareTypeCode: 30,

  totalStimmen: 21,
  maxPerCandidate: 3,
  allowListVote: true,

  themeColor: '#003399',
  themeColorLight: '#e3f2fd',
  themeColorDark: '#002266',

  dataFile: 'ruesselsheim-kav.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.ruesselsheim.de/rathaus/wahlen/',
};

export default config;
