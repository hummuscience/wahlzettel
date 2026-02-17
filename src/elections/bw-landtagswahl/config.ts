import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'bw-landtagswahl',
  slug: 'bw-landtagswahl',
  shareTypeCode: 22,

  type: 'landtagswahl',

  // Landtagswahl: 1 Erststimme + 1 Zweitstimme = 2
  totalStimmen: 2,
  maxPerCandidate: 1,
  allowListVote: false,

  themeColor: '#d4a017',       // BW gold
  themeColorLight: '#fdf6e3',
  themeColorDark: '#8b6914',

  dataFile: 'bw-landtagswahl.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.landtagswahl-bw.de',
};

export default config;
