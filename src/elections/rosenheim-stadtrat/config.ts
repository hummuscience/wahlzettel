import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'rosenheim-stadtrat',
  slug: 'rosenheim-stadtrat',
  shareTypeCode: 38,

  totalStimmen: 44,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,

  themeColor: '#1a5276',
  themeColorLight: '#e8f0f7',
  themeColorDark: '#0f3047',

  dataFile: 'rosenheim-stadtrat.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.rosenheim.de/politik-verwaltung/wahlen-buergerbeteiligung/kommunalwahlen-2026/',
};

export default config;
