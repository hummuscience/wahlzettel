import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'passau-stadtrat',
  slug: 'passau-stadtrat',
  shareTypeCode: 41,

  totalStimmen: 44,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,

  themeColor: '#c41e3a',
  themeColorLight: '#fce8ec',
  themeColorDark: '#8b1528',

  dataFile: 'passau-stadtrat.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.passau.de/rathaus-buergerservice/dienstleistungen/a-z/kommunalwahl-2026/',
};

export default config;
