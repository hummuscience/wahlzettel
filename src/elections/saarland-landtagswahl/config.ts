import type { ClosedListConfig } from '../types';
import { PARTY_COLORS } from './parties';

// LWahlG Saarland: 1 Stimme für Kreis- und Landeswahlvorschlag einer Partei
// (§ 10), 51 Sitze, 5 %-Hürde, d'Hondt (§ 38), keine Überhang-/Ausgleichsmandate.
const config: ClosedListConfig = {
  id: 'saarland-landtagswahl',
  slug: 'saarland-landtagswahl',
  shareTypeCode: 61,
  ballotKind: 'closed-list',

  level: 'land',
  date: '2027-04-18',
  region: { land: 'SL' },

  threshold: 5,
  seatMethod: 'dhondt',

  themeColor: '#005ca9',
  themeColorLight: '#e6f0f9',
  themeColorDark: '#003e73',

  dataFile: 'saarland-landtagswahl.json',
  partyColors: PARTY_COLORS,
  // LWahlG § 24(2): Bekanntmachung spätestens am 48. Tag vor der Wahl
  candidatesExpected: '2027-03-01',
  infoUrl: 'https://www.saarland.de/landeswahlleiterin/home/home_node.html',
};

export default config;
