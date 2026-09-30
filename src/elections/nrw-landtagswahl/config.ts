import type { Mmp2VoteConfig } from '../types';
import { PARTY_COLORS } from './parties';

// LWahlG NRW: 2 Stimmen, ≥181 Sitze (128 Wahlkreise), 5 %-Hürde,
// Sainte-Laguë/Schepers mit vollem Ausgleich. Wahlalter erstmals 16.
const config: Mmp2VoteConfig = {
  id: 'nrw-landtagswahl',
  slug: 'nrw-landtagswahl',
  shareTypeCode: 63,
  ballotKind: 'mmp-2vote',

  level: 'land',
  date: '2027-04-25',
  region: { land: 'NW' },

  threshold: 5,
  grundmandatsklausel: null,
  seatMethod: 'sainteLague',
  hasOverhang: true,
  combinedBallot: true,
  hasBezirkslisten: false,

  themeColor: '#007a3d',
  themeColorLight: '#e6f4ec',
  themeColorDark: '#00522a',

  dataFile: 'nrw-landtagswahl.json',
  partyColors: PARTY_COLORS,
  // Landeswahlausschuss entscheidet bis 26.02.2027 (MB.NRW 2026 Nr. 129)
  candidatesExpected: '2027-02-26',
  infoUrl: 'https://www.im.nrw/landtagswahl-2027-am-25-april-2027',
};

export default config;
