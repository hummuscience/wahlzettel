import type { Mmp2VoteConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: Mmp2VoteConfig = {
  id: 'bw-landtagswahl',
  slug: 'bw-landtagswahl',
  shareTypeCode: 22,
  ballotKind: 'mmp-2vote',

  level: 'land',
  date: '2026-03-08',
  region: { land: 'BW' },

  threshold: 5,
  grundmandatsklausel: null,
  seatMethod: 'sainteLague',
  hasOverhang: true,
  combinedBallot: true,
  hasBezirkslisten: false,

  themeColor: '#d4a017',
  themeColorLight: '#fdf6e3',
  themeColorDark: '#8b6914',

  dataFile: 'bw-landtagswahl.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.landtagswahl-bw.de',
};

export default config;
