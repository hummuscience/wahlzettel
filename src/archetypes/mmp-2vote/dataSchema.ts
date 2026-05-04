export interface Mmp2VoteCandidate {
  id: string;
  party: string;
  lastName: string;
  firstName: string;
  profession: string;
  birthYear?: number;
}

export interface Mmp2VoteWahlkreis {
  number: number;
  name: string;
  bezirk?: string;                  // Berlin only: which Bezirk this WK belongs to
  candidates: Mmp2VoteCandidate[];
}

export interface Mmp2VoteListe {
  listNumber: number;
  shortName: string;
  fullName: string;
  type: 'landesliste' | 'bezirksliste';
  bezirk?: string;                  // for bezirksliste
  candidates: { position: number; lastName: string; firstName: string; profession: string }[];
}

export interface Mmp2VoteData {
  election: string;
  type: string;
  name: string;
  date: string;
  wahlkreise: Mmp2VoteWahlkreis[];
  listen: Mmp2VoteListe[];          // landesliste(n) + bezirkslisten if config.hasBezirkslisten
}
