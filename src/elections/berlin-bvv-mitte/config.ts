import type { ClosedListConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ClosedListConfig = {
  id: 'berlin-bvv-mitte',
  slug: 'berlin-bvv-mitte',
  shareTypeCode: 49,
  ballotKind: 'closed-list',

  level: 'sub-kommunal',
  date: '2026-09-20',
  region: { land: 'BE', bezirk: 'Mitte' },

  threshold: 3,
  seatMethod: 'dhondt',

  themeColor: '#e30613',
  themeColorLight: '#fde7e8',
  themeColorDark: '#a3050d',

  dataFile: 'berlin-bvv-mitte.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.berlin.de/wahlen/wahlen/berliner-wahlen-2026/',
};

export default config;
