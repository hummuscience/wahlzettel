import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'muenchen-stadtrat',
  slug: 'muenchen-stadtrat',
  shareTypeCode: 12,

  totalStimmen: 80,
  maxPerCandidate: 3,
  allowListVote: true,

  themeColor: '#1a4d8f',
  themeColorLight: '#e8f0fa',
  themeColorDark: '#0e2f5a',

  dataFile: 'muenchen-stadtrat.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://stadt.muenchen.de/infos/kommunalwahlen.html',
};

export default config;
