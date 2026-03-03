import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'coburg-stadtrat',
  slug: 'coburg-stadtrat',
  shareTypeCode: 35,

  totalStimmen: 40,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,

  themeColor: '#1a3c6e',
  themeColorLight: '#e6ecf5',
  themeColorDark: '#0f2440',

  dataFile: 'coburg-stadtrat.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.coburg.de/stadtpolitik/wahlen-und-abstimmungen/',
};

export default config;
