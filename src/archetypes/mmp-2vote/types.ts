export type { Mmp2VoteConfig } from '../../elections/types';

export interface Mmp2VoteState {
  selectedWahlkreis: number | null;
  erststimme: string | null;       // candidateId
  zweitstimme: number | null;      // listNumber
}

export type Mmp2VoteAction =
  | { type: 'SET_WAHLKREIS'; wahlkreis: number }
  | { type: 'SET_ERSTSTIMME'; candidateId: string | null }
  | { type: 'SET_ZWEITSTIMME'; listNumber: number | null }
  | { type: 'RESET' }
  | { type: 'LOAD_STATE'; state: Mmp2VoteState };
