import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: 'bad-homburg-stvv',
  slug: 'bad-homburg-stvv',
  shareTypeCode: 32,

  totalStimmen: 49,
  maxPerCandidate: 3,
  allowListVote: true,

  themeColor: '#2e6b4f',
  themeColorLight: '#e6f2ec',
  themeColorDark: '#1a3f2f',

  dataFile: 'bad-homburg-stvv.json',
  partyColors: PARTY_COLORS,

  infoUrl: 'https://www.bad-homburg.de/leben-in-bad-homburg/rathaus-politik/wahlen/',
};

export default config;
