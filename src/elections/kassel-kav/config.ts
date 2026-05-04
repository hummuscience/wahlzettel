import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'kassel-kav',
  slug: 'kassel-kav',
  shareTypeCode: 27,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-15',
  region: { land: 'HE', gemeinde: 'Kassel' },

  totalStimmen: 37,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: false,
  candidateNumbering: 'list-prefix',
  listenkreuzMode: 'cycling',

  themeColor: '#004f9f',
  themeColorLight: '#e3f2fd',
  themeColorDark: '#003670',

  dataFile: 'kassel-kav.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.kassel.de/buerger/rathaus_und_politik/wahlen/',
};

export default config;
