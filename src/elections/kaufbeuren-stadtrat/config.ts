import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'kaufbeuren-stadtrat',
  slug: 'kaufbeuren-stadtrat',
  shareTypeCode: 46,
  totalStimmen: 40,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,
  themeColor: '#2e7d32',
  themeColorLight: '#4caf50',
  themeColorDark: '#1b5e20',
  dataFile: 'kaufbeuren-stadtrat.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.kaufbeuren.de/nav/stadtrat-verwaltung/wahlen.aspx',
};

export default config;
