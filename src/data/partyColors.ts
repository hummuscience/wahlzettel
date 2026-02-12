const PARTY_COLORS: Record<string, string> = {
  'CDU': '#000000',
  'AfD': '#009ee0',
  'SPD': '#e3000f',
  'GRÜNE': '#1AA037',
  'FDP': '#ffed00',
  'Die Linke': '#be3075',
  'Volt': '#502379',
  'BFF': '#f29400',
  'Die PARTEI': '#b5152b',
  'ÖkoLinX': '#e60000',
  'ELF': '#CC1919',
  'IBF': '#ff8c00',
  'BIG': '#193D8B',
  'Gartenpartei Ffm': '#004001',
  'PIRATEN': '#FE7400',
  'FREIE WÄHLER': '#f7a800',
  'DFRA': '#c41e3a',
  'MERA25': '#0072e5',
  'Tierschutzpartei': '#06ABAA',
  'GUG': '#F4EA00',
  'Frankfurt-Sozial!': '#d32f2f',
  'BSW': '#4C0B5F',
};

export function getPartyColor(shortName: string): string {
  return PARTY_COLORS[shortName] ?? '#9ca3af';
}
