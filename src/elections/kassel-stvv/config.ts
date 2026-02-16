import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'kassel-stvv',
  slug: 'kassel-stvv',
  shareTypeCode: 5,

  totalStimmen: 71,
  maxPerCandidate: 3,
  allowListVote: true,

  themeColor: '#004f9f',
  themeColorLight: '#e3f2fd',
  themeColorDark: '#003670',

  dataFile: 'kassel-stvv.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.kassel.de/buerger/rathaus_und_politik/wahlen/',
};

export default config;
