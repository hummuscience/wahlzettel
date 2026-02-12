const PARTY_COLORS: Record<string, string> = {
  'CDU': '#000000',
  'AfD': '#009ee0',
  'SPD': '#e3000f',
  'GRÜNE': '#46962b',
  'FDP': '#ffed00',
  'Die Linke': '#be3075',
  'Volt': '#562883',
  'BFF': '#0072bc',
  'Die PARTEI': '#b5152b',
  'ÖkoLinX': '#e60000',
  'ELF': '#1e3a5f',
  'IBF': '#ff8c00',
  'BIG': '#193D8B',
  'Gartenpartei Ffm': '#228b22',
  'PIRATEN': '#ff8800',
  'FREIE WÄHLER': '#f7a800',
  'DFRA': '#c41e3a',
  'MERA25': '#e41e20',
  'Tierschutzpartei': '#00529c',
  'GUG': '#4caf50',
  'Frankfurt-Sozial!': '#d32f2f',
  'BSW': '#731331',
};

export function getPartyColor(shortName: string): string {
  return PARTY_COLORS[shortName] ?? '#9ca3af';
}
