import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'straubing-stadtrat',
  slug: 'straubing-stadtrat',
  shareTypeCode: 39,

  totalStimmen: 40,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,

  themeColor: '#004e8a',
  themeColorLight: '#e6f0f8',
  themeColorDark: '#002e52',

  dataFile: 'straubing-stadtrat.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.straubing.de/rathaus-verwaltung/politik/kommunalwahl-2026/',
};

export default config;
