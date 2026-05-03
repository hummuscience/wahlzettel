import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'ruesselsheim-kav',
  slug: 'ruesselsheim-kav',
  shareTypeCode: 30,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-15',
  region: { land: 'HE', gemeinde: 'Rüsselsheim am Main' },

  totalStimmen: 21,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: false,
  candidateNumbering: 'list-prefix',
  listenkreuzMode: 'cycling',

  themeColor: '#003399',
  themeColorLight: '#e3f2fd',
  themeColorDark: '#002266',

  dataFile: 'ruesselsheim-kav.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.ruesselsheim.de/rathaus/wahlen/',
};

export default config;
