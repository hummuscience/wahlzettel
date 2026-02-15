export interface ElectionConfig {
  id: string;                    // 'frankfurt-stvv'
  slug: string;                  // URL path segment
  shareTypeCode: number;         // For binary share encoding (0-15)

  // Rules
  totalStimmen: number;          // 93, 37, etc.
  maxPerCandidate: number;       // 3
  allowListVote: boolean;

  // Display
  themeColor: string;            // '#003870' (CSS variable)
  themeColorLight: string;       // '#e8f0f8'
  themeColorDark: string;        // '#002650'

  // Data
  dataFile: string;              // 'frankfurt-stvv.json'
  partyColors: Record<string, string>;

  // Info links
  infoUrl?: string;              // 'https://frankfurt.de/wahlen'
}
