// Discriminator for every supported ballot type.
export type BallotKind =
  | 'sued-kommunal'
  | 'ost-kommunal'
  | 'mmp-2vote'
  | 'closed-list'
  | 'closed-list-direkt'
  | 'hamburg-2x5'
  | 'bremen-1x5'
  | 'bayern-landtag'
  | 'single-candidate'
  | 'referendum';

export interface ElectionBase {
  id: string;
  slug: string;
  shareTypeCode: number;
  ballotKind: BallotKind;

  level: 'bund' | 'land' | 'kommunal' | 'sub-kommunal' | 'referendum';
  date: string;                  // ISO yyyy-mm-dd
  region: { land: string; bezirk?: string; gemeinde?: string };

  themeColor: string;
  themeColorLight: string;
  themeColorDark: string;
  dataFile: string;
  partyColors: Record<string, string>;
  infoUrl?: string;
}

// Süd-Kommunal: N≈seats votes, kumulieren ≤3, panaschieren, striking, Listenkreuz.
export interface SuedKommunalConfig extends ElectionBase {
  ballotKind: 'sued-kommunal';
  totalStimmen: number;
  maxPerCandidate: 3;
  allowListVote: boolean;
  allowMultipleListVotes: boolean;
  candidateNumbering?: 'list-prefix';
  listenkreuzMode: 'cycling' | 'perCandidateOnce';
}

// MMP 2-vote: Erststimme + Zweitstimme on a single combined ballot.
export interface Mmp2VoteConfig extends ElectionBase {
  ballotKind: 'mmp-2vote';
  threshold: number;             // 0 or 5
  grundmandatsklausel: number | null;
  seatMethod: 'dhondt' | 'hareNiemeyer' | 'sainteLague';
  minorityExempt?: boolean;
  hasOverhang: boolean;
  combinedBallot: boolean;       // true for Berlin 2026, also for Bund
  hasBezirkslisten: boolean;     // Berlin: yes; Bund: no (Landeslisten only)
}

// Closed list: one X for one party list. Trivial.
export interface ClosedListConfig extends ElectionBase {
  ballotKind: 'closed-list';
  threshold: number;
  seatMethod: 'dhondt' | 'hareNiemeyer' | 'sainteLague';
}

// Stubs for archetypes not implemented in Wave 1/2. Empty marker interfaces;
// fields filled in when implemented (Wave 3).
export interface OstKommunalConfig extends ElectionBase {
  ballotKind: 'ost-kommunal';
}
export interface ClosedListDirektConfig extends ElectionBase {
  ballotKind: 'closed-list-direkt';
}
export interface Hamburg2x5Config extends ElectionBase {
  ballotKind: 'hamburg-2x5';
}
export interface Bremen1x5Config extends ElectionBase {
  ballotKind: 'bremen-1x5';
}
export interface BayernLandtagConfig extends ElectionBase {
  ballotKind: 'bayern-landtag';
}
export interface SingleCandidateConfig extends ElectionBase {
  ballotKind: 'single-candidate';
}
export interface ReferendumConfig extends ElectionBase {
  ballotKind: 'referendum';
}

export type ElectionConfig =
  | SuedKommunalConfig
  | OstKommunalConfig
  | Mmp2VoteConfig
  | ClosedListConfig
  | ClosedListDirektConfig
  | Hamburg2x5Config
  | Bremen1x5Config
  | BayernLandtagConfig
  | SingleCandidateConfig
  | ReferendumConfig;
