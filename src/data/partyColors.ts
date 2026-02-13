const PARTY_COLORS: Record<string, string> = {
  // Shared parties (STVV + KAV)
  'CDU': '#000000',
  'SPD': '#e3000f',
  'GRÜNE': '#1AA037',
  'FDP': '#ffed00',
  'Die Linke': '#be3075',
  'Volt': '#502379',
  'BFF': '#f29400',
  'IBF': '#ff8c00',
  'BIG': '#193D8B',
  'FREIE WÄHLER': '#f7a800',
  'DFRA': '#c41e3a',
  'GUG': '#F4EA00',
  // STVV-only parties
  'AfD': '#009ee0',
  'Die PARTEI': '#b5152b',
  'ÖkoLinX': '#e60000',
  'ELF': '#CC1919',
  'Gartenpartei Ffm': '#004001',
  'PIRATEN': '#FE7400',
  'MERA25': '#0072e5',
  'Tierschutzpartei': '#06ABAA',
  'Frankfurt-Sozial!': '#d32f2f',
  'BSW': '#4C0B5F',
  // KAV-only parties
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

export function getPartyColor(shortName: string): string {
  return PARTY_COLORS[shortName] ?? '#9ca3af';
}
