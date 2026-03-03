import { useReducer, useMemo, useCallback } from 'react';
import type { ElectionData, VoteState, VoteAction, DerivedVoteState } from '../types';
import { calculateDerivedState, calculateListVoteDistribution, calculateBayernListDistribution, getEffectiveStimmen } from '../utils/voteCalculator';

const initialState: VoteState = {
  candidateVotes: {},
  listSelections: {},
};

function createVoteReducer(allowMultipleListVotes: boolean) {
  return function voteReducer(state: VoteState, action: VoteAction): VoteState {
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

        // Preserve any pre-existing strikeouts from before the list was crossed
        const existingStrikes = existing?.struckCandidateIds || [];

        if (allowMultipleListVotes) {
          // Bayern: keep other list selections, add this one
          return {
            ...state,
            listSelections: {
              ...state.listSelections,
              [action.partyListNumber]: {
                partyListNumber: action.partyListNumber,
                isSelected: true,
                struckCandidateIds: existingStrikes,
              },
            },
          };
        }

        // Hessen: deactivate any other list vote first (only one list allowed)
        const clearedSelections: Record<number, never> = {};

        return {
          ...state,
          listSelections: {
            ...clearedSelections,
            [action.partyListNumber]: {
              partyListNumber: action.partyListNumber,
              isSelected: true,
              struckCandidateIds: existingStrikes,
            },
          },
        };
      }

      case 'STRIKE_CANDIDATE': {
        const selection = state.listSelections[action.partyListNumber] || {
          isSelected: false,
          struckCandidateIds: [],
        };

        const struckSet = new Set(selection.struckCandidateIds);
        const wasStruck = struckSet.has(action.candidateId);
        if (wasStruck) {
          struckSet.delete(action.candidateId);
        } else {
          struckSet.add(action.candidateId);
        }

        // When striking without a list vote, also clear individual votes
        let newCandidateVotes = state.candidateVotes;
        if (!selection.isSelected && !wasStruck && state.candidateVotes[action.candidateId]) {
          const { [action.candidateId]: _, ...rest } = state.candidateVotes;
          newCandidateVotes = rest;
        }

        return {
          ...state,
          candidateVotes: newCandidateVotes,
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

      case 'LOAD_STATE':
        return action.state;

      default:
        return state;
    }
  };
}

export function useVoteState(electionData: ElectionData | null, allowMultipleListVotes = false) {
  const reducer = useMemo(() => createVoteReducer(allowMultipleListVotes), [allowMultipleListVotes]);
  const [state, dispatch] = useReducer(reducer, initialState);

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
    return calculateDerivedState(state, electionData, allowMultipleListVotes);
  }, [state, electionData, allowMultipleListVotes]);

  const getListAllocation = useCallback(
    (partyListNumber: number): Record<string, number> | null => {
      if (!electionData) return null;
      const selection = state.listSelections[partyListNumber];
      if (!selection?.isSelected) return null;

      const party = electionData.parties.find(p => p.listNumber === partyListNumber);
      if (!party) return null;

      if (allowMultipleListVotes) {
        // Bayern §75: check interaction of individual votes and list crosses
        let individualTotal = 0;
        for (const vote of Object.values(state.candidateVotes)) {
          individualTotal += vote.stimmen;
        }

        const selectedListCount = Object.values(state.listSelections).filter(s => s.isSelected).length;

        if (individualTotal > 0 && selectedListCount > 1) {
          // §75.5c: Multiple list crosses + individual votes → lists ignored
          return null;
        }

        if (individualTotal > 0) {
          // §75.5a: Exactly one list cross + individual votes → Reststimmen only
          const reststimmen = electionData.totalStimmen - individualTotal;
          if (reststimmen <= 0) return null;

          const allocation: Record<string, number> = {};
          const struckSet = new Set(selection.struckCandidateIds);
          let remaining = reststimmen;

          for (const candidate of party.candidates) {
            if (remaining <= 0) break;
            if (struckSet.has(candidate.id)) continue;
            const vote = state.candidateVotes[candidate.id];
            if (vote && vote.stimmen > 0) continue;
            allocation[candidate.id] = 1;
            remaining--;
          }

          return Object.keys(allocation).length > 0 ? allocation : null;
        }

        // No individual votes: list cross works normally (1 Stimme per eligible candidate)
        return calculateBayernListDistribution(
          party,
          selection.struckCandidateIds,
          state.candidateVotes,
        );
      }

      // Hessen: cycling with full remaining budget
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
    [state, electionData, allowMultipleListVotes],
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
      if (allowMultipleListVotes) {
        // Bayern: individual votes are always valid up to totalStimmen,
        // regardless of list crosses (§75 GLKrWO)
        let individualTotal = 0;
        for (const vote of Object.values(state.candidateVotes)) {
          individualTotal += vote.stimmen;
        }
        if (!electionData || individualTotal >= electionData.totalStimmen) return false;
      } else {
        if (derived.stimmenRemaining <= 0) return false;
      }
      const current = state.candidateVotes[candidateId]?.stimmen || 0;
      return current < 3;
    },
    [derived.stimmenRemaining, state.candidateVotes, allowMultipleListVotes, electionData],
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
