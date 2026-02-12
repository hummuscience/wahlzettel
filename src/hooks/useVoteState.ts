import { useReducer, useMemo, useCallback } from 'react';
import type { ElectionData, VoteState, VoteAction, DerivedVoteState } from '../types';
import { calculateDerivedState, calculateListVoteDistribution, getEffectiveStimmen } from '../utils/voteCalculator';

const initialState: VoteState = {
  candidateVotes: {},
  listSelections: {},
};

function voteReducer(state: VoteState, action: VoteAction): VoteState {
  switch (action.type) {
    case 'TOGGLE_CANDIDATE_VOTE': {
      const existing = state.candidateVotes[action.candidateId];
      const currentStimmen = existing?.stimmen || 0;
      const newStimmen = currentStimmen >= 3 ? 0 : currentStimmen + 1;

      if (newStimmen === 0) {
        const { [action.candidateId]: _, ...rest } = state.candidateVotes;
        return { ...state, candidateVotes: rest };
      }

      return {
        ...state,
        candidateVotes: {
          ...state.candidateVotes,
          [action.candidateId]: {
            candidateId: action.candidateId,
            partyListNumber: action.partyListNumber,
            stimmen: newStimmen,
          },
        },
      };
    }

    case 'SET_CANDIDATE_VOTES': {
      if (action.stimmen === 0) {
        const { [action.candidateId]: _, ...rest } = state.candidateVotes;
        return { ...state, candidateVotes: rest };
      }
      return {
        ...state,
        candidateVotes: {
          ...state.candidateVotes,
          [action.candidateId]: {
            candidateId: action.candidateId,
            partyListNumber: action.partyListNumber,
            stimmen: Math.min(3, Math.max(0, action.stimmen)),
          },
        },
      };
    }

    case 'TOGGLE_LIST_VOTE': {
      const existing = state.listSelections[action.partyListNumber];
      const isCurrentlySelected = existing?.isSelected || false;

      if (isCurrentlySelected) {
        const { [action.partyListNumber]: _, ...rest } = state.listSelections;
        return { ...state, listSelections: rest };
      }

      // Deactivate any other list vote first (only one list allowed)
      const clearedSelections: Record<number, never> = {};

      return {
        ...state,
        listSelections: {
          ...clearedSelections,
          [action.partyListNumber]: {
            partyListNumber: action.partyListNumber,
            isSelected: true,
            struckCandidateIds: [],
          },
        },
      };
    }

    case 'STRIKE_CANDIDATE': {
      const selection = state.listSelections[action.partyListNumber];
      if (!selection?.isSelected) return state;

      const struckSet = new Set(selection.struckCandidateIds);
      if (struckSet.has(action.candidateId)) {
        struckSet.delete(action.candidateId);
      } else {
        struckSet.add(action.candidateId);
      }

      return {
        ...state,
        listSelections: {
          ...state.listSelections,
          [action.partyListNumber]: {
            ...selection,
            struckCandidateIds: Array.from(struckSet),
          },
        },
      };
    }

    case 'RESET_BALLOT':
      return initialState;

    default:
      return state;
  }
}

export function useVoteState(electionData: ElectionData | null) {
  const [state, dispatch] = useReducer(voteReducer, initialState);

  const derived: DerivedVoteState = useMemo(() => {
    if (!electionData) {
      return {
        totalStimmenUsed: 0,
        stimmenRemaining: 0,
        stimmenPerParty: {},
        isValid: true,
        isComplete: false,
        isOverLimit: false,
      };
    }
    return calculateDerivedState(state, electionData);
  }, [state, electionData]);

  const getListAllocation = useCallback(
    (partyListNumber: number): Record<string, number> | null => {
      if (!electionData) return null;
      const selection = state.listSelections[partyListNumber];
      if (!selection?.isSelected) return null;

      const party = electionData.parties.find(p => p.listNumber === partyListNumber);
      if (!party) return null;

      let individualTotal = 0;
      for (const vote of Object.values(state.candidateVotes)) {
        individualTotal += vote.stimmen;
      }

      const budgetForList = electionData.totalStimmen - individualTotal;
      if (budgetForList <= 0) return null;

      return calculateListVoteDistribution(
        party,
        selection.struckCandidateIds,
        state.candidateVotes,
        budgetForList,
      );
    },
    [state, electionData],
  );

  const getCandidateEffectiveVotes = useCallback(
    (candidateId: string, partyListNumber: number): number => {
      const listAlloc = getListAllocation(partyListNumber);
      return getEffectiveStimmen(candidateId, state.candidateVotes, listAlloc);
    },
    [state.candidateVotes, getListAllocation],
  );

  const canAddVote = useCallback(
    (candidateId: string): boolean => {
      if (derived.stimmenRemaining <= 0) return false;
      const current = state.candidateVotes[candidateId]?.stimmen || 0;
      return current < 3;
    },
    [derived.stimmenRemaining, state.candidateVotes],
  );

  const isListVoteActive = useCallback(
    (partyListNumber: number): boolean => {
      return state.listSelections[partyListNumber]?.isSelected || false;
    },
    [state.listSelections],
  );

  const isCandidateStruck = useCallback(
    (candidateId: string, partyListNumber: number): boolean => {
      const selection = state.listSelections[partyListNumber];
      if (!selection?.isSelected) return false;
      return selection.struckCandidateIds.includes(candidateId);
    },
    [state.listSelections],
  );

  const resetBallot = useCallback(() => {
    dispatch({ type: 'RESET_BALLOT' });
  }, []);

  return {
    state,
    derived,
    dispatch,
    getCandidateEffectiveVotes,
    getListAllocation,
    canAddVote,
    isListVoteActive,
    isCandidateStruck,
    resetBallot,
  };
}
