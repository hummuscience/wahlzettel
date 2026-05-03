import { useReducer } from 'react';
import type { Mmp2VoteState, Mmp2VoteAction } from './types';

const initialState: Mmp2VoteState = {
  selectedWahlkreis: null,
  erststimme: null,
  zweitstimme: null,
};

/**
 * Reducer for Mmp-2vote state. Wired into Ballot.tsx in Wave 2.2; currently
 * exported but unused — Ballot.tsx still uses local useState until then.
 */
function reducer(state: Mmp2VoteState, action: Mmp2VoteAction): Mmp2VoteState {
  switch (action.type) {
    case 'SET_WAHLKREIS':
      return { ...state, selectedWahlkreis: action.wahlkreis, erststimme: null };
    case 'SET_ERSTSTIMME':
      return { ...state, erststimme: action.candidateId };
    case 'SET_ZWEITSTIMME':
      return { ...state, zweitstimme: action.listNumber };
    case 'RESET':
      return initialState;
    case 'LOAD_STATE':
      return action.state;
    default:
      return state;
  }
}

export function useMmp2VoteState() {
  const [state, dispatch] = useReducer(reducer, initialState);
  return { state, dispatch };
}

export { reducer as mmp2VoteReducer, initialState as mmp2VoteInitialState };
