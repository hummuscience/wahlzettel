// Re-export the config type from the central union and the existing vote-state
// shapes for ergonomics in this archetype.
export type { SuedKommunalConfig } from '../../elections/types';
export type {
  VoteState as SuedKommunalState,
  VoteAction as SuedKommunalAction,
  CandidateVote,
  ListSelection,
  DerivedVoteState,
} from '../../types';
