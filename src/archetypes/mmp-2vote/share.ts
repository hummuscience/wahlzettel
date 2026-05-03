import type { Mmp2VoteState } from './types';

export function encodeMmp2VoteState(_state: Mmp2VoteState): string {
  // TODO: implement in Task 1.6 alongside Süd-Kommunal share extraction.
  // For Wave 1, BW Landtagswahl ballots cannot be shared via URL.
  return '';
}

export function decodeMmp2VoteState(_serialized: string): Mmp2VoteState {
  return { selectedWahlkreis: null, erststimme: null, zweitstimme: null };
}
