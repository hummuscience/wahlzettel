import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'hof-stadtrat',
  slug: 'hof-stadtrat',
  shareTypeCode: 40,

  totalStimmen: 40,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,

  themeColor: '#8B0000',
  themeColorLight: '#fce8e8',
  themeColorDark: '#520000',

  dataFile: 'hof-stadtrat.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.hof.de/rathaus-service/buergerservice/wahlen/kommunalwahl-2026',
};

export default config;
