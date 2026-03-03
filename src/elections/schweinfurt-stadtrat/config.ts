import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'schweinfurt-stadtrat',
  slug: 'schweinfurt-stadtrat',
  shareTypeCode: 37,

  totalStimmen: 44,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,

  themeColor: '#003f72',
  themeColorLight: '#e6eef5',
  themeColorDark: '#002544',

  dataFile: 'schweinfurt-stadtrat.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.schweinfurt.de/rathaus-politik/stadt/wahlen/kommunalwahlen-2026/',
};

export default config;
