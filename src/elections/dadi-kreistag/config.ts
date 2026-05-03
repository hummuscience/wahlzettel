import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'dadi-kreistag',
  slug: 'dadi-kreistag',
  shareTypeCode: 31,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-15',
  region: { land: 'HE', bezirk: 'Darmstadt-Dieburg' },

  totalStimmen: 81,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: false,
  candidateNumbering: 'list-prefix',
  listenkreuzMode: 'cycling',

  themeColor: '#2e5e3f',
  themeColorLight: '#e8f5ec',
  themeColorDark: '#1a3d28',

  dataFile: 'dadi-kreistag.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.ladadi.de/kommunalwahl',
};

export default config;
