import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'nuernberg-stadtrat',
  slug: 'nuernberg-stadtrat',
  shareTypeCode: 13,

  totalStimmen: 70,
  maxPerCandidate: 3,
  allowListVote: true,

  themeColor: '#c41e3a',
  themeColorLight: '#fce8ec',
  themeColorDark: '#8b1528',

  dataFile: 'nuernberg-stadtrat.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.nuernberg.de/internet/wahlen/',
};

export default config;
