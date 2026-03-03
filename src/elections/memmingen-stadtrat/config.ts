import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'memmingen-stadtrat',
  slug: 'memmingen-stadtrat',
  shareTypeCode: 47,
  totalStimmen: 40,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,
  themeColor: '#1976d2',
  themeColorLight: '#42a5f5',
  themeColorDark: '#0d47a1',
  dataFile: 'memmingen-stadtrat.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.memmingen.de/politik-verwaltung/wahlen.html',
};

export default config;
