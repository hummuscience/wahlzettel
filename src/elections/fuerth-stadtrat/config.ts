import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'fuerth-stadtrat',
  slug: 'fuerth-stadtrat',
  shareTypeCode: 18,

  totalStimmen: 50,
  maxPerCandidate: 3,
  allowListVote: true,

  themeColor: '#006633',
  themeColorLight: '#e5f5ee',
  themeColorDark: '#004422',

  dataFile: 'fuerth-stadtrat.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.fuerth.de/wahlen',
};

export default config;
