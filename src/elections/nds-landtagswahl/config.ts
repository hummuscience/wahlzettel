import type { Mmp2VoteConfig } from '../types';
import { PARTY_COLORS } from './parties';

// NLWG (Änderung März 2026): 2 Stimmen, ≥135 Sitze, jetzt 90 Wahlkreise,
// 5 %-Hürde, ab 2027 Sainte-Laguë/Schepers statt d'Hondt; Überhang + Ausgleich.
const config: Mmp2VoteConfig = {
  id: 'nds-landtagswahl',
  slug: 'nds-landtagswahl',
  shareTypeCode: 64,
  ballotKind: 'mmp-2vote',

  level: 'land',
  date: '2027-09-26',
  region: { land: 'NI' },

  threshold: 5,
  grundmandatsklausel: null,
  seatMethod: 'sainteLague',
  hasOverhang: true,
  combinedBallot: true,
  hasBezirkslisten: false,

  themeColor: '#c8102e',
  themeColorLight: '#fbe8eb',
  themeColorDark: '#8c0b20',

  dataFile: 'nds-landtagswahl.json',
  partyColors: PARTY_COLORS,
  // geschätzt analog 2022 (Zulassung 12 Tage nach Einreichungsfrist)
  candidatesExpected: '2027-07-30',
  infoUrl: 'https://landeswahlleiter.niedersachsen.de/startseite/wahlen/landtagswahl/landtagswahl_2027/landtagswahl-2027-249534.html',
};

export default config;
