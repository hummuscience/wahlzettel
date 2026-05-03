import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'bad-homburg-stvv',
  slug: 'bad-homburg-stvv',
  shareTypeCode: 32,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-15',
  region: { land: 'HE', gemeinde: 'Bad Homburg vor der Höhe' },

  totalStimmen: 49,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: false,
  candidateNumbering: 'list-prefix',
  listenkreuzMode: 'cycling',

  themeColor: '#2e6b4f',
  themeColorLight: '#e6f2ec',
  themeColorDark: '#1a3f2f',

  dataFile: 'bad-homburg-stvv.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.bad-homburg.de/leben-in-bad-homburg/rathaus-politik/wahlen/',
};

export default config;
