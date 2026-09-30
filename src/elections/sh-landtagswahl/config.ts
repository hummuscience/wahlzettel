import type { Mmp2VoteConfig } from '../types';
import { PARTY_COLORS } from './parties';

// LWahlG SH: 2 Stimmen, 69 Sitze (35 Wahlkreise), 5 %-Hürde – gilt nicht für
// den SSW (dänische Minderheit); Sainte-Laguë/Schepers, Mehrsitze + Ausgleich.
// Grundmandatsklausel (1 Direktmandat) laut wahlrecht.de, nicht primär geprüft.
const config: Mmp2VoteConfig = {
  id: 'sh-landtagswahl',
  slug: 'sh-landtagswahl',
  shareTypeCode: 62,
  ballotKind: 'mmp-2vote',

  level: 'land',
  date: '2027-04-18',
  region: { land: 'SH' },

  threshold: 5,
  grundmandatsklausel: 1,
  seatMethod: 'sainteLague',
  minorityExempt: true,
  hasOverhang: true,
  combinedBallot: true,
  hasBezirkslisten: false,

  themeColor: '#003a78',
  themeColorLight: '#e6edf5',
  themeColorDark: '#002550',

  dataFile: 'sh-landtagswahl.json',
  partyColors: PARTY_COLORS,
  // Einreichung bis 22.02.2027; Zulassungstermin geschätzt
  candidatesExpected: '2027-03-05',
  infoUrl: 'https://www.schleswig-holstein.de/DE/landesregierung/themen/demokratie-gesellschaft/wahlen/Wahlen-in-SH/Landtagswahl/landtagswahlen_node',
};

export default config;
