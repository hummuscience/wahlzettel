export type { ClosedListConfig } from '../../elections/types';

export interface ClosedListState {
  choice: number | null;            // listNumber, or null for "no vote yet"
}

export type ClosedListAction =
  | { type: 'SET_CHOICE'; listNumber: number }
  | { type: 'CLEAR' }
  | { type: 'RESET' }
  | { type: 'LOAD_STATE'; state: ClosedListState };
