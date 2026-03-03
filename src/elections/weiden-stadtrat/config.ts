import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'weiden-stadtrat',
  slug: 'weiden-stadtrat',
  shareTypeCode: 43,
  totalStimmen: 40,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,
  themeColor: '#1565c0',
  themeColorLight: '#42a5f5',
  themeColorDark: '#0d47a1',
  dataFile: 'weiden-stadtrat.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.weiden.de/stadt/rathaus/wahlen',
};

export default config;
