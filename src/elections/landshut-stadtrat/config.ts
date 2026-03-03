import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'landshut-stadtrat',
  slug: 'landshut-stadtrat',
  shareTypeCode: 42,
  totalStimmen: 44,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,
  themeColor: '#c62828',
  themeColorLight: '#ef5350',
  themeColorDark: '#b71c1c',
  dataFile: 'landshut-stadtrat.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.landshut.de/rathaus-politik/wahlen',
};

export default config;
