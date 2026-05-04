import { useReducer } from 'react';
import type { ClosedListState, ClosedListAction } from './types';

const initialState: ClosedListState = { choice: null };

function reducer(state: ClosedListState, action: ClosedListAction): ClosedListState {
  switch (action.type) {
    case 'SET_CHOICE':
      return { choice: action.listNumber };
    case 'CLEAR':
      return { choice: null };
    case 'RESET':
      return initialState;
    case 'LOAD_STATE':
      return action.state;
    default:
      return state;
  }
}

export function useClosedListState() {
  const [state, dispatch] = useReducer(reducer, initialState);
  return { state, dispatch };
}

export {
  reducer as closedListReducer,
  initialState as closedListInitialState,
};
