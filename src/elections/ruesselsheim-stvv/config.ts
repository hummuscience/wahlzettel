import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'ruesselsheim-stvv',
  slug: 'ruesselsheim-stvv',
  shareTypeCode: 11,

  totalStimmen: 45,
  maxPerCandidate: 3,
  allowListVote: true,

  themeColor: '#003399',
  themeColorLight: '#e3f2fd',
  themeColorDark: '#002266',

  dataFile: 'ruesselsheim-stvv.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.ruesselsheim.de/rathaus/wahlen/',
};

export default config;
