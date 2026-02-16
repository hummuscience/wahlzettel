import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'hanau-stvv',
  slug: 'hanau-stvv',
  shareTypeCode: 6,

  totalStimmen: 59,
  maxPerCandidate: 3,
  allowListVote: true,

  themeColor: '#c41e3a',
  themeColorLight: '#fce4ec',
  themeColorDark: '#8e0023',

  dataFile: 'hanau-stvv.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.hanau.de/rathaus/wahlen/',
};

export default config;
