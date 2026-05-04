import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'hanau-kav',
  slug: 'hanau-kav',
  shareTypeCode: 26,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-15',
  region: { land: 'HE', gemeinde: 'Hanau' },

  totalStimmen: 15,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: false,
  candidateNumbering: 'list-prefix',
  listenkreuzMode: 'cycling',

  themeColor: '#c41e3a',
  themeColorLight: '#fce4ec',
  themeColorDark: '#8e0023',

  dataFile: 'hanau-kav.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.hanau.de/rathaus/wahlen/',
};

export default config;
