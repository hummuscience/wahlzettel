// --- Data types (loaded from JSON) ---

export interface Candidate {
  id: string;
  position: number;
  lastName: string;
  firstName: string;
  profession: string;
  birthYear?: number;
  birthPlace?: string;
}

export interface Party {
  listNumber: number;
  shortName: string;
  fullName: string;
  candidateCount: number;
  candidates: Candidate[];
}

export interface ElectionData {
  election: 'stvv' | 'ortsbeirat' | 'kav';
  name: string;
  totalStimmen: number;
  maxPerCandidate: number;
  parties: Party[];
}

// --- Vote state types ---

export interface CandidateVote {
  candidateId: string;
  partyListNumber: number;
  stimmen: number; // 0, 1, 2, or 3
}

export interface ListSelection {
  partyListNumber: number;
  isSelected: boolean;
  struckCandidateIds: string[];
}

export interface VoteState {
  candidateVotes: Record<string, CandidateVote>;
  listSelections: Record<number, ListSelection>;
}

export interface DerivedVoteState {
  totalStimmenUsed: number;
  stimmenRemaining: number;
  stimmenPerParty: Record<number, number>;
  isValid: boolean;
  isComplete: boolean;
  isOverLimit: boolean;
}

// --- Reducer actions ---

export type VoteAction =
  | { type: 'TOGGLE_CANDIDATE_VOTE'; candidateId: string; partyListNumber: number }
  | { type: 'SET_CANDIDATE_VOTES'; candidateId: string; partyListNumber: number; stimmen: number }
  | { type: 'TOGGLE_LIST_VOTE'; partyListNumber: number }
  | { type: 'STRIKE_CANDIDATE'; candidateId: string; partyListNumber: number }
  | { type: 'RESET_BALLOT' }
  | { type: 'LOAD_STATE'; state: VoteState };
