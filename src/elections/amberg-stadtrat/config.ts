import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'amberg-stadtrat',
  slug: 'amberg-stadtrat',
  shareTypeCode: 34,

  totalStimmen: 40,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,

  themeColor: '#4a6741',
  themeColorLight: '#e8efe6',
  themeColorDark: '#2d3f28',

  dataFile: 'amberg-stadtrat.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://amberg.de/kommunalwahl',
};

export default config;
