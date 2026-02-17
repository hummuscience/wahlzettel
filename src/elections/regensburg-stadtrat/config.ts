import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'regensburg-stadtrat',
  slug: 'regensburg-stadtrat',
  shareTypeCode: 15,

  totalStimmen: 50,
  maxPerCandidate: 3,
  allowListVote: true,

  themeColor: '#004f9f',
  themeColorLight: '#e8f0fa',
  themeColorDark: '#003370',

  dataFile: 'regensburg-stadtrat.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.regensburg.de/rathaus/wahlen',
};

export default config;
