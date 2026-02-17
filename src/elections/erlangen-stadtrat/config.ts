import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'erlangen-stadtrat',
  slug: 'erlangen-stadtrat',
  shareTypeCode: 19,

  totalStimmen: 50,
  maxPerCandidate: 3,
  allowListVote: true,

  themeColor: '#003366',
  themeColorLight: '#e6ecf2',
  themeColorDark: '#001f3f',

  dataFile: 'erlangen-stadtrat.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.erlangen.de/wahlen',
};

export default config;
