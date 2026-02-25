// Fallback party colors shared across elections.
// Components should prefer using useElection().partyColors when possible.
// Election-specific parties stay in their respective parties.ts files.
const PARTY_COLORS: Record<string, string> = {
  // Major parties (appear in most elections)
  'CDU': '#000000',
  'CSU': '#000000',
  'SPD': '#e3000f',
  'GRÜNE': '#1AA037',
  'FDP': '#ffed00',
  'AfD': '#009ee0',
  'Die Linke': '#be3075',
  'DIE LINKE': '#be3075',
  'BSW': '#4C0B5F',
  'Volt': '#502379',
  'FREIE WÄHLER': '#f7a800',
  'Die PARTEI': '#b5152b',
  'Tierschutzpartei': '#06ABAA',
  'PIRATEN': '#FE7400',
  'ÖDP': '#f58220',
  'MERA25': '#ef4f24',
  // Frankfurt shared (STVV + KAV)
  'BFF': '#f29400',
  'IBF': '#ff8c00',
  'BIG': '#193D8B',
  'DFRA': '#c41e3a',
  'GUG': '#F4EA00',
  'ÖkoLinX': '#e60000',
  'ELF': '#CC1919',
  'Gartenpartei Ffm': '#004001',
  'Frankfurt-Sozial!': '#d32f2f',
  // Frankfurt KAV parties
  'SL': '#b22222',
  'A.I.V.': '#2e8b57',
  'IFL': '#4682b4',
  'LiberD': '#daa520',
  'UD': '#0057b7',
  'DABEI': '#8b4513',
  'WIF': '#6a5acd',
  'LM': '#dc143c',
  'PAU': '#20b2aa',
  'IND': '#ff6600',
  'ANA': '#c71585',
  'AFG': '#228b22',
  'DIALOGINITIATIVE': '#cd5c5c',
  'CL': '#b8860b',
};

export function getPartyColor(shortName: string, electionColors?: Record<string, string>): string {
  if (electionColors) {
    return electionColors[shortName] ?? PARTY_COLORS[shortName] ?? '#9ca3af';
  }
  return PARTY_COLORS[shortName] ?? '#9ca3af';
}
