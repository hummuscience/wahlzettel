import type { Mmp2VoteConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: Mmp2VoteConfig = {
  id: 'berlin-abgh',
  slug: 'berlin-abgh',
  shareTypeCode: 48,
  ballotKind: 'mmp-2vote',

  level: 'land',
  date: '2026-09-20',
  region: { land: 'BE' },

  threshold: 5,
  grundmandatsklausel: 1,
  seatMethod: 'hareNiemeyer',
  hasOverhang: true,
  combinedBallot: true,
  hasBezirkslisten: true,

  themeColor: '#e30613',
  themeColorLight: '#fde7e8',
  themeColorDark: '#a3050d',

  dataFile: 'berlin-abgh.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.berlin.de/wahlen/wahlen/berliner-wahlen-2026/',
};

export default config;
