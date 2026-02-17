import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'bamberg-stadtrat',
  slug: 'bamberg-stadtrat',
  shareTypeCode: 20,

  totalStimmen: 44,
  maxPerCandidate: 3,
  allowListVote: true,

  themeColor: '#8B4513',
  themeColorLight: '#faf0e6',
  themeColorDark: '#5c2d0e',

  dataFile: 'bamberg-stadtrat.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.stadt.bamberg.de/wahlen',
};

export default config;
