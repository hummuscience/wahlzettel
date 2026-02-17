import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'ingolstadt-stadtrat',
  slug: 'ingolstadt-stadtrat',
  shareTypeCode: 16,

  totalStimmen: 50,
  maxPerCandidate: 3,
  allowListVote: true,

  themeColor: '#0072bc',
  themeColorLight: '#e6f2fa',
  themeColorDark: '#004d80',

  dataFile: 'ingolstadt-stadtrat.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.ingolstadt.de/Rathaus_Politik/Wahlen/Kommunalwahlen/',
};

export default config;
