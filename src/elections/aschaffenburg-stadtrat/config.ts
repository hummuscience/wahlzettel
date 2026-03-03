import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'aschaffenburg-stadtrat',
  slug: 'aschaffenburg-stadtrat',
  shareTypeCode: 45,
  totalStimmen: 44,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,
  themeColor: '#d32f2f',
  themeColorLight: '#ef5350',
  themeColorDark: '#c62828',
  dataFile: 'aschaffenburg-stadtrat.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.aschaffenburg.de/Politik-Verwaltung/Wahlen/',
};

export default config;
