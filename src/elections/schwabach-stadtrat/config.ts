import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'schwabach-stadtrat',
  slug: 'schwabach-stadtrat',
  shareTypeCode: 44,
  totalStimmen: 40,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: true,
  themeColor: '#f9a825',
  themeColorLight: '#fdd835',
  themeColorDark: '#f57f17',
  dataFile: 'schwabach-stadtrat.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.schwabach.de/de/wahlamt',
};

export default config;
