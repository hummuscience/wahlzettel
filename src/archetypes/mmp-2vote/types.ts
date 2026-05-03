export type { Mmp2VoteConfig } from '../../elections/types';

export interface Mmp2VoteState {
  selectedWahlkreis: number | null;
  erststimme: string | null;        // candidateId
  zweitstimme: { listType: 'landesliste' | 'bezirksliste'; listNumber: number } | null;
}

export type Mmp2VoteAction =
  | { type: 'SET_WAHLKREIS'; wahlkreis: number }
  | { type: 'SET_ERSTSTIMME'; candidateId: string | null }
  | { type: 'SET_ZWEITSTIMME'; listType: 'landesliste' | 'bezirksliste'; listNumber: number }
  | { type: 'CLEAR_ZWEITSTIMME' }
  | { type: 'CLEAR_WAHLKREIS' }
  | { type: 'RESET' }
  | { type: 'LOAD_STATE'; state: Mmp2VoteState };
